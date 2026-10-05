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

// Server-Sent Events (SSE) stream endpoint for cellular networks and proxies blocking WebSockets
app.get(['/api/realtime/stream', '/realtime/stream', '/api/events'], (req, res) => {
  registerSSEClient(res);
});

// Fallback real-time synchronization endpoint for mobile phones where WebSocket handshakes are blocked by cellular NAT
app.get(['/api/realtime/sync', '/realtime/sync'], (req, res) => {
  const since = req.query.since ? String(req.query.since) : undefined;
  const incidents = db.get('incidents') || [];
  const sosAlerts = db.get('sosAlerts') || [];
  const wsStats = getWebSocketStats();

  let filteredIncidents = incidents;
  let filteredSOS = sosAlerts;

  if (since) {
    const sinceTime = new Date(since).getTime();
    if (!isNaN(sinceTime)) {
      filteredIncidents = incidents.filter(
        (i) => new Date(i.updatedAt || i.createdAt).getTime() > sinceTime
      );
      filteredSOS = sosAlerts.filter(
        (s) => new Date(s.resolvedAt || s.time).getTime() > sinceTime
      );
    }
  }

  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    onlineDevices: Math.max(wsStats.totalClients, 1),
    incidents: filteredIncidents.slice(0, 10),
    sosAlerts: filteredSOS.slice(0, 10)
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
