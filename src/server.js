const dotenv = require('dotenv');

// Load environment variables before importing app or logger
dotenv.config();

const logger = require('./utils/logger');

// Catch Uncaught Exceptions synchronously before anything else
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... ${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

const connectDB = require('./config/db.config');
const app = require('./app');

// Connect to MongoDB Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle Unhandled Promise Rejections asynchronously
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... ${err.name}: ${err.message}`);
  logger.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal (e.g. Docker / Heroku / AWS shutdown)
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Gracefully shutting down server...');
  server.close(() => {
    logger.info('Process terminated!');
  });
});
