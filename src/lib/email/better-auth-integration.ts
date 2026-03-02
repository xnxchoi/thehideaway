import "server-only";
import nodemailer from 'nodemailer';
import {BasePayload} from "payload";

export enum EmailCategory {
  NOTIFICATIONS = 'notifications',
  ALERTS = 'alerts', 
  VALIDATORS = 'validators',
  AUTHENTICATORS = 'authenticators',
  MISC = 'misc'
}

interface QuotaTracker {
  dailyCount: number;
  lastReset: string;
}

export class BetterAuthEmailService {
  private transporter: nodemailer.Transporter;
  private payload?: BasePayload;
  private dailyLimit = 300; // Brevo free tier
  
  private quotaTracker: QuotaTracker = { dailyCount: 0, lastReset:  new Date().toISOString().split('T')[0] || '' };

  constructor(payload?: BasePayload) {
    this.payload = payload;
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER!,
        pass: process.env.BREVO_SMTP_PASS!,
      },
    });
  }

  private checkAndResetQuota(): void {
    const today = new Date().toISOString().split('T')[0];
    if (!today) {
      throw new Error('Failed to get today\'s date');
    }
    if (this.quotaTracker.lastReset !== today) {
      this.quotaTracker = { dailyCount: 0, lastReset: today };
    }
  }

  private canSendEmail(category: EmailCategory, userTriggered: boolean = false): {
    canSend: boolean;
    action: 'send' | 'defer' | 'disable' | 'block';
    reason?: string;
  } {
    this.checkAndResetQuota();

    if (this.quotaTracker.dailyCount < this.dailyLimit) {
      return { canSend: true, action: 'send' };
    }

    // Apply your categorization logic
    switch (category) {
      case EmailCategory.NOTIFICATIONS:
        return {
          canSend: false,
          action: 'defer',
          reason: 'Daily quota exceeded. Notification deferred to next quota period.'
        };

      case EmailCategory.ALERTS:
        return {
          canSend: false,
          action: userTriggered ? 'disable' : 'defer',
          reason: userTriggered 
            ? 'Daily quota exceeded. Action temporarily disabled until next quota period.'
            : 'Daily quota exceeded. Alert deferred to next quota period.'
        };

      case EmailCategory.VALIDATORS:
        return {
          canSend: false,
          action: 'defer',
          reason: 'Daily quota exceeded. Validation email deferred to next quota period.'
        };

      case EmailCategory.AUTHENTICATORS:
        return {
          canSend: false,
          action: 'disable',
          reason: 'Daily quota exceeded. Authentication action disabled until next quota period.'
        };

      default:
        return {
          canSend: false,
          action: 'block',
          reason: 'Daily quota exceeded.'
        };
    }
  }

  private async sendEmailInternal(options: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<void> {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'The Hideaway'} <${process.env.EMAIL_FROM || 'concierge@hideawayseoul.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await this.transporter.sendMail(mailOptions);
    this.quotaTracker.dailyCount++;
    
    if (this.payload) {
      this.payload.logger.info(`Email sent to ${options.to}: ${options.subject}`);
    }
  }

  async sendMagicLink(email: string, token: string, url: string): Promise<void> {
    const quotaCheck = this.canSendEmail(EmailCategory.AUTHENTICATORS, true);
    
    if (!quotaCheck.canSend) {
      if (this.payload) {
        this.payload.logger.warn(`Magic link blocked: ${quotaCheck.reason}`);
      }
      throw new Error(`Magic link unavailable: ${quotaCheck.reason}`);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sign in to The Hideaway</h2>
        <p>Click the button below to sign in to your account:</p>
        <a href="${url}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Sign In
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p><small>This link will expire in 15 minutes for security reasons.</small></p>
      </div>
    `;

    await this.sendEmailInternal({
      to: email,
      subject: 'Sign in to The Hideaway',
      html,
      text: `Sign in to The Hideaway: ${url}`
    });
  }

  async sendOTP(email: string, otp: string, type: 'sign-in' | 'email-verification'): Promise<void> {
    const category = type === 'email-verification' ? EmailCategory.VALIDATORS : EmailCategory.AUTHENTICATORS;
    const quotaCheck = this.canSendEmail(category, true);
    
    if (!quotaCheck.canSend) {
      if (this.payload) {
        this.payload.logger.warn(`OTP blocked: ${quotaCheck.reason}`);
      }
      
      if (quotaCheck.action === 'defer' && type === 'email-verification') {
        // For email verification, we can defer
        return;
      }
      
      throw new Error(`OTP unavailable: ${quotaCheck.reason}`);
    }

    const isVerification = type === 'email-verification';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${isVerification ? 'Verify your email' : 'Your verification code'}</h2>
        <p>Use this code to ${isVerification ? 'verify your email address' : 'sign in to your account'}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
        </div>
        <p><small>This code will expire in 10 minutes for security reasons.</small></p>
      </div>
    `;

    await this.sendEmailInternal({
      to: email,
      subject: isVerification ? 'Verify your email - The Hideaway' : 'Your verification code - The Hideaway',
      html,
      text: `Your verification code: ${otp}`
    });
  }

  async sendPasswordReset(email: string, url: string): Promise<void> {
    const quotaCheck = this.canSendEmail(EmailCategory.VALIDATORS, true);
    
    if (!quotaCheck.canSend) {
      if (this.payload) {
        this.payload.logger.warn(`Password reset blocked: ${quotaCheck.reason}`);
      }
      throw new Error(`Password reset unavailable: ${quotaCheck.reason}`);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested to reset your password for The Hideaway. Click the button below to set a new password:</p>
        <a href="${url}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p><small>This link will expire in 1 hour for security reasons.</small></p>
        <p><small>If you didn't request this password reset, you can safely ignore this email.</small></p>
      </div>
    `;

    await this.sendEmailInternal({
      to: email,
      subject: 'Reset your password - The Hideaway',
      html,
      text: `Reset your password: ${url}`
    });
  }

  /**
   * Send Two-Factor Authentication code
   */
  async send2FACode(email: string, code: string): Promise<void> {
    const quotaCheck = this.canSendEmail(EmailCategory.AUTHENTICATORS, true);
    
    if (!quotaCheck.canSend) {
      if (this.payload) {
        this.payload.logger.warn(`2FA code blocked: ${quotaCheck.reason}`);
      }
      throw new Error(`2FA code unavailable: ${quotaCheck.reason}`);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Two-Factor Authentication Code</h2>
        <p>Your authentication code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await this.sendEmailInternal({
      to: email,
      subject: 'Your Two-Factor Authentication Code - The Hideaway',
      html,
      text: `Your 2FA code: ${code}`
    });
  }

  /**
   * Send Email Harmony validation email
   */
  async sendEmailHarmonyValidation(email: string, token: string, url: string): Promise<void> {
    const quotaCheck = this.canSendEmail(EmailCategory.VALIDATORS, false);
    
    if (!quotaCheck.canSend) {
      if (this.payload) {
        this.payload.logger.warn(`Email harmony validation blocked: ${quotaCheck.reason}`);
      }
      // For validators, we can defer instead of throwing
      if (quotaCheck.action === 'defer') {
        return;
      }
      throw new Error(`Email validation unavailable: ${quotaCheck.reason}`);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification Required</h2>
        <p>Please verify your email address to complete your account setup.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 3px;">
          ${url}
        </p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `;

    await this.sendEmailInternal({
      to: email,
      subject: 'Verify Your Email Address - The Hideaway',
      html,
      text: `Verify your email: ${url}`
    });
  }

  getQuotaStatus(): { used: number; remaining: number; resetTime: string } {
    this.checkAndResetQuota();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      used: this.quotaTracker.dailyCount,
      remaining: Math.max(0, this.dailyLimit - this.quotaTracker.dailyCount),
      resetTime: tomorrow.toISOString()
    };
  }
}
