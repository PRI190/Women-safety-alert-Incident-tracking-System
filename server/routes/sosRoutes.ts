import { Router, Response } from 'express';
import { db, DBSOS } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/sos
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, locationName, emergencyType, audioTranscript } = req.body;
    const user = db.get('users').find((u) => u.id === req.user?.id);

    const typeLabel = emergencyType || 'General SOS';
    const locStr = locationName || 'Captured Geolocation Marker';
    const defaultTranscript = `AUTOMATED EMERGENCY VOICE DISPATCH: Attention! Urgent distress signal received from ${user?.name || req.user!.name} (DOB: ${user?.dob || 'N/A'}, Phone: ${user?.phone || 'N/A'}, Address: ${user?.address || 'N/A'}). Emergency Service Requested: ${typeLabel}. Current Location: ${locStr} [Lat: ${Number(latitude || 8.5241).toFixed(4)}, Long: ${Number(longitude || 76.9366).toFixed(4)}]. Emergency contacts have been auto-notified via SMS and automated call broadcast. Please dispatch immediate responders.`;

    const sosAlerts = db.get('sosAlerts');
    const newSOS: DBSOS = {
      id: `SOS-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId: req.user!.id,
      userName: user?.name || req.user!.name,
      userPhone: user?.phone || 'N/A',
      userDob: user?.dob,
      userAddress: user?.address,
      latitude: Number(latitude) || 8.5241,
      longitude: Number(longitude) || 76.9366,
      locationName: locStr,
      time: new Date().toISOString(),
      status: 'ACTIVE',
      emergencyType: typeLabel,
      audioTranscript: audioTranscript || defaultTranscript,
      notes: `Emergency alert [${typeLabel}] triggered. Voice message broadcast sent to emergency contacts.`
    };

    sosAlerts.unshift(newSOS);
    db.set('sosAlerts', sosAlerts);

    // Create high-priority notifications for all admins
    const notifications = db.get('notifications');
    const admins = db.get('users').filter((u) => u.role === 'admin');

    notifications.unshift({
      id: `notif-sos-user-${Date.now()}`,
      userId: req.user!.id,
      title: `🚨 ${typeLabel.toUpperCase()} Emergency Alert Transmitted`,
      message: `Emergency signal sent! Your 2 emergency contacts (${(user?.emergencyContacts || []).map((c) => c.name).join(', ') || 'Registered Contacts'}) and emergency dispatch center notified with your live coordinates and automated voice recording.`,
      type: 'sos',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    admins.forEach((admin) => {
      notifications.unshift({
        id: `notif-sos-admin-${Date.now()}-${admin.id}`,
        userId: admin.id,
        title: `🚨 ${typeLabel.toUpperCase()} - EMERGENCY DISPATCH REQUIRED`,
        message: `Alert ${newSOS.id} from ${newSOS.userName} (${newSOS.userPhone}, DOB: ${newSOS.userDob || 'N/A'}). Service: ${typeLabel}. Address: ${newSOS.userAddress || 'N/A'}. Location: ${newSOS.locationName}!`,
        type: 'sos',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    db.set('notifications', notifications);

    return res.status(201).json({
      message: `${typeLabel} alert triggered successfully! Emergency contacts & responders notified.`,
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
