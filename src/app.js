const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const { apiLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, AppError } = require('./middlewares/error.middleware');

// Import Route Handlers
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');
const messageRoutes = require('./routes/message.routes');
const fileRoutes = require('./routes/file.routes');
const discountRoutes = require('./routes/discount.routes');

const app = express();

// 1. HTTP Security Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// 3. Global Rate Limiter for API endpoints
app.use('/api', apiLimiter);

// 4. Body Parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 6. Serve static uploads directory securely
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 7. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend Server is healthy and running smoothly!',
    timestamp: new Date().toISOString(),
  });
});

// 8. Mount API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/discounts', discountRoutes);

// 9. Handle Undefined Routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 10. Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
