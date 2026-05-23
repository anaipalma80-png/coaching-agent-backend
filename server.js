require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const logger = require('./src/utils/logger');
const { validateEnv } = require('./src/config/env');
const healthRoutes = require('./src/routes/health');
const agentRoutes = require('./src/routes/agents');
const conversationRoutes = require('./src/routes/conversations');
const retellRoutes = require('./src/routes/retell');
const { errorHandler } = require('./src/middleware/errorHandler');

// Validate environment variables at startup
try {
  validateEnv();
  logger.info('Environment variables validated successfully');
} catch (error) {
  logger.error({ error: error.message }, 'Environment validation failed');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  }, `${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/retell', retellRoutes);

// 404 Handler
app.use((req, res) => {
  logger.warn({ method: req.method, path: req.path }, 'Route not found');
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received`);
  logger.info('Shutting down gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error(
    { reason, promise },
    'Unhandled Rejection at: Promise'
  );
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.fatal(
    { error: error.message, stack: error.stack },
    'Uncaught Exception'
  );
  process.exit(1);
});

// Start Server
const server = app.listen(PORT, () => {
  logger.info({
    port: PORT,
    env: NODE_ENV,
    nodeVersion: process.version,
  }, '🚀 Server started successfully');
});

module.exports = app;