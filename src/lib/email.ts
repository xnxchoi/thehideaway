import { nodemailerAdapter } from "@payloadcms/email-nodemailer";

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

export const createBrevoEmailAdapter = nodemailerAdapter({
  defaultFromAddress: process.env.EMAIL_FROM || "concierge@hideawayseoul.com",
  defaultFromName: process.env.EMAIL_FROM_NAME || "Concierge @The Hideaway"
  // transportOptions: {
  //   host: "smtp-relay.brevo.com",
  //   port: 587,
  //   secure: false, // true for 465, false for other ports
  //   auth: {
  //     user: process.env.BREVO_SMTP_USER, // Your Brevo SMTP login
  //     pass: process.env.BREVO_SMTP_PASS // Your Brevo SMTP password
  //   }
  // }
});
