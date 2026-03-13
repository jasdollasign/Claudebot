import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Submit a review for a completed booking
router.post(
  '/',
  [
    body('bookingId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
    body('qualityScore').optional().isInt({ min: 1, max: 5 }),
    body('punctualityScore').optional().isInt({ min: 1, max: 5 }),
    body('communicationScore').optional().isInt({ min: 1, max: 5 }),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const db = getDb();
    const { bookingId, rating, comment, qualityScore, punctualityScore, communicationScore } = req.body;
    const { userId, role } = req.user!;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'completed') {
      res.status(400).json({ error: 'Can only review completed bookings' });
      return;
    }

    if (booking.owner_id !== userId && booking.provider_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const existing = db.prepare('SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?').get(bookingId, userId);
    if (existing) {
      res.status(409).json({ error: 'You have already reviewed this booking' });
      return;
    }

    // Owner reviews provider; provider reviews owner
    const revieweeId = role === 'owner' ? booking.provider_id : booking.owner_id;
    if (!revieweeId) {
      res.status(400).json({ error: 'No one to review' });
      return;
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO reviews (id, booking_id, reviewer_id, reviewee_id, rating, comment, quality_score, punctuality_score, communication_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, bookingId, userId, revieweeId, rating, comment || null, qualityScore || null, punctualityScore || null, communicationScore || null);

    // Update provider rating if owner reviewed provider
    if (role === 'owner' && booking.provider_id) {
      const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?')
        .get(booking.provider_id) as any;
      db.prepare(`
        UPDATE provider_profiles SET rating = ?, total_reviews = ?, total_jobs = total_jobs + 1, updated_at = datetime('now')
        WHERE user_id = ?
      `).run(Math.round(stats.avg_rating * 10) / 10, stats.total, booking.provider_id);
    }

    res.status(201).json({ id, message: 'Review submitted' });
  }
);

// Get reviews for a provider
router.get('/provider/:providerId', (req: Request, res: Response) => {
  const db = getDb();
  const reviews = db.prepare(`
    SELECT r.*,
      u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
      b.service_type, b.scheduled_date
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    JOIN bookings b ON r.booking_id = b.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all(req.params.providerId);

  const summary = db.prepare(`
    SELECT
      AVG(rating) as avg_rating,
      AVG(quality_score) as avg_quality,
      AVG(punctuality_score) as avg_punctuality,
      AVG(communication_score) as avg_communication,
      COUNT(*) as total
    FROM reviews WHERE reviewee_id = ?
  `).get(req.params.providerId) as any;

  res.json({
    reviews: reviews.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      qualityScore: r.quality_score,
      punctualityScore: r.punctuality_score,
      communicationScore: r.communication_score,
      reviewerName: `${r.reviewer_first_name} ${r.reviewer_last_name[0]}.`,
      serviceType: r.service_type,
      serviceDate: r.scheduled_date,
      createdAt: r.created_at,
    })),
    summary: {
      averageRating: Math.round((summary.avg_rating || 0) * 10) / 10,
      averageQuality: Math.round((summary.avg_quality || 0) * 10) / 10,
      averagePunctuality: Math.round((summary.avg_punctuality || 0) * 10) / 10,
      averageCommunication: Math.round((summary.avg_communication || 0) * 10) / 10,
      totalReviews: summary.total,
    },
  });
});

export default router;
