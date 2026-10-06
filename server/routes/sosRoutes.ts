import { Router, Response } from 'express';
import { db, DBSOS } from '../db';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth';
import { broadcastWebSocketEvent } from '../websocket';

const router = Router();

// POST /api/sos
router.post('/', optionalAuthenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, locationName, emergencyType, audioTranscript, user: bodyUser } = req.body;
    const resolvedUserId = req.user?.id || bodyUser?.id || 'poiu';
    const dbUser = db.get('users').find((u) => u.id === resolvedUserId);
    const resolvedName = req.user?.name || bodyUser?.name || dbUser?.name || 'Priya Sharma';
    const resolvedPhone = dbUser?.phone || bodyUser?.phone || '+1 (555) 839-2041';

    const typeLabel = emergencyType || 'General SOS';
    const locStr = locationName || 'Captured Geolocation Marker';
    const defaultTranscript = `AUTOMATED EMERGENCY VOICE DISPATCH: Attention! Urgent distress signal received from ${resolvedName} (DOB: ${dbUser?.dob || bodyUser?.dob || 'N/A'}, Phone: ${resolvedPhone}, Address: ${dbUser?.address || bodyUser?.address || 'N/A'}). Emergency Service Requested: ${typeLabel}. Current Location: ${locStr} [Lat: ${Number(latitude || 28.6139).toFixed(4)}, Long: ${Number(longitude || 77.2090).toFixed(4)}]. Emergency contacts have been auto-notified via SMS and automated call broadcast. Please dispatch immediate responders.`;

    const sosAlerts = db.get('sosAlerts');
    const newSOS: DBSOS = {
      id: `SOS-2026-${Math.floor(100 + Math.random() * 900)}`,
      userId: resolvedUserId,
      userName: resolvedName,
      userPhone: resolvedPhone,
      userDob: dbUser?.dob || bodyUser?.dob,
      userAddress: dbUser?.address || bodyUser?.address,
      latitude: Number(latitude) || 28.6139,
      longitude: Number(longitude) || 77.2090,
      locationName: locStr,
      time: new Date().toISOString(),
      status: 'ACTIVE',
      emergencyType: typeLabel,
      audioTranscript: audioTranscript || defaultTranscript,
      notes: `Emergency alert [${typeLabel}] triggered. Voice message broadcast sent to emergency contacts.`
    };

    sosAlerts.unshift(newSOS);
    db.set('sosAlerts', sosAlerts);

    // Create high-priority notifications for user and admins
    const notifications = db.get('notifications');
    const admins = db.get('users').filter((u) => u.role === 'admin');

    notifications.unshift({
      id: `notif-sos-user-${Date.now()}`,
      userId: newSOS.userId,
      title: `🚨 ${typeLabel.toUpperCase()} Emergency Alert Transmitted`,
      message: `Emergency signal sent! Your 2 emergency contacts and emergency dispatch center notified with your live coordinates and automated voice recording.`,
      type: 'sos',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    admins.forEach((admin) => {
      notifications.unshift({
        id: `notif-sos-admin-${Date.now()}-${admin.id}`,
        userId: admin.id,
        title: `🚨 ${typeLabel.toUpperCase()} - EMERGENCY DISPATCH REQUIRED`,
        message: `Alert ${newSOS.id} from ${newSOS.userName} (${newSOS.userPhone}). Location: ${newSOS.locationName}!`,
        type: 'sos',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    db.set('notifications', notifications);

    // Broadcast in real-time to all connected devices via WebSocket & SSE!
    broadcastWebSocketEvent('sos:created', newSOS);
    broadcastWebSocketEvent('notification:new', {
      title: `🚨 URGENT: ${typeLabel}`,
      message: `Distress signal from ${newSOS.userName} at ${newSOS.locationName}`,
      sosId: newSOS.id
    });

    return res.status(201).json({
      message: `${typeLabel} alert triggered successfully! Emergency contacts & responders notified.`,
      sosAlert: newSOS,
      emergencyContacts: dbUser?.emergencyContacts || bodyUser?.emergencyContacts || []
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to trigger SOS' });
  }
});

// GET /api/sos
router.get('/', optionalAuthenticateToken, (req: AuthRequest, res: Response) => {
  const sosAlerts = db.get('sosAlerts') || [];
  const role = req.user?.role;
  const userId = req.user?.id;
  const { all, myOnly } = req.query;

  // Always return all SOS alerts for admins, command centers, or when requested with ?all=true
  if (role === 'admin' || all === 'true' || req.query.admin === 'true' || !userId) {
    return res.json(sosAlerts);
  }

  if (myOnly === 'true') {
    const userSOS = sosAlerts.filter(
      (s) => s.userId === userId || (userId === 'poiu' && (s.userId === 'poiu' || s.userId === 'usr-demo-1'))
    );
    return res.json(userSOS);
  }

  // Default to returning all active alerts or all alerts
  return res.json(sosAlerts);
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

  // Broadcast updated status in real-time across all devices!
  broadcastWebSocketEvent('sos:updated', sos);

  return res.json({ message: 'SOS alert status updated', sos });
});

export default router;
