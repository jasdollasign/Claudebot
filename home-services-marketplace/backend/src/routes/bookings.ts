import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const SERVICE_RATES: Record<string, number> = {
  cleaning: 80,
  handyman: 95,
  landscaping: 75,
  pet_sitting: 45,
  home_check: 60,
  other: 70,
};

// Get bookings (filtered by role)
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { status, serviceType, fromDate, toDate } = req.query;
  const { userId, role } = req.user!;

  let query = `
    SELECT b.*,
      p.name as property_name, p.address as property_address, p.city as property_city,
      u_owner.first_name as owner_first_name, u_owner.last_name as owner_last_name, u_owner.email as owner_email,
      u_prov.first_name as provider_first_name, u_prov.last_name as provider_last_name, u_prov.email as provider_email,
      pp.rating as provider_rating
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u_owner ON b.owner_id = u_owner.id
    LEFT JOIN users u_prov ON b.provider_id = u_prov.id
    LEFT JOIN provider_profiles pp ON b.provider_id = pp.user_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role === 'owner') {
    query += ' AND b.owner_id = ?';
    params.push(userId);
  } else if (role === 'provider') {
    query += ' AND (b.provider_id = ? OR (b.status = \'pending\' AND b.provider_id IS NULL))';
    params.push(userId);
  }

  if (status) { query += ' AND b.status = ?'; params.push(status); }
  if (serviceType) { query += ' AND b.service_type = ?'; params.push(serviceType); }
  if (fromDate) { query += ' AND b.scheduled_date >= ?'; params.push(fromDate); }
  if (toDate) { query += ' AND b.scheduled_date <= ?'; params.push(toDate); }

  query += ' ORDER BY b.scheduled_date DESC, b.scheduled_time DESC';

  const bookings = db.prepare(query).all(...params);
  res.json(bookings.map(formatBooking));
});

// Get single booking
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*,
      p.name as property_name, p.address as property_address, p.city as property_city,
      p.access_instructions,
      u_owner.first_name as owner_first_name, u_owner.last_name as owner_last_name, u_owner.email as owner_email, u_owner.phone as owner_phone,
      u_prov.first_name as provider_first_name, u_prov.last_name as provider_last_name, u_prov.email as provider_email, u_prov.phone as provider_phone,
      pp.rating as provider_rating, pp.bio as provider_bio
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u_owner ON b.owner_id = u_owner.id
    LEFT JOIN users u_prov ON b.provider_id = u_prov.id
    LEFT JOIN provider_profiles pp ON b.provider_id = pp.user_id
    WHERE b.id = ?
  `).get(req.params.id) as any;

  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  const { userId, role } = req.user!;
  if (role !== 'admin' && booking.owner_id !== userId && booking.provider_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const messages = db.prepare(`
    SELECT m.*, u.first_name, u.last_name FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.booking_id = ? ORDER BY m.created_at ASC
  `).all(req.params.id);

  res.json({ ...formatBooking(booking), messages });
});

// Create booking
router.post(
  '/',
  requireRole('owner', 'admin'),
  [
    body('propertyId').notEmpty(),
    body('serviceType').isIn(['cleaning', 'handyman', 'landscaping', 'pet_sitting', 'home_check', 'other']),
    body('scheduledDate').isDate(),
    body('scheduledTime').matches(/^\d{2}:\d{2}$/),
    body('estimatedHours').optional().isFloat({ min: 0.5, max: 24 }),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const db = getDb();
    const { propertyId, serviceType, scheduledDate, scheduledTime, estimatedHours, specialInstructions, checklist } = req.body;

    const property = db.prepare('SELECT * FROM properties WHERE id = ? AND owner_id = ?')
      .get(propertyId, req.user!.userId);
    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const hours = estimatedHours || 2;
    const rate = SERVICE_RATES[serviceType] || 70;
    const price = hours * rate;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO bookings (id, property_id, owner_id, service_type, scheduled_date, scheduled_time, estimated_hours, price, special_instructions, checklist)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, propertyId, req.user!.userId, serviceType, scheduledDate, scheduledTime, hours, price, specialInstructions || null, JSON.stringify(checklist || getDefaultChecklist(serviceType)));

    // Create notification for available providers
    createNotification(db, null, 'new_job', 'New Job Available', `New ${serviceType} job posted`, { bookingId: id });

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    res.status(201).json(formatBooking(booking));
  }
);

// Accept booking (provider)
router.post('/:id/accept', requireRole('provider'), (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;

  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
  if (booking.status !== 'pending') { res.status(400).json({ error: 'Booking is not available' }); return; }

  db.prepare(`
    UPDATE bookings SET provider_id = ?, status = 'accepted', updated_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `).run(req.user!.userId, req.params.id);

  createNotification(db, booking.owner_id, 'booking_accepted', 'Booking Accepted', 'Your booking has been accepted by a service provider', { bookingId: req.params.id });

  res.json({ message: 'Booking accepted' });
});

// Start job (provider)
router.post('/:id/start', requireRole('provider'), (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND provider_id = ?')
    .get(req.params.id, req.user!.userId) as any;

  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
  if (booking.status !== 'accepted') { res.status(400).json({ error: 'Cannot start this booking' }); return; }

  const { beforePhotos } = req.body;
  db.prepare(`
    UPDATE bookings SET status = 'in_progress', started_at = datetime('now'),
    before_photos = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(beforePhotos || []), req.params.id);

  createNotification(db, booking.owner_id, 'job_started', 'Job Started', 'Your service provider has started the job', { bookingId: req.params.id });

  res.json({ message: 'Job started' });
});

// Complete job (provider)
router.post('/:id/complete', requireRole('provider'), (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND provider_id = ?')
    .get(req.params.id, req.user!.userId) as any;

  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
  if (booking.status !== 'in_progress') { res.status(400).json({ error: 'Job is not in progress' }); return; }

  const { afterPhotos, checklist } = req.body;
  db.prepare(`
    UPDATE bookings SET status = 'completed', completed_at = datetime('now'),
    after_photos = ?, checklist = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(afterPhotos || []), JSON.stringify(checklist || JSON.parse(booking.checklist)), req.params.id);

  // Trigger payment capture
  const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(req.params.id) as any;
  if (payment) {
    db.prepare(`UPDATE payments SET status = 'captured', paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .run(payment.id);
  }

  createNotification(db, booking.owner_id, 'job_completed', 'Job Completed', 'Your service has been completed! Please leave a review.', { bookingId: req.params.id });

  res.json({ message: 'Job completed' });
});

// Cancel booking
router.post('/:id/cancel', (req: Request, res: Response) => {
  const db = getDb();
  const { userId, role } = req.user!;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;

  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }
  if (role === 'owner' && booking.owner_id !== userId) { res.status(403).json({ error: 'Access denied' }); return; }
  if (role === 'provider' && booking.provider_id !== userId) { res.status(403).json({ error: 'Access denied' }); return; }
  if (['completed', 'cancelled'].includes(booking.status)) {
    res.status(400).json({ error: 'Cannot cancel this booking' }); return;
  }

  const { reason } = req.body;
  db.prepare(`
    UPDATE bookings SET status = 'cancelled', cancellation_reason = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(reason || null, req.params.id);

  const notifyUserId = role === 'owner' ? booking.provider_id : booking.owner_id;
  if (notifyUserId) {
    createNotification(db, notifyUserId, 'booking_cancelled', 'Booking Cancelled', 'A booking has been cancelled', { bookingId: req.params.id });
  }

  res.json({ message: 'Booking cancelled' });
});

// Send message
router.post('/:id/messages', (req: Request, res: Response) => {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id) as any;
  if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }

  const { content } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: 'Message content required' }); return; }

  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, booking_id, sender_id, content) VALUES (?, ?, ?, ?)')
    .run(id, req.params.id, req.user!.userId, content.trim());

  res.status(201).json({ id, content: content.trim(), senderId: req.user!.userId, createdAt: new Date().toISOString() });
});

// Provider stats
router.get('/provider/stats', requireRole('provider'), (req: Request, res: Response) => {
  const db = getDb();
  const { userId } = req.user!;

  const stats = {
    totalJobs: (db.prepare('SELECT COUNT(*) as c FROM bookings WHERE provider_id = ? AND status = \'completed\'').get(userId) as any).c,
    activeJobs: (db.prepare('SELECT COUNT(*) as c FROM bookings WHERE provider_id = ? AND status IN (\'accepted\', \'in_progress\')').get(userId) as any).c,
    pendingJobs: (db.prepare('SELECT COUNT(*) as c FROM bookings WHERE status = \'pending\' AND provider_id IS NULL').get(userId) as any).c,
    totalEarnings: (db.prepare('SELECT COALESCE(SUM(provider_payout), 0) as s FROM payments WHERE provider_id = ? AND status = \'captured\'').get(userId) as any).s,
    monthEarnings: (db.prepare('SELECT COALESCE(SUM(provider_payout), 0) as s FROM payments WHERE provider_id = ? AND status = \'captured\' AND strftime(\'%Y-%m\', paid_at) = strftime(\'%Y-%m\', \'now\')').get(userId) as any).s,
    rating: (db.prepare('SELECT COALESCE(AVG(rating), 0) as r FROM reviews WHERE reviewee_id = ?').get(userId) as any).r,
  };

  res.json(stats);
});

// Owner stats
router.get('/owner/stats', requireRole('owner'), (req: Request, res: Response) => {
  const db = getDb();
  const { userId } = req.user!;

  const stats = {
    totalProperties: (db.prepare('SELECT COUNT(*) as c FROM properties WHERE owner_id = ? AND is_active = 1').get(userId) as any).c,
    totalBookings: (db.prepare('SELECT COUNT(*) as c FROM bookings WHERE owner_id = ?').get(userId) as any).c,
    activeBookings: (db.prepare('SELECT COUNT(*) as c FROM bookings WHERE owner_id = ? AND status IN (\'pending\', \'accepted\', \'in_progress\')').get(userId) as any).c,
    completedBookings: (db.prepare('SELECT COUNT(*) as c FROM bookings WHERE owner_id = ? AND status = \'completed\'').get(userId) as any).c,
    totalSpent: (db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE owner_id = ? AND status = \'captured\'').get(userId) as any).s,
  };

  res.json(stats);
});

function getDefaultChecklist(serviceType: string): any[] {
  const checklists: Record<string, any[]> = {
    cleaning: [
      { id: '1', task: 'Vacuum all floors', done: false },
      { id: '2', task: 'Mop hard floors', done: false },
      { id: '3', task: 'Clean bathrooms', done: false },
      { id: '4', task: 'Clean kitchen', done: false },
      { id: '5', task: 'Change bed linens', done: false },
      { id: '6', task: 'Empty trash bins', done: false },
      { id: '7', task: 'Wipe surfaces', done: false },
    ],
    handyman: [
      { id: '1', task: 'Assess and document issues', done: false },
      { id: '2', task: 'Complete repairs', done: false },
      { id: '3', task: 'Test repaired items', done: false },
      { id: '4', task: 'Clean up work area', done: false },
    ],
    landscaping: [
      { id: '1', task: 'Mow lawn', done: false },
      { id: '2', task: 'Trim edges', done: false },
      { id: '3', task: 'Weed garden beds', done: false },
      { id: '4', task: 'Blow/sweep walkways', done: false },
    ],
    pet_sitting: [
      { id: '1', task: 'Feed pets', done: false },
      { id: '2', task: 'Provide fresh water', done: false },
      { id: '3', task: 'Walk/exercise pets', done: false },
      { id: '4', task: 'Clean litter box', done: false },
      { id: '5', task: 'Check on pet health', done: false },
    ],
    home_check: [
      { id: '1', task: 'Check all entry points secured', done: false },
      { id: '2', task: 'Check for water leaks', done: false },
      { id: '3', task: 'Inspect HVAC', done: false },
      { id: '4', task: 'Check mail/packages', done: false },
      { id: '5', task: 'Take interior photos', done: false },
      { id: '6', task: 'Check exterior condition', done: false },
    ],
  };
  return checklists[serviceType] || [{ id: '1', task: 'Complete assigned tasks', done: false }];
}

function createNotification(db: any, userId: string | null, type: string, title: string, body: string, data: any = {}) {
  if (!userId) return;
  db.prepare('INSERT INTO notifications (id, user_id, type, title, body, data) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), userId, type, title, body, JSON.stringify(data));
}

function formatBooking(b: any) {
  if (!b) return null;
  return {
    id: b.id,
    propertyId: b.property_id,
    propertyName: b.property_name,
    propertyAddress: b.property_address ? `${b.property_address}, ${b.property_city}` : undefined,
    ownerId: b.owner_id,
    ownerName: b.owner_first_name ? `${b.owner_first_name} ${b.owner_last_name}` : undefined,
    ownerEmail: b.owner_email,
    ownerPhone: b.owner_phone,
    providerId: b.provider_id,
    providerName: b.provider_first_name ? `${b.provider_first_name} ${b.provider_last_name}` : undefined,
    providerEmail: b.provider_email,
    providerPhone: b.provider_phone,
    providerRating: b.provider_rating,
    providerBio: b.provider_bio,
    serviceType: b.service_type,
    status: b.status,
    scheduledDate: b.scheduled_date,
    scheduledTime: b.scheduled_time,
    estimatedHours: b.estimated_hours,
    price: b.price,
    specialInstructions: b.special_instructions,
    accessInstructions: b.access_instructions,
    checklist: JSON.parse(b.checklist || '[]'),
    beforePhotos: JSON.parse(b.before_photos || '[]'),
    afterPhotos: JSON.parse(b.after_photos || '[]'),
    startedAt: b.started_at,
    completedAt: b.completed_at,
    cancellationReason: b.cancellation_reason,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

export default router;
