import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const users = db.get('users');
  const incidents = db.get('incidents');
  const sosAlerts = db.get('sosAlerts');
  const hotspots = db.get('hotspots');

  const isUserOnly = req.user?.role !== 'admin';
  const userId = req.user?.id;

  const filteredIncidents = isUserOnly ? incidents.filter((i) => i.userId === userId) : incidents;
  const filteredSOS = isUserOnly ? sosAlerts.filter((s) => s.userId === userId) : sosAlerts;

  const totalIncidents = filteredIncidents.length;
  const pendingIncidents = filteredIncidents.filter((i) => i.status === 'Pending').length;
  const underReviewIncidents = filteredIncidents.filter((i) => i.status === 'Under Review').length;
  const resolvedIncidents = filteredIncidents.filter((i) => i.status === 'Resolved').length;
  const rejectedIncidents = filteredIncidents.filter((i) => i.status === 'Rejected').length;

  const activeSOSTotal = filteredSOS.filter((s) => s.status === 'ACTIVE' || s.status === 'DISPATCHED').length;
  const sosTodayCount = filteredSOS.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.time.startsWith(today);
  }).length;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  filteredIncidents.forEach((inc) => {
    categoryMap[inc.category] = (categoryMap[inc.category] || 0) + 1;
  });

  const categoryBreakdown = Object.keys(categoryMap).map((cat) => ({
    category: cat,
    count: categoryMap[cat]
  }));

  // Monthly trends (mock / calculated)
  const monthlyTrends = [
    { month: 'Mar', incidents: 8, resolved: 6 },
    { month: 'Apr', incidents: 12, resolved: 10 },
    { month: 'May', incidents: 15, resolved: 13 },
    { month: 'Jun', incidents: 10, resolved: 9 },
    { month: 'Jul', incidents: 18, resolved: 14 },
    { month: 'Aug', incidents: totalIncidents, resolved: resolvedIncidents }
  ];

  // Risk distribution
  const riskCount = { Safe: 0, Moderate: 0, Danger: 0 };
  hotspots.forEach((h) => {
    if (riskCount[h.riskLevel] !== undefined) {
      riskCount[h.riskLevel]++;
    }
  });

  const riskDistribution = [
    { level: 'Safe', count: riskCount.Safe },
    { level: 'Moderate', count: riskCount.Moderate },
    { level: 'Danger', count: riskCount.Danger }
  ];

  return res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.role === 'user').length,
    totalIncidents,
    pendingIncidents,
    underReviewIncidents,
    resolvedIncidents,
    rejectedIncidents,
    sosTodayCount,
    activeSOSTotal,
    categoryBreakdown,
    monthlyTrends,
    riskDistribution
  });
});

// POST /api/seed - reset data to seed
router.post('/seed', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  db.resetSeed();
  return res.json({ message: 'Database reset to initial seed values.' });
});

export default router;
