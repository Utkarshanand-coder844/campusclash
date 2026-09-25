import './env.js';

const rawOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const clean = origin.trim().replace(/\/$/, '');
  if (rawOrigins.includes(clean)) return true;

  try {
    const url = new URL(clean);
    // Allow any Vercel domain (production and preview branches)
    if (url.hostname.endsWith('.vercel.app')) return true;
    // Allow local development
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
  } catch {
    // ignore parse errors
  }
  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`⚠️ CORS: Rejected origin "${origin}". Configured origins:`, rawOrigins);
    return callback(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
