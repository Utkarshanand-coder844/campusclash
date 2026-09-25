import express from 'express';
import './config/env.js';
import { createServer } from 'http';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import bracketRoutes from './routes/bracketRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import sportsAdminRoutes from './routes/sportsAdminRoutes.js';
import playerSportRoutes from './routes/playerSportRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { initDb } from './config/db.js';
import { initSocket } from './config/socket.js';
import { corsOptions } from './config/cors.js';

if (process.env.NODE_ENV === 'production') {
  const missing = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_SIGNUP_CODE', 'FRONTEND_ORIGIN', 'FRONTEND_URL', 'RESEND_API_KEY', 'PASSWORD_RESET_EMAIL_FROM']
    .filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'super_secret_sports_jwt_key_change_in_production_2026') {
    throw new Error('JWT_SECRET must be a unique production secret of at least 32 characters.');
  }
  if (process.env.ADMIN_SIGNUP_CODE.length < 12) {
    throw new Error('ADMIN_SIGNUP_CODE must be a strong private production secret.');
  }
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// Initialize Socket.io on the HTTP server
initSocket(httpServer);

// Middlewares
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
// A profile image is resized in the browser and capped by validation below.
app.use(express.json({ limit: '300kb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/brackets', bracketRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sports-admins', sportsAdminRoutes);
app.use('/api/player-sports', playerSportRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'College Sports Tournament Server',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server using httpServer (not app.listen) so Socket.io works
const startServer = async () => {
  await initDb();
  httpServer.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other local server or set PORT to another value before starting CampusClash.`);
      return;
    }
    console.error('Unable to start HTTP server:', error.message);
  });
  httpServer.listen(PORT, () => {
    console.log(`🚀 Sports Tournament Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready for real-time leaderboard updates`);
    console.log(
      process.env.ADMIN_SIGNUP_CODE
        ? '🔐 Admin signup code loaded'
        : '⚠️  ADMIN_SIGNUP_CODE not set in .env — admin signup will always be rejected'
    );
  });
};

startServer();

export default app;
