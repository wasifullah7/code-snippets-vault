/**
 * Email service utility for Node.js
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor(options = {}) {
    this.transporter = null;
    this.options = {
      host: options.host || process.env.SMTP_HOST,
      port: options.port || process.env.SMTP_PORT || 587,
      secure: options.secure || false,
      auth: {
        user: options.user || process.env.SMTP_USER,
        pass: options.pass || process.env.SMTP_PASS
      },
      ...options
    };
    
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    try {
      this.transporter = nodemailer.createTransporter(this.options);
      await this.transporter.verify();
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Email service initialization failed:', error);
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const emailOptions = {
      from: options.from || this.options.auth.user,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments || []
    };

    try {
      const result = await this.transporter.sendMail(emailOptions);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @returns {Promise<Object>} Send result
   */
  async sendWelcomeEmail(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome ${name}!</h2>
        <p>Thank you for joining us. We're excited to have you on board!</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    return this.send({
      to: email,
      subject: 'Welcome to Our Platform!',
      html,
      text: `Welcome ${name}! Thank you for joining us.`
    });
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Reset token
   * @param {string} resetUrl - Reset URL
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}?token=${resetToken}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    return this.send({
      to: email,
      subject: 'Password Reset Request',
      html,
      text: `Password reset requested. Click here: ${resetUrl}?token=${resetToken}`
    });
  }

  /**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} verificationToken - Verification token
   * @param {string} verificationUrl - Verification URL
   * @returns {Promise<Object>} Send result
   */
  async sendVerificationEmail(email, verificationToken, verificationUrl) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}?token=${verificationToken}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>This link will expire in 24 hours.</p>
      </div>
    `;

    return this.send({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text: `Please verify your email: ${verificationUrl}?token=${verificationToken}`
    });
  }

  /**
   * Send notification email
   * @param {string} email - Recipient email
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} Send result
   */
  async sendNotificationEmail(email, title, message, data = {}) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${title}</h2>
        <p>${message}</p>
        ${data.actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              ${data.actionText || 'View Details'}
            </a>
          </div>
        ` : ''}
      </div>
    `;

    return this.send({
      to: email,
      subject: title,
      html,
      text: `${title}\n\n${message}${data.actionUrl ? `\n\nView: ${data.actionUrl}` : ''}`
    });
  }

  /**
   * Send bulk emails
   * @param {Array} recipients - Array of recipient objects
   * @param {Object} template - Email template
   * @param {number} batchSize - Batch size for sending
   * @returns {Promise<Array>} Send results
   */
  async sendBulkEmails(recipients, template, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient => {
        const personalizedTemplate = this.personalizeTemplate(template, recipient);
        return this.send(personalizedTemplate);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
      ));
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Personalize email template
   * @param {Object} template - Email template
   * @param {Object} recipient - Recipient data
   * @returns {Object} Personalized template
   */
  personalizeTemplate(template, recipient) {
    const personalized = { ...template };
    
    // Replace placeholders in subject
    if (personalized.subject) {
      personalized.subject = this.replacePlaceholders(personalized.subject, recipient);
    }
    
    // Replace placeholders in HTML
    if (personalized.html) {
      personalized.html = this.replacePlaceholders(personalized.html, recipient);
    }
    
    // Replace placeholders in text
    if (personalized.text) {
      personalized.text = this.replacePlaceholders(personalized.text, recipient);
    }
    
    personalized.to = recipient.email;
    
    return personalized;
  }

  /**
   * Replace placeholders in text
   * @param {string} text - Text with placeholders
   * @param {Object} data - Data to replace placeholders
   * @returns {string} Text with replaced placeholders
   */
  replacePlaceholders(text, data) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} Configuration validity
   */
  async testConfiguration() {
    try {
      if (!this.transporter) {
        return false;
      }
      
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

module.exports = EmailService;
