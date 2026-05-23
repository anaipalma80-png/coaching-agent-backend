// server.js (ES Module)
import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './src/utils/logger.js';
import agentsRouter from './src/routes/agents.js';
import conversationsRouter from './src/routes/conversations.js';
import healthRouter from './src/routes/health.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path });
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/conversations', conversationsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
