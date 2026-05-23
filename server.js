// server.js (ES Module - simplified)
import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date() });
});

// Placeholder routes
app.get('/api/agents', (req, res) => {
  res.json({ success: true, data: [], message: 'Agents endpoint' });
});

app.post('/api/agents', (req, res) => {
  res.json({ success: true, data: { id: '1', name: 'New Agent' }, message: 'Agent created' });
});

app.get('/api/conversations', (req, res) => {
  res.json({ success: true, data: [], message: 'Conversations endpoint' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
