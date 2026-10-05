import { Router, Response } from 'express';
import { db, DBHotspot } from '../db';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth';
import { broadcastWebSocketEvent } from '../websocket';

const router = Router();

// GET /api/hotspots (Public safety map access)
router.get('/', optionalAuthenticateToken, (req: AuthRequest, res: Response) => {
  const hotspots = db.get('hotspots');
  return res.json(hotspots || []);
});

// POST /api/hotspots (Admin add or refresh area)
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { areaName, latitude, longitude, incidentCount, riskLevel, primaryCategories, safetyTips } = req.body;

  if (!areaName || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Area name, latitude, and longitude are required.' });
  }

  const hotspots = db.get('hotspots');
  const newHotspot: DBHotspot = {
    id: `hs-${Date.now()}`,
    areaName,
    latitude: Number(latitude),
    longitude: Number(longitude),
    incidentCount: Number(incidentCount) || 1,
    riskLevel: riskLevel || 'Moderate',
    primaryCategories: primaryCategories || ['Suspicious Activity'],
    safetyTips: safetyTips || ['Stay alert and report any unusual behavior'],
    lastUpdated: new Date().toISOString()
  };

  hotspots.push(newHotspot);
  db.set('hotspots', hotspots);

  // Broadcast hotspot update to all connected maps
  broadcastWebSocketEvent('hotspot:created', newHotspot);

  return res.status(201).json({ message: 'Hotspot location added', hotspot: newHotspot });
});

export default router;
