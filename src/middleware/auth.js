const jwt = require('jsonwebtoken');
const { getConfig } = require('../config/env');
const logger = require('../utils/logger');

const config = getConfig();

/**
 * Verify JWT token and extract user information
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.warn({ error: error.message }, 'Token verification failed');
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (userId, company_id, role)
 * @returns {string} JWT token
 */
function generateToken(payload) {
  try {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256',
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Token generation failed');
    throw new Error('Failed to generate token');
  }
}

/**
 * Middleware to authenticate JWT token from Authorization header
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Missing authorization header');
      return res.status(401).json({
        success: false,
        error: 'Missing authorization header',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn({ authHeader }, 'Invalid authorization header format');
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
      });
    }

    const token = parts[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    logger.debug({ userId: decoded.userId }, 'Token verified');
    next();
  } catch (error) {
    logger.error({ error: error.message }, 'Authentication error');
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed',
    });
  }
}

/**
 * Middleware to validate company_id from user claims
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function companyValidationMiddleware(req, res, next) {
  if (!req.user?.company_id) {
    logger.warn({ userId: req.user?.userId }, 'Missing company_id in token');
    return res.status(403).json({
      success: false,
      error: 'Invalid token: missing company_id',
    });
  }

  next();
}

module.exports = {
  verifyToken,
  generateToken,
  authMiddleware,
  companyValidationMiddleware,
};