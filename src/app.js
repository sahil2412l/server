import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import gatewayRoutes from './gateway/routes/gateway.routes.js';
import authRoutes from './routes/auth.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import coinRoutes from './routes/coin.routes.js';
import { correlationIdMiddleware } from './gateway/middlewares/correlationId.js';
import { mongoSanitizeMiddleware } from './middlewares/mongoSanitize.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// ==========================================
// 1. GLOBAL SECURITY & UTILITY MIDDLEWARES
// ==========================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    hidePoweredBy: true,
  })
);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(correlationIdMiddleware);

// Strict CORS configuration
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
      // Allow requests with no origin (e.g. mobile native apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // In non-production, permit localhost/127.0.0.1 ports
      if (process.env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
      }

      return callback(new Error(`CORS violation: Origin '${origin}' is not authorized.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'x-tenant-id',
      'x-correlation-id',
      'x-request-id',
      'x-gateway-signature',
      'x-admin-key',
    ],
    exposedHeaders: [
      'x-correlation-id',
      'x-request-id',
      'x-tenant-id',
      'x-tenant-tier',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-RateLimit-Tier',
      'X-BFF-Client',
      'Retry-After',
    ],
  })
);

// Payload size limit to protect against oversized payload attacks
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// NoSQL Injection Sanitization
app.use(mongoSanitizeMiddleware);

// Apply general rate limiting to direct API routes
app.use('/api/', apiLimiter);

// ==========================================
// 2. HEALTH CHECK & WELCOME ROUTE
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Enterprise Multi-Tenant API Gateway & Backend Architecture',
    status: 'Operational 🚀',
    version: '2.0.0',
    architecture: {
      pattern: 'API Gateway + Backend For Frontend (BFF) + Multi-Tenancy',
      capabilities: [
        'Centralized Gateway Authentication & Security Offloading',
        'Dynamic Multi-Tenant Identification & Tiered Rate Limiting',
        'BFF Endpoint Aggregation for Mobile, Web, and Admin Portals',
        'Circuit Breakers & Cascading Failure Resilience',
        'Distributed Correlation ID Tracing',
        'Hardened Enterprise Security & Sanitization',
      ],
    },
    endpoints: {
      gatewayHealth: '/api/gateway/health',
      circuitBreakersStatus: '/api/gateway/resilience/status',
      bffMobileDashboard: '/api/gateway/bff/mobile/dashboard',
      bffWebOverview: '/api/gateway/bff/web/overview',
      bffAdminTenantSummary: '/api/gateway/bff/admin/tenant-summary',
      gatewayServices: '/api/gateway/services/*',
      legacyAuth: '/api/auth',
      legacyFeedback: '/api/feedback',
      legacyCoins: '/api/coins',
      health: '/health',
    },
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
  });
});

// ==========================================
// 3. API GATEWAY ROUTE SUBSYSTEM
// ==========================================
app.use('/api/gateway', gatewayRoutes);

// ==========================================
// 4. DIRECT INTERNAL / LEGACY DOMAIN ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/coins', coinRoutes);

// ==========================================
// 5. ERROR HANDLING MIDDLEWARES
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
