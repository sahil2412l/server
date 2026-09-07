import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import coinRoutes from './routes/coin.routes.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// ==========================================
// 1. GLOBAL SECURITY & UTILITY MIDDLEWARES
// ==========================================
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());

// CORS configuration
const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : [];

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  ...envOrigins,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all during development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  })
);

// Payload size limit to protect against oversized payload attacks
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Apply general rate limiting to API routes
app.use('/api/', apiLimiter);

// ==========================================
// 2. HEALTH CHECK & WELCOME ROUTE
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Full-Featured Secure Backend API',
    status: 'Operational 🚀',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      feedback: '/api/feedback',
      coins: '/api/coins',
      health: '/health',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 3. API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/coins', coinRoutes);

// ==========================================
// 4. ERROR HANDLING MIDDLEWARES
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
