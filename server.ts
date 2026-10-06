import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import http from 'http';

import authRoutes from './server/routes/authRoutes';
import incidentRoutes from './server/routes/incidentRoutes';
import sosRoutes from './server/routes/sosRoutes';
import hotspotRoutes from './server/routes/hotspotRoutes';
import dashboardRoutes from './server/routes/dashboardRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import { setupWebSocketServer, getWebSocketStats, registerSSEClient } from './server/websocket';
import { db } from './server/db';

export const app = express();

// Trust proxy for Vercel & container environments
app.set('trust proxy', 1);

// Basic security and parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Middleware to normalize stringified bodies from serverless environments
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {}
  }
  next();
});

// Mounting API routes (support both /api/* and direct /* paths)
app.use('/api', authRoutes);
app.use('/', authRoutes);

app.use('/api/incident', incidentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/incident', incidentRoutes);
app.use('/incidents', incidentRoutes);

app.use('/api/sos', sosRoutes);
app.use('/sos', sosRoutes);

app.use('/api/hotspots', hotspotRoutes);
app.use('/hotspots', hotspotRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

// Health check and WebSocket statistics endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Women Safety System API',
    websockets: getWebSocketStats(),
    timestamp: new Date().toISOString()
  });
});
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Women Safety System API',
    websockets: getWebSocketStats(),
    timestamp: new Date().toISOString()
  });
});

// Track active HTTP devices for multi-device presence even without raw WebSockets
const activeHttpDevices = new Map<string, number>();

// Server-Sent Events (SSE) stream endpoint for cellular networks and proxies blocking WebSockets
app.get(['/api/realtime/stream', '/realtime/stream', '/api/events'], (req, res) => {
  registerSSEClient(res);
});

// Robust real-time synchronization endpoint for mobile phones and cross-device sync
app.get(['/api/realtime/sync', '/realtime/sync'], (req, res) => {
  const since = req.query.since ? String(req.query.since) : undefined;
  const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string) || req.ip || 'dev';
  const now = Date.now();

  activeHttpDevices.set(deviceId, now);
  for (const [id, lastSeen] of activeHttpDevices.entries()) {
    if (now - lastSeen > 15000) {
      activeHttpDevices.delete(id);
    }
  }

  const incidents = db.get('incidents') || [];
  const sosAlerts = db.get('sosAlerts') || [];
  const wsStats = getWebSocketStats();

  let filteredIncidents = incidents;

  // Active or dispatched SOS alerts are ALWAYS returned so no responder ever misses an ongoing emergency
  const ongoingSOS = sosAlerts.filter((s) => {
    const st = (s.status || '').toUpperCase();
    return st === 'ACTIVE' || st === 'DISPATCHED' || st === 'PENDING';
  });

  let otherSOS = sosAlerts.filter((s) => {
    const st = (s.status || '').toUpperCase();
    return st !== 'ACTIVE' && st !== 'DISPATCHED' && st !== 'PENDING';
  });

  if (since) {
    const sinceTime = new Date(since).getTime();
    if (!isNaN(sinceTime)) {
      filteredIncidents = incidents.filter(
        (i) => new Date(i.updatedAt || i.createdAt).getTime() > sinceTime
      );
      otherSOS = otherSOS.filter(
        (s) => new Date(s.resolvedAt || s.time).getTime() > sinceTime
      );
    }
  }

  const combinedSOSMap = new Map<string, any>();
  for (const s of [...ongoingSOS, ...otherSOS]) {
    combinedSOSMap.set(s.id, s);
  }
  const combinedSOS = Array.from(combinedSOSMap.values());

  const totalConnected = Math.max(wsStats.totalClients, activeHttpDevices.size, 1);

  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    onlineDevices: totalConnected,
    incidents: filteredIncidents.slice(0, 15),
    sosAlerts: combinedSOS.slice(0, 15),
    activeEmergencyCount: ongoingSOS.length
  });
});

// Vite development middleware or static production fallback & listening
async function startServer() {
  const PORT = 3000;
  const server = http.createServer(app);

  // Mount real-time WebSocket server on /ws path
  setupWebSocketServer(server);

  if (process.env.VERCEL) {
    app.use((req, res) => {
      res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
    });
  } else if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & WebSockets running on http://0.0.0.0:${PORT}`);
  });
}

// Global Express Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Server Error:', err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
