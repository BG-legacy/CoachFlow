/**
 * Server Entry Point
 * Starts the Express server and connects to database
 */

const app = require('./app');
const config = require('./common/config');
const logger = require('./common/utils/logger');
const { connectDB } = require('./common/database/db');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
  process.exit(1);
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 CoachFlow API Server Running                    ║
║                                                       ║
║   Environment: ${config.env.padEnd(37)}║
║   Port: ${String(config.port).padEnd(44)}║
║   API Version: ${config.apiVersion.padEnd(38)}║
║                                                       ║
║   Health Check: http://localhost:${config.port}/health${' '.repeat(10)}║
║   API Base: http://localhost:${config.port}/api/${config.apiVersion}${' '.repeat(14)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (error) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', error);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated!');
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
