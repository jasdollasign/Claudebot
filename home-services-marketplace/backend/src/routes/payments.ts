import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const PLATFORM_FEE_RATE = 0.15; // 15% platform fee

// Create payment intent for a booking
router.post('/create-intent', async (req: Request, res: Response) => {
  const db = getDb();
  const { bookingId } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND owner_id = ?')
    .get(bookingId, req.user!.userId) as any;

  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  if (booking.status === 'cancelled') {
    res.status(400).json({ error: 'Cannot pay for cancelled booking' });
    return;
  }

  const existingPayment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(bookingId) as any;
  if (existingPayment && existingPayment.status !== 'failed') {
    res.json({
      paymentId: existingPayment.id,
      clientSecret: `pi_mock_${existingPayment.id}_secret`,
      amount: existingPayment.amount,
    });
    return;
  }

  const amount = booking.price;
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
  const providerPayout = Math.round((amount - platformFee) * 100) / 100;

  const paymentId = uuidv4();
  const mockPaymentIntentId = `pi_mock_${paymentId}`;

  db.prepare(`
    INSERT INTO payments (id, booking_id, owner_id, provider_id, amount, platform_fee, provider_payout, status, stripe_payment_intent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(paymentId, bookingId, req.user!.userId, booking.provider_id, amount, platformFee, providerPayout, mockPaymentIntentId);

  res.json({
    paymentId,
    clientSecret: `${mockPaymentIntentId}_secret`,
    amount,
    platformFee,
    providerPayout,
    currency: 'usd',
  });
});

// Confirm payment (mock - in production would be handled via webhook)
router.post('/confirm', async (req: Request, res: Response) => {
  const db = getDb();
  const { paymentId } = req.body;

  const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND owner_id = ?')
    .get(paymentId, req.user!.userId) as any;

  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  const mockChargeId = `ch_mock_${paymentId}`;
  db.prepare(`
    UPDATE payments SET status = 'authorized', stripe_charge_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(mockChargeId, paymentId);

  res.json({ message: 'Payment authorized', chargeId: mockChargeId });
});

// Get payment details for a booking
router.get('/booking/:bookingId', (req: Request, res: Response) => {
  const db = getDb();
  const { userId, role } = req.user!;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.bookingId) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  if (role !== 'admin' && booking.owner_id !== userId && booking.provider_id !== userId) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(req.params.bookingId) as any;
  if (!payment) {
    res.status(404).json({ error: 'No payment found for this booking' });
    return;
  }

  res.json({
    id: payment.id,
    bookingId: payment.booking_id,
    amount: payment.amount,
    platformFee: payment.platform_fee,
    providerPayout: payment.provider_payout,
    status: payment.status,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
  });
});

// Provider earnings summary
router.get('/earnings', async (req: Request, res: Response) => {
  const db = getDb();
  const { userId } = req.user!;

  const earnings = db.prepare(`
    SELECT
      strftime('%Y-%m', paid_at) as month,
      COUNT(*) as job_count,
      SUM(provider_payout) as total_payout
    FROM payments
    WHERE provider_id = ? AND status = 'captured'
    GROUP BY strftime('%Y-%m', paid_at)
    ORDER BY month DESC
    LIMIT 12
  `).all(userId);

  const total = db.prepare('SELECT COALESCE(SUM(provider_payout), 0) as total FROM payments WHERE provider_id = ? AND status = \'captured\'').get(userId) as any;

  res.json({ earnings, totalLifetime: total.total });
});

// Request refund
router.post('/:id/refund', async (req: Request, res: Response) => {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user!.userId) as any;

  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  if (!['authorized', 'captured'].includes(payment.status)) {
    res.status(400).json({ error: 'Payment cannot be refunded' });
    return;
  }

  db.prepare(`UPDATE payments SET status = 'refunded', updated_at = datetime('now') WHERE id = ?`)
    .run(req.params.id);

  res.json({ message: 'Refund processed' });
});

export default router;
