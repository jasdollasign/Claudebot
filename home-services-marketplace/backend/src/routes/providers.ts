import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Search/list available providers
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const { serviceType, minRating, maxRate, city } = req.query;

  let query = `
    SELECT u.id, u.first_name, u.last_name, u.avatar_url,
      pp.bio, pp.hourly_rate, pp.services, pp.background_checked,
      pp.rating, pp.total_reviews, pp.total_jobs, pp.service_radius_miles
    FROM users u
    JOIN provider_profiles pp ON u.id = pp.user_id
    WHERE u.role = 'provider'
  `;
  const params: any[] = [];

  if (serviceType) {
    query += ` AND json_each.value = ?`;
    // Use a simpler approach for SQLite service type filtering
    query = `
      SELECT u.id, u.first_name, u.last_name, u.avatar_url,
        pp.bio, pp.hourly_rate, pp.services, pp.background_checked,
        pp.rating, pp.total_reviews, pp.total_jobs, pp.service_radius_miles
      FROM users u
      JOIN provider_profiles pp ON u.id = pp.user_id
      WHERE u.role = 'provider' AND pp.services LIKE ?
    `;
    params.push(`%"${serviceType}"%`);
  }

  if (minRating) { query += ' AND pp.rating >= ?'; params.push(Number(minRating)); }
  if (maxRate) { query += ' AND pp.hourly_rate <= ?'; params.push(Number(maxRate)); }

  query += ' ORDER BY pp.rating DESC, pp.total_jobs DESC LIMIT 50';

  const providers = db.prepare(query).all(...params);

  res.json(providers.map(formatProvider));
});

// Get provider profile
router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();

  const provider = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.created_at,
      pp.bio, pp.hourly_rate, pp.services, pp.background_checked,
      pp.rating, pp.total_reviews, pp.total_jobs, pp.service_radius_miles, pp.availability
    FROM users u
    JOIN provider_profiles pp ON u.id = pp.user_id
    WHERE u.id = ? AND u.role = 'provider'
  `).get(req.params.id) as any;

  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }

  const recentReviews = db.prepare(`
    SELECT r.rating, r.comment, r.quality_score, r.punctuality_score,
      u.first_name, b.service_type, b.scheduled_date
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    JOIN bookings b ON r.booking_id = b.id
    WHERE r.reviewee_id = ?
    ORDER BY r.created_at DESC LIMIT 5
  `).all(req.params.id);

  res.json({
    ...formatProvider(provider),
    availability: JSON.parse(provider.availability || '{}'),
    memberSince: provider.created_at,
    recentReviews: recentReviews.map((r: any) => ({
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.first_name,
      serviceType: r.service_type,
      serviceDate: r.scheduled_date,
    })),
  });
});

// Update own provider profile
router.put('/me/profile', requireRole('provider'), (req: Request, res: Response) => {
  const db = getDb();
  const { bio, hourlyRate, services, serviceRadiusMiles, availability } = req.body;

  db.prepare(`
    UPDATE provider_profiles SET
      bio = ?, hourly_rate = ?, services = ?, service_radius_miles = ?, availability = ?,
      updated_at = datetime('now')
    WHERE user_id = ?
  `).run(
    bio || null,
    hourlyRate || null,
    JSON.stringify(services || []),
    serviceRadiusMiles || 25,
    JSON.stringify(availability || {}),
    req.user!.userId
  );

  res.json({ message: 'Profile updated' });
});

function formatProvider(p: any) {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    avatarUrl: p.avatar_url,
    bio: p.bio,
    hourlyRate: p.hourly_rate,
    services: JSON.parse(p.services || '[]'),
    backgroundChecked: !!p.background_checked,
    rating: Math.round((p.rating || 0) * 10) / 10,
    totalReviews: p.total_reviews || 0,
    totalJobs: p.total_jobs || 0,
    serviceRadiusMiles: p.service_radius_miles,
  };
}

export default router;
