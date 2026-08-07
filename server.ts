import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/authRoutes';
import incidentRoutes from './server/routes/incidentRoutes';
import sosRoutes from './server/routes/sosRoutes';
import hotspotRoutes from './server/routes/hotspotRoutes';
import dashboardRoutes from './server/routes/dashboardRoutes';
import notificationRoutes from './server/routes/notificationRoutes';

export const app = express();

// Basic security and parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Mounting API routes
app.use('/api', authRoutes);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

app.use('/api/incident', incidentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Women Safety System API', timestamp: new Date().toISOString() });
});

async function startServer() {
  const PORT = 3000;

  // Vite development middleware or static production fallback
  if (process.env.NODE_ENV !== 'production') {
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

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export default app;
