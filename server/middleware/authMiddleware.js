import jwt from 'jsonwebtoken';
import '../config/env.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured before starting the server.');

/**
 * Middleware: authenticateToken
 * Verifies the JWT from the Authorization header and attaches the decoded user to req.user.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authorization token provided'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired authorization token'
      });
    }

    // Attach decoded user to req.user (normalized id & role)
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
      role: decoded.role
    };

    next();
  });
};

/**
 * Middleware: requireAdmin
 * Checks req.user.role === 'admin', for protecting admin-only routes.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin privileges required'
    });
  }

  next();
};
