/**
 * Notification Service
 * Handles Email, SMS, and Push notifications
 */

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');
const config = require('../../../common/config');
const logger = require('../../../common/utils/logger');

class NotificationService {
  constructor() {
    // Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });

    // SMS client (Twilio)
    if (config.sms.accountSid && config.sms.authToken) {
      this.smsClient = twilio(config.sms.accountSid, config.sms.authToken);
    }

    // Push notifications (Firebase)
    if (config.firebase.projectId) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
            clientEmail: config.firebase.clientEmail,
          }),
        });
      } catch (error) {
        logger.warn('Firebase initialization failed:', error.message);
      }
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, html, text = '') {
    try {
      const info = await this.emailTransporter.sendMail({
        from: config.email.from,
        to,
        subject,
        text,
        html,
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to, message) {
    if (!this.smsClient) {
      logger.warn('SMS client not configured');
      return { success: false, error: 'SMS not configured' };
    }

    try {
      const result = await this.smsClient.messages.create({
        body: message,
        from: config.sms.phoneNumber,
        to,
      });

      logger.info(`SMS sent to ${to}: ${result.sid}`);

      return { success: true, messageId: result.sid };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  async sendPush(token, title, body, data = {}) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        token,
      };

      const response = await admin.messaging().send(message);

      logger.info(`Push notification sent: ${response}`);

      return { success: true, messageId: response };
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   */
  async sendNotification(user, notification) {
    const { email, sms, push } = user.preferences?.notifications || {};
    const results = {};

    if (email && user.email) {
      results.email = await this.sendEmail(
        user.email,
        notification.subject,
        notification.html,
        notification.text,
      );
    }

    if (sms && user.phone) {
      results.sms = await this.sendSMS(user.phone, notification.smsText || notification.text);
    }

    if (push && user.pushToken) {
      results.push = await this.sendPush(
        user.pushToken,
        notification.title,
        notification.text,
        notification.data,
      );
    }

    return results;
  }

  /**
   * Email templates
   */
  async sendWelcomeEmail(user) {
    const html = `
      <h1>Welcome to CoachFlow, ${user.firstName}!</h1>
      <p>We're excited to have you on board.</p>
      <p>Get started by completing your profile and exploring the platform.</p>
    `;

    return await this.sendEmail(user.email, 'Welcome to CoachFlow', html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.cors.origin}/reset-password/${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.firstName},</p>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return await this.sendEmail(user.email, 'Password Reset', html);
  }

  async sendSessionReminder(session) {
    const client = session.clientId;
    const coach = session.coachId;

    const html = `
      <h1>Session Reminder</h1>
      <p>Hi ${client.firstName},</p>
      <p>This is a reminder for your upcoming session with ${coach.firstName}.</p>
      <p><strong>Time:</strong> ${new Date(session.startTime).toLocaleString()}</p>
      <p><strong>Duration:</strong> ${session.duration} minutes</p>
      ${session.meetingLink ? `<p><a href="${session.meetingLink}">Join Meeting</a></p>` : ''}
    `;

    return await this.sendEmail(client.email, 'Session Reminder', html);
  }
}

module.exports = new NotificationService();
