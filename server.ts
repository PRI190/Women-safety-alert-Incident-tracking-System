import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import authRoutes from './server/routes/authRoutes';
import incidentRoutes from './server/routes/incidentRoutes';
import sosRoutes from './server/routes/sosRoutes';
import hotspotRoutes from './server/routes/hotspotRoutes';
import dashboardRoutes from './server/routes/dashboardRoutes';
import notificationRoutes from './server/routes/notificationRoutes';

export const app = express();

// Trust proxy for Vercel & serverless environments
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Women Safety System API', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Women Safety System API', timestamp: new Date().toISOString() });
});

// Vite development middleware or static production fallback & listening
async function startServer() {
  const PORT = 3000;

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
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

