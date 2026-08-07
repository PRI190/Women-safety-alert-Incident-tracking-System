import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifications = db.get('notifications');
  const userNotifs = notifications.filter((n) => n.userId === req.user?.id);
  return res.json(userNotifs);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifications = db.get('notifications');
  const notif = notifications.find((n) => n.id === req.params.id && n.userId === req.user?.id);

  if (notif) {
    notif.isRead = true;
    db.set('notifications', notifications);
  }

  return res.json({ message: 'Notification marked as read' });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifications = db.get('notifications');
  notifications.forEach((n) => {
    if (n.userId === req.user?.id) {
      n.isRead = true;
    }
  });
  db.set('notifications', notifications);
  return res.json({ message: 'All notifications marked as read' });
});

export default router;
