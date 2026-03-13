import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { signToken, authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['owner', 'provider']),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, role, firstName, lastName, phone } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, passwordHash, role, firstName, lastName, phone || null);

    if (role === 'provider') {
      db.prepare(`
        INSERT INTO provider_profiles (id, user_id) VALUES (?, ?)
      `).run(uuidv4(), userId);
    }

    const token = signToken({ userId, email, role });
    res.status(201).json({
      token,
      user: { id: userId, email, role, firstName, lastName },
    });
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
      },
    });
  }
);

router.get('/me', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const result: any = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    avatarUrl: user.avatar_url,
    isVerified: !!user.is_verified,
    createdAt: user.created_at,
  };

  if (user.role === 'provider') {
    const profile = db.prepare('SELECT * FROM provider_profiles WHERE user_id = ?').get(user.id) as any;
    if (profile) {
      result.providerProfile = {
        id: profile.id,
        bio: profile.bio,
        hourlyRate: profile.hourly_rate,
        services: JSON.parse(profile.services),
        serviceRadiusMiles: profile.service_radius_miles,
        backgroundChecked: !!profile.background_checked,
        rating: profile.rating,
        totalReviews: profile.total_reviews,
        totalJobs: profile.total_jobs,
        availability: JSON.parse(profile.availability),
      };
    }
  }

  res.json(result);
});

router.put('/profile', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, phone } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(firstName, lastName, phone, req.user!.userId);

  res.json({ message: 'Profile updated' });
});

export default router;
