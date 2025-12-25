/**
 * Database Connection
 * MongoDB connection using Mongoose
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const uri = config.env === 'test' ? config.mongodb.testUri : config.mongodb.uri;

    const conn = await mongoose.connect(uri, config.mongodb.options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
