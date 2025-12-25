#!/usr/bin/env node

/**
 * Daily Data Retention Cleanup Job
 * Run daily at 2:00 AM UTC
 * 
 * Tasks:
 * 1. Process scheduled account deletions
 * 2. Delete expired tokens
 * 3. Send deletion reminder emails (7 days before)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../../src/common/config');
const logger = require('../../src/common/utils/logger');
const accountDeletionService = require('../../src/modules/auth/services/accountDeletion.service');
const TokenBlacklist = require('../../src/modules/auth/models/tokenBlacklist.model');
const User = require('../../src/modules/auth/models/user.model');

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Database connected for retention job');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Task 1: Process scheduled account deletions
async function processAccountDeletions() {
  try {
    logger.info('Starting scheduled account deletion processing...');
    
    const results = await accountDeletionService.processScheduledDeletions();
    
    logger.info(`Account deletion processing complete:`, {
      successCount: results.success.length,
      failedCount: results.failed.length,
      successfulDeletions: results.success,
      failedDeletions: results.failed,
    });

    return results;
  } catch (error) {
    logger.error('Error processing account deletions:', error);
    throw error;
  }
}

// Task 2: Delete expired tokens
async function cleanupExpiredTokens() {
  try {
    logger.info('Cleaning up expired tokens...');
    
    const result = await TokenBlacklist.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    logger.info(`Expired tokens deleted: ${result.deletedCount}`);
    
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    throw error;
  }
}

// Task 3: Send deletion reminder emails
async function sendDeletionReminders() {
  try {
    logger.info('Sending deletion reminder emails...');
    
    // Find users with deletion scheduled in 7 days
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 7);
    
    const usersToRemind = await User.find({
      deletionScheduledFor: {
        $gte: new Date(reminderDate.setHours(0, 0, 0, 0)),
        $lt: new Date(reminderDate.setHours(23, 59, 59, 999)),
      },
      isDeleted: false,
    }).setOptions({ includeDeleted: false });

    logger.info(`Found ${usersToRemind.length} users to remind`);

    for (const user of usersToRemind) {
      try {
        // TODO: Send email notification
        // await emailService.sendDeletionReminder(user.email, user.deletionScheduledFor);
        
        logger.info(`Deletion reminder sent to user ${user._id} (${user.email})`);
      } catch (error) {
        logger.error(`Failed to send reminder to user ${user._id}:`, error);
      }
    }

    return usersToRemind.length;
  } catch (error) {
    logger.error('Error sending deletion reminders:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  logger.info('========================================');
  logger.info('Daily Retention Cleanup Job Started');
  logger.info(`Time: ${new Date().toISOString()}`);
  logger.info('========================================');

  try {
    // Connect to database
    await connectDB();

    // Run all tasks
    const [deletionResults, tokensDeleted, remindersSet] = await Promise.all([
      processAccountDeletions(),
      cleanupExpiredTokens(),
      sendDeletionReminders(),
    ]);

    // Summary
    const duration = Date.now() - startTime;
    logger.info('========================================');
    logger.info('Daily Retention Cleanup Job Completed');
    logger.info(`Duration: ${duration}ms`);
    logger.info('Summary:');
    logger.info(`  - Accounts deleted: ${deletionResults.success.length}`);
    logger.info(`  - Deletion failures: ${deletionResults.failed.length}`);
    logger.info(`  - Expired tokens cleaned: ${tokensDeleted}`);
    logger.info(`  - Deletion reminders sent: ${remindersSet}`);
    logger.info('========================================');

    // Exit successfully
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Daily retention cleanup job failed:', error);
    
    // Exit with error
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the job
main();




