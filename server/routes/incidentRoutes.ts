import { Router, Response } from 'express';
import { db, DBIncident, DBNotification } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/incident
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      category,
      description,
      location,
      latitude,
      longitude,
      date,
      time,
      image,
      anonymous
    } = req.body;

    if (!title || !category || !description || !location) {
      return res.status(400).json({ error: 'Title, category, description, and location are required.' });
    }

    const incidents = db.get('incidents');
    const user = db.get('users').find((u) => u.id === req.user?.id);

    const newIncident: DBIncident = {
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: req.user!.id,
      userName: anonymous ? 'Anonymous User' : user?.name || req.user!.name,
      userPhone: anonymous ? undefined : user?.phone,
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      latitude: Number(latitude) || 40.7128,
      longitude: Number(longitude) || -74.006,
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      status: 'Pending',
      image,
      anonymous: !!anonymous,
      createdAt: new Date().toISOString()
    };

    incidents.unshift(newIncident);
    db.set('incidents', incidents);

    // Notify user & Admin
    const notifications = db.get('notifications');
    notifications.unshift({
      id: `notif-${Date.now()}-1`,
      userId: req.user!.id,
      title: 'Incident Submitted',
      message: `Your report ${newIncident.id} ("${newIncident.title}") has been registered under status Pending.`,
      type: 'incident',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    const admins = db.get('users').filter((u) => u.role === 'admin');
    admins.forEach((admin) => {
      notifications.unshift({
        id: `notif-${Date.now()}-${admin.id}`,
        userId: admin.id,
        title: 'New Incident Reported',
        message: `New incident ${newIncident.id} (${category}) reported at ${location}.`,
        type: 'incident',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    db.set('notifications', notifications);

    return res.status(201).json({
      message: 'Incident reported successfully',
      incident: newIncident
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit incident' });
  }
});

// GET /api/incidents
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const incidents = db.get('incidents');
  const role = req.user?.role;
  const userId = req.user?.id;

  const { search, category, status, myOnly } = req.query;

  let result = incidents;

  // Filter by user if requested or if user mode
  if (role !== 'admin' || myOnly === 'true') {
    result = result.filter((i) => i.userId === userId);
  }

  // Search
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'All') {
    result = result.filter((i) => i.category === category);
  }

  // Status filter
  if (status && typeof status === 'string' && status !== 'All') {
    result = result.filter((i) => i.status === status);
  }

  return res.json(result);
});

// GET /api/incident/:id
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const incidents = db.get('incidents');
  const incident = incidents.find((i) => i.id === req.params.id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  if (req.user?.role !== 'admin' && incident.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  return res.json(incident);
});

// PUT /api/incident/:id (Update status / assign officer / admin notes)
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, assignedOfficer, adminNotes } = req.body;

  const incidents = db.get('incidents');
  const incidentIndex = incidents.findIndex((i) => i.id === id);

  if (incidentIndex === -1) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const incident = incidents[incidentIndex];

  // Only admin or owner can update
  if (req.user?.role !== 'admin' && incident.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const oldStatus = incident.status;

  if (status) incident.status = status;
  if (assignedOfficer !== undefined) incident.assignedOfficer = assignedOfficer;
  if (adminNotes !== undefined) incident.adminNotes = adminNotes;
  incident.updatedAt = new Date().toISOString();

  incidents[incidentIndex] = incident;
  db.set('incidents', incidents);

  // Notify user if status changed
  if (status && status !== oldStatus && incident.userId) {
    const notifications = db.get('notifications');
    notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: incident.userId,
      title: 'Incident Status Update',
      message: `Your incident report ${incident.id} status has been updated to "${status}".`,
      type: 'incident',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    db.set('notifications', notifications);
  }

  return res.json({ message: 'Incident updated successfully', incident });
});

// DELETE /api/incident/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  let incidents = db.get('incidents');
  const incident = incidents.find((i) => i.id === id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  if (req.user?.role !== 'admin' && incident.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  incidents = incidents.filter((i) => i.id !== id);
  db.set('incidents', incidents);

  return res.json({ message: 'Incident deleted successfully' });
});

export default router;
