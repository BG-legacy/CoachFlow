/**
 * Account Deletion Service
 * Handles soft delete, data export, and permanent deletion
 */

const User = require('../models/user.model');
const ClientProfile = require('../../clients/models/clientProfile.model');
const Checkin = require('../../checkins/models/checkin.model');
const Session = require('../../sessions/models/session.model');
const FormAnalysis = require('../../formAnalysis/models/formAnalysis.model');
const FoodLog = require('../../nutrition/models/foodLog.model');
const MealPlan = require('../../nutrition/models/mealPlan.model');
const logger = require('../../../common/utils/logger');
const { auditLogger } = require('../../../common/utils/auditLogger');
const { NotFoundError, BadRequestError } = require('../../../common/utils/errors');

class AccountDeletionService {
  /**
   * Request account deletion (soft delete with grace period)
   */
  async requestAccountDeletion(userId, reason = 'User requested', requestedBy = null) {
    const user = await User.findById(userId).setOptions({ includeDeleted: false });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.deletionRequestedAt) {
      throw new BadRequestError('Account deletion already requested');
    }

    // Calculate deletion date (30 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    // Update user with deletion request
    await User.findByIdAndUpdate(userId, {
      deletionRequestedAt: new Date(),
      deletionScheduledFor: deletionDate,
      deletionReason: reason,
      isActive: false, // Immediately deactivate account
    });

    // Log audit event
    await auditLogger.log({
      eventType: 'ACCOUNT_DELETION_REQUESTED',
      userId,
      performedBy: requestedBy || userId,
      details: {
        reason,
        scheduledFor: deletionDate,
      },
      ipAddress: null,
      userAgent: null,
    });

    logger.info(`Account deletion requested for user ${userId}, scheduled for ${deletionDate}`);

    // TODO: Send email notification
    // await emailService.sendAccountDeletionNotice(user.email, deletionDate);

    return {
      message: 'Account deletion scheduled',
      deletionDate,
      canCancelUntil: deletionDate,
      gracePeriodDays: 30,
    };
  }

  /**
   * Cancel account deletion (restore account)
   */
  async cancelAccountDeletion(userId, cancelledBy = null) {
    const user = await User.findById(userId).setOptions({ includeDeleted: false });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (!user.deletionRequestedAt) {
      throw new BadRequestError('No deletion request found for this account');
    }

    // Check if grace period has passed
    if (new Date() > user.deletionScheduledFor) {
      throw new BadRequestError('Grace period has expired, account may have been deleted');
    }

    // Restore account
    await User.findByIdAndUpdate(userId, {
      deletionRequestedAt: null,
      deletionScheduledFor: null,
      deletionReason: null,
      isActive: true, // Reactivate account
    });

    // Log audit event
    await auditLogger.log({
      eventType: 'ACCOUNT_DELETION_CANCELLED',
      userId,
      performedBy: cancelledBy || userId,
      details: {
        originalDeletionDate: user.deletionScheduledFor,
      },
      ipAddress: null,
      userAgent: null,
    });

    logger.info(`Account deletion cancelled for user ${userId}`);

    // TODO: Send email confirmation
    // await emailService.sendAccountDeletionCancelled(user.email);

    return {
      message: 'Account deletion cancelled successfully',
      accountRestored: true,
    };
  }

  /**
   * Export all user data (GDPR right to data portability)
   */
  async exportUserData(userId) {
    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken')
      .setOptions({ includeDeleted: true });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Gather all related data
    const [profile, checkins, sessions, formAnalyses, foodLogs, mealPlans] = await Promise.all([
      ClientProfile.findOne({ userId }),
      Checkin.find({ clientId: userId }).populate('coachId', 'firstName lastName email'),
      Session.find({ clientId: userId }).populate('coachId', 'firstName lastName'),
      FormAnalysis.find({ userId }),
      FoodLog.find({ userId }),
      MealPlan.find({ userId }),
    ]);

    const dataExport = {
      exportDate: new Date().toISOString(),
      exportFormat: 'JSON',
      exportVersion: '1.0',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        preferences: user.preferences,
        consent: user.consent,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile ? {
        personalInfo: profile.personalInfo,
        fitnessProfile: profile.fitnessProfile,
        medicalInfo: profile.medicalInfo,
        measurements: profile.measurements,
        preferences: profile.preferences,
        nutritionPreferences: profile.nutritionPreferences,
        status: profile.status,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      } : null,
      checkins: checkins.map((c) => ({
        date: c.date,
        type: c.type,
        metrics: c.metrics,
        adherence: c.adherence,
        progress: c.progress,
        photos: c.photos,
        coachFeedback: c.coachFeedback,
        status: c.status,
        createdAt: c.createdAt,
      })),
      sessions: sessions.map((s) => ({
        title: s.title,
        type: s.type,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        location: s.location,
        status: s.status,
        notes: s.notes,
        price: s.price,
        isPaid: s.isPaid,
        createdAt: s.createdAt,
      })),
      formAnalyses: formAnalyses.map((f) => ({
        exerciseName: f.exerciseName,
        videoUrl: f.videoUrl,
        analysisStatus: f.analysisStatus,
        analysisResults: f.analysisResults,
        coachFeedback: f.coachFeedback,
        metadata: f.metadata,
        createdAt: f.createdAt,
      })),
      nutrition: {
        foodLogs: foodLogs.map((f) => ({
          date: f.date,
          meals: f.meals,
          totals: f.totals,
        })),
        mealPlans: mealPlans.map((m) => ({
          name: m.name,
          startDate: m.startDate,
          endDate: m.endDate,
          days: m.days,
        })),
      },
      statistics: {
        totalCheckins: checkins.length,
        totalSessions: sessions.length,
        totalFormAnalyses: formAnalyses.length,
        totalFoodLogs: foodLogs.length,
        accountAge: user.createdAt
          ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
      },
    };

    // Log audit event
    await auditLogger.log({
      eventType: 'DATA_EXPORT_REQUESTED',
      userId,
      performedBy: userId,
      details: {
        recordsExported: {
          checkins: checkins.length,
          sessions: sessions.length,
          formAnalyses: formAnalyses.length,
          foodLogs: foodLogs.length,
        },
      },
      ipAddress: null,
      userAgent: null,
    });

    logger.info(`Data export generated for user ${userId}`);

    return dataExport;
  }

  /**
   * Permanently delete account (hard delete after grace period)
   * This should be run by a scheduled job
   */
  async permanentlyDeleteAccount(userId) {
    const user = await User.findById(userId).setOptions({ includeDeleted: true });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify grace period has passed
    if (user.deletionScheduledFor && new Date() < user.deletionScheduledFor) {
      throw new BadRequestError('Grace period has not expired yet');
    }

    // 1. Export data to archive (for legal compliance)
    const dataExport = await this.exportUserData(userId);

    // TODO: Store export in secure archive location
    // await ArchiveService.store(userId, dataExport);

    // 2. Delete related data
    await this.deleteUserRelatedData(userId);

    // 3. Anonymize user record (soft delete with PII removal)
    await User.findByIdAndUpdate(userId, {
      deletedAt: new Date(),
      isDeleted: true,
      // Anonymize PII
      email: `deleted_${userId}@deleted.local`,
      firstName: '[DELETED]',
      lastName: '[DELETED]',
      phone: null,
      avatar: null,
      emailVerificationToken: null,
      passwordResetToken: null,
      password: null,
    });

    // 4. Log audit event
    await auditLogger.log({
      eventType: 'ACCOUNT_DELETED_PERMANENTLY',
      userId,
      performedBy: 'system',
      details: {
        reason: user.deletionReason,
        requestedAt: user.deletionRequestedAt,
        scheduledFor: user.deletionScheduledFor,
        deletedAt: new Date(),
      },
      ipAddress: null,
      userAgent: null,
    });

    logger.info(`Account permanently deleted for user ${userId}`);

    // TODO: Send final confirmation email (if email still available)

    return {
      message: 'Account permanently deleted',
      userId,
      deletedAt: new Date(),
    };
  }

  /**
   * Delete all user-related data
   * @private
   */
  async deleteUserRelatedData(userId) {
    try {
      // Delete client profile
      await ClientProfile.findOneAndDelete({ userId });

      // Delete check-ins
      await Checkin.deleteMany({ clientId: userId });

      // Delete form analyses and associated videos
      const formAnalyses = await FormAnalysis.find({ userId });
      for (const analysis of formAnalyses) {
        // TODO: Delete video files from storage
        // await FileService.deleteFile(analysis.videoUrl);
      }
      await FormAnalysis.deleteMany({ userId });

      // Delete nutrition data
      await FoodLog.deleteMany({ userId });
      await MealPlan.deleteMany({ userId });

      // Mark sessions as "deleted client" instead of deleting
      // (coaches may need this for their records)
      await Session.updateMany(
        { clientId: userId },
        {
          $set: {
            clientDeleted: true,
            notes: '[Client account deleted]',
          },
        },
      );

      logger.info(`Related data deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting related data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find accounts scheduled for deletion (for scheduled job)
   */
  async findAccountsScheduledForDeletion() {
    const now = new Date();

    const scheduledAccounts = await User.find({
      deletionScheduledFor: { $lte: now },
      isDeleted: false,
    }).setOptions({ includeDeleted: false });

    return scheduledAccounts;
  }

  /**
   * Process scheduled deletions (cron job)
   */
  async processScheduledDeletions() {
    const accounts = await this.findAccountsScheduledForDeletion();

    logger.info(`Processing ${accounts.length} scheduled account deletions`);

    const results = {
      success: [],
      failed: [],
    };

    for (const account of accounts) {
      try {
        await this.permanentlyDeleteAccount(account._id.toString());
        results.success.push(account._id.toString());
      } catch (error) {
        logger.error(`Failed to delete account ${account._id}:`, error);
        results.failed.push({
          userId: account._id.toString(),
          error: error.message,
        });
      }
    }

    logger.info(`Scheduled deletions completed: ${results.success.length} success, ${results.failed.length} failed`);

    return results;
  }
}

module.exports = new AccountDeletionService();



