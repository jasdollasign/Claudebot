import { Router, Request, Response } from 'express';
import { getDb } from '../models/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user!.userId);

  res.json(notifications.map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: JSON.parse(n.data || '{}'),
    read: !!n.read,
    createdAt: n.created_at,
  })));
});

router.post('/:id/read', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.userId);
  res.json({ message: 'Marked as read' });
});

router.post('/read-all', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.userId);
  res.json({ message: 'All notifications marked as read' });
});

router.get('/unread-count', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0')
    .get(req.user!.userId) as any;
  res.json({ count: result.count });
});

export default router;
