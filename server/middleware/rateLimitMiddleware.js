const buckets = new Map();

/** Small dependency-free limiter for credential and recovery endpoints. */
export const credentialRateLimit = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const active = (buckets.get(key) || []).filter(time => time > now - windowMs);
  if (active.length >= max) {
    return res.status(429).json({ success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' });
  }
  active.push(now);
  buckets.set(key, active);
  next();
};

/** Per-account limiter for authenticated actions, resilient to shared campus IPs. */
export const actionRateLimit = ({ windowMs = 60 * 60 * 1000, max = 10 } = {}) => (req, res, next) => {
  const accountId = req.user?.id || req.user?.userId || req.ip;
  const key = `action:${accountId}:${req.path}`;
  const now = Date.now();
  const active = (buckets.get(key) || []).filter(time => time > now - windowMs);
  if (active.length >= max) return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  active.push(now); buckets.set(key, active); next();
};
