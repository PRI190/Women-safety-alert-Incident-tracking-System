import { Router, Response } from 'express';
import { db, DBSOS } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/sos
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, locationName } = req.body;
    const user = db.get('users').find((u) => u.id === req.user?.id);

    const sosAlerts = db.get('sosAlerts');
    const newSOS: DBSOS = {
      id: `SOS-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId: req.user!.id,
      userName: user?.name || req.user!.name,
      userPhone: user?.phone || 'N/A',
      latitude: Number(latitude) || 40.7128,
      longitude: Number(longitude) || -74.006,
      locationName: locationName || 'Captured Geolocation Marker',
      time: new Date().toISOString(),
      status: 'ACTIVE',
      notes: 'Emergency SOS activated by user device.'
    };

    sosAlerts.unshift(newSOS);
    db.set('sosAlerts', sosAlerts);

    // Create high-priority notifications for all admins
    const notifications = db.get('notifications');
    const admins = db.get('users').filter((u) => u.role === 'admin');

    notifications.unshift({
      id: `notif-sos-user-${Date.now()}`,
      userId: req.user!.id,
      title: 'SOS Emergency Broadcast Active',
      message: `Emergency signal sent! Contacts and safety command center notified with your coordinates (${newSOS.latitude.toFixed(4)}, ${newSOS.longitude.toFixed(4)}).`,
      type: 'sos',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    admins.forEach((admin) => {
      notifications.unshift({
        id: `notif-sos-admin-${Date.now()}-${admin.id}`,
        userId: admin.id,
        title: '🚨 EMERGENCY SOS ALERT DISPATCH REQUIRED',
        message: `SOS Alert ${newSOS.id} triggered by ${newSOS.userName} (${newSOS.userPhone}) at ${newSOS.locationName}!`,
        type: 'sos',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    db.set('notifications', notifications);

    return res.status(201).json({
      message: 'SOS Alert triggered successfully! Help is on the way.',
      sosAlert: newSOS,
      emergencyContacts: user?.emergencyContacts || []
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to trigger SOS' });
  }
});

// GET /api/sos
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const sosAlerts = db.get('sosAlerts');
  const role = req.user?.role;
  const userId = req.user?.id;

  if (role === 'admin') {
    return res.json(sosAlerts);
  }

  const userSOS = sosAlerts.filter((s) => s.userId === userId);
  return res.json(userSOS);
});

// PUT /api/sos/:id (update status to DISPATCHED or RESOLVED)
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const sosAlerts = db.get('sosAlerts');
  const sos = sosAlerts.find((s) => s.id === id);

  if (!sos) {
    return res.status(404).json({ error: 'SOS Alert not found' });
  }

  if (status) sos.status = status;
  if (notes) sos.notes = notes;
  if (status === 'RESOLVED') sos.resolvedAt = new Date().toISOString();

  db.set('sosAlerts', sosAlerts);

  // Notify user
  const notifications = db.get('notifications');
  notifications.unshift({
    id: `notif-sos-status-${Date.now()}`,
    userId: sos.userId,
    title: `SOS Emergency Alert Status: ${status}`,
    message: `Your emergency signal ${sos.id} has been marked as ${status}.${notes ? ` Note: ${notes}` : ''}`,
    type: 'sos',
    isRead: false,
    createdAt: new Date().toISOString()
  });
  db.set('notifications', notifications);

  return res.json({ message: 'SOS alert status updated', sos });
});

export default router;
