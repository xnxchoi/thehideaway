import nodemailer from 'nodemailer';
import { BasePayload } from 'payload';
import { EmailRateLimiter, EmailCategory, EmailRequest } from './email/rate-limiter';

export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export function createBrevoEmailAdapter({ payload }: { payload: BasePayload }) {
  // Create Nodemailer transporter for Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER, // Your Brevo SMTP login
      pass: process.env.BREVO_SMTP_PASS, // Your Brevo SMTP password
    },
  });

  return {
    name: 'brevo-nodemailer',
    defaultFromAddress: process.env.EMAIL_FROM || 'concierge@hideawayseoul.com',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Concierge @The Hideaway',
    
    sendEmail: async (message: EmailMessage) => {
      try {
        // Validate required fields
        if (!message.to || !message.subject) {
          throw new Error('Missing required email fields: to, subject');
        }

        // Prepare email options
        const mailOptions = {
          from: message.from || `${process.env.EMAIL_FROM_NAME || 'Concierge @The Hideaway'} <${process.env.EMAIL_FROM || 'concierge@hideawayseoul.com'}>`,
          to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments: message.attachments,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        
        payload.logger.info(`Email sent successfully: ${info.messageId}`);
        
        return {
          messageId: info.messageId,
          success: true,
        };
      } catch (error) {
        payload.logger.error(`Failed to send email: ${(error as Error).message}`);
        throw error;
      }
    },
  };
}
