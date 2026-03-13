import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../models/database';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const properties = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM bookings b WHERE b.property_id = p.id AND b.status NOT IN ('cancelled')) as total_bookings,
      (SELECT MAX(b.scheduled_date) FROM bookings b WHERE b.property_id = p.id AND b.status = 'completed') as last_service_date
    FROM properties p
    WHERE p.owner_id = ? AND p.is_active = 1
    ORDER BY p.created_at DESC
  `).all(req.user!.userId);

  res.json(properties.map(formatProperty));
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const property = db.prepare('SELECT * FROM properties WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user!.userId) as any;

  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  res.json(formatProperty(property));
});

router.post(
  '/',
  requireRole('owner', 'admin'),
  [
    body('name').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('state').trim().notEmpty(),
    body('zip').trim().notEmpty(),
    body('propertyType').isIn(['house', 'apartment', 'condo', 'townhouse', 'cabin', 'other']),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, address, city, state, zip, propertyType, bedrooms, bathrooms, squareFeet, notes, accessInstructions } = req.body;
    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO properties (id, owner_id, name, address, city, state, zip, property_type, bedrooms, bathrooms, square_feet, notes, access_instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.userId, name, address, city, state, zip, propertyType, bedrooms || 1, bathrooms || 1, squareFeet || null, notes || null, accessInstructions || null);

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    res.status(201).json(formatProperty(property));
  }
);

router.put(
  '/:id',
  requireRole('owner', 'admin'),
  (req: Request, res: Response) => {
    const db = getDb();
    const property = db.prepare('SELECT * FROM properties WHERE id = ? AND owner_id = ?')
      .get(req.params.id, req.user!.userId) as any;

    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const { name, address, city, state, zip, propertyType, bedrooms, bathrooms, squareFeet, notes, accessInstructions } = req.body;

    db.prepare(`
      UPDATE properties SET
        name = ?, address = ?, city = ?, state = ?, zip = ?,
        property_type = ?, bedrooms = ?, bathrooms = ?, square_feet = ?,
        notes = ?, access_instructions = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name ?? property.name,
      address ?? property.address,
      city ?? property.city,
      state ?? property.state,
      zip ?? property.zip,
      propertyType ?? property.property_type,
      bedrooms ?? property.bedrooms,
      bathrooms ?? property.bathrooms,
      squareFeet ?? property.square_feet,
      notes ?? property.notes,
      accessInstructions ?? property.access_instructions,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    res.json(formatProperty(updated));
  }
);

router.delete('/:id', requireRole('owner', 'admin'), (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('UPDATE properties SET is_active = 0 WHERE id = ? AND owner_id = ?')
    .run(req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }
  res.json({ message: 'Property deleted' });
});

function formatProperty(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    ownerId: p.owner_id,
    name: p.name,
    address: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip,
    propertyType: p.property_type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    squareFeet: p.square_feet,
    notes: p.notes,
    accessInstructions: p.access_instructions,
    isActive: !!p.is_active,
    totalBookings: p.total_bookings,
    lastServiceDate: p.last_service_date,
    createdAt: p.created_at,
  };
}

export default router;
