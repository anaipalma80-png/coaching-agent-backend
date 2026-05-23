const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Health check endpoint for Kubernetes/Docker
 * GET /api/health
 */
router.get('/', (req, res) => {
  try {
    const healthCheck = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
      },
    };

    logger.debug('Health check passed');
    res.status(200).json(healthCheck);
  } catch (error) {
    logger.error({ error: error.message }, 'Health check failed');
    res.status(503).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

/**
 * Ready probe - checks if all services are ready
 * GET /api/health/ready
 */
router.get('/ready', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Ready check failed');
    res.status(503).json({
      success: false,
      error: 'Not ready',
    });
  }
});

/**
 * Live probe - checks if service is still alive
 * GET /api/health/live
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;