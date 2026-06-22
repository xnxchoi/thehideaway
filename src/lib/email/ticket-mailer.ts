import nodemailer from "nodemailer";
import { getTranslations } from "next-intl/server";
import type { BasePayload } from "payload";

export type MailLocale = "en" | "ko";

/**
 * Ticket lifecycle mailer.
 *
 * Sends customer-facing emails through Brevo SMTP (same transport as
 * `BetterAuthEmailService`). Each method is best-effort: it logs but does
 * not throw, so callers in hooks/route handlers can fire-and-forget
 * without worrying about back-pressure on the user flow.
 *
 * The transport is constructed lazily so this module is safe to import
 * without env vars present (tests, build-time).
 */

const FROM_NAME = process.env.EMAIL_FROM_NAME || "The Hideaway";
const FROM_ADDR = process.env.EMAIL_FROM || "concierge@hideawayseoul.com";
const FROM = `${FROM_NAME} <${FROM_ADDR}>`;

const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/+$/, "") ||
  "https://hideawayseoul.com";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;
  if (!user || !pass) return null;
  cachedTransporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user, pass }
  });
  return cachedTransporter;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function send(
  payload: BasePayload | undefined,
  args: SendArgs
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    payload?.logger.warn?.(
      `[ticket-mailer] SMTP not configured; skipping mail to ${args.to}`
    );
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM, ...args });
    payload?.logger.info?.(
      `[ticket-mailer] sent "${args.subject}" → ${args.to}`
    );
    return true;
  } catch (err) {
    payload?.logger.error?.(
      `[ticket-mailer] failed to send "${args.subject}" → ${args.to}: ${(err as Error).message}`
    );
    return false;
  }
}

const KRW = new Intl.NumberFormat("ko-KR");
const formatKRW = (amount: number): string => `₩${KRW.format(amount)}`;

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Seoul"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const escape = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Editorial frame for every ticket email. Mono-led, restrained, prints OK.
 * Avoids loud buttons and gradients — matches the Footer aesthetic.
 */
const frame = (heading: string, bodyHtml: string): string => `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;">
  <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin:0 0 24px;">The Hideaway</p>
  <h1 style="font-size:26px;font-weight:300;line-height:1.2;margin:0 0 24px;letter-spacing:-0.01em;">${heading}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #ddd;margin:40px 0 20px;"/>
  <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#999;margin:0;">
    hideawayseoul.com · concierge@hideawayseoul.com
  </p>
</div>`;

export interface TicketContext {
  ticketId: string;
  ticketNumber?: number | null;
  eventName: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  ticketPrice?: number | null;
  recipientEmail: string;
  recipientName?: string | null;
}

export interface PurchaseReceiptArgs extends TicketContext {
  quantity: number;
  totalAmount: number;
  paymentInstructions?: string | null;
  managementUrl?: string | null;
}

export interface GiftInviteArgs extends TicketContext {
  claimUrl: string;
  fromName?: string | null;
}

export interface ActivationArgs extends TicketContext {
  qrUrl: string;
}

export interface RefundArgs extends TicketContext {
  refundAmount: number;
  refundPercent: number;
}

export interface ReminderArgs extends TicketContext {
  qrUrl: string;
  hoursUntil: number;
}

export interface OrderPasswordArgs {
  purchaserEmail: string;
  locale: MailLocale;
  eventName: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  quantity: number;
  password: string;
  expiresAt: string;
  orderUrl: string;
}

export class TicketMailer {
  constructor(private payload?: BasePayload) {}

  /**
   * Receipt for the purchaser at reservation time — confirms intent and
   * surfaces payment instructions so the buyer can complete the transfer.
   */
  async sendPurchaseReceipt(args: PurchaseReceiptArgs): Promise<boolean> {
    const subject = `Reservation pending — ${args.eventName}`;
    const lines: string[] = [];
    lines.push(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">We've received your reservation request. Your ${args.quantity > 1 ? `${args.quantity} tickets are` : "ticket is"} held under <strong>pending</strong> status until payment is confirmed.</p>`
    );
    lines.push(
      `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:12px;margin:24px 0;">
        <tr><td style="padding:6px 0;color:#888;width:38%;">Event</td><td style="padding:6px 0;">${escape(args.eventName)}</td></tr>
        ${args.eventDate ? `<tr><td style="padding:6px 0;color:#888;">When</td><td style="padding:6px 0;">${escape(formatDateTime(args.eventDate))}</td></tr>` : ""}
        ${args.eventLocation ? `<tr><td style="padding:6px 0;color:#888;">Where</td><td style="padding:6px 0;">${escape(args.eventLocation)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#888;">Quantity</td><td style="padding:6px 0;">${args.quantity}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Amount</td><td style="padding:6px 0;">${formatKRW(args.totalAmount)}</td></tr>
      </table>`
    );
    if (args.paymentInstructions) {
      lines.push(
        `<div style="background:#f7f6f3;padding:18px 20px;border-left:2px solid #1a1a1a;margin:20px 0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escape(args.paymentInstructions)}</div>`
      );
    }
    const managementUrl = args.managementUrl ?? `${SITE_URL}/tickets/my`;
    const managementDisplayUrl = managementUrl.replace(/^https?:\/\//, "");
    lines.push(
      `<p style="font-size:14px;line-height:1.6;color:#555;margin:20px 0 0;">Once payment clears, your ticket will activate automatically and a separate email will arrive with your QR check-in code. You can view your tickets at <a href="${escape(managementUrl)}" style="color:#1a1a1a;">${escape(managementDisplayUrl)}</a>.</p>`
    );

    const html = frame("Your reservation is held.", lines.join("\n"));
    const text =
      `Reservation pending — ${args.eventName}\n\n` +
      `Quantity: ${args.quantity}\n` +
      `Amount: ${formatKRW(args.totalAmount)}\n` +
      (args.paymentInstructions ? `\n${args.paymentInstructions}\n` : "") +
      `\nView at ${managementUrl}`;

    return send(this.payload, {
      to: args.recipientEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Invitation for the recipient of a gift ticket — landed in the
   * purchaser's outbox; surfaces the claim URL.
   */
  async sendGiftInvite(args: GiftInviteArgs): Promise<boolean> {
    const subject = `${args.fromName ? `${args.fromName} sent you` : "You've received"} a ticket — ${args.eventName}`;
    const lines: string[] = [];
    lines.push(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${args.fromName ? `<strong>${escape(args.fromName)}</strong> has reserved a ticket for you.` : "Someone reserved a ticket for you."} Claim it to bind it to your account.</p>`
    );
    lines.push(
      `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:12px;margin:24px 0;">
        <tr><td style="padding:6px 0;color:#888;width:38%;">Event</td><td style="padding:6px 0;">${escape(args.eventName)}</td></tr>
        ${args.eventDate ? `<tr><td style="padding:6px 0;color:#888;">When</td><td style="padding:6px 0;">${escape(formatDateTime(args.eventDate))}</td></tr>` : ""}
        ${args.eventLocation ? `<tr><td style="padding:6px 0;color:#888;">Where</td><td style="padding:6px 0;">${escape(args.eventLocation)}</td></tr>` : ""}
      </table>`
    );
    lines.push(
      `<p style="margin:28px 0;"><a href="${args.claimUrl}" style="display:inline-block;border:1px solid #1a1a1a;padding:12px 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;">Claim your ticket</a></p>`
    );
    lines.push(
      `<p style="font-size:13px;line-height:1.6;color:#555;margin:0;">Or paste this URL into your browser:<br/><span style="font-family:'Courier New',monospace;font-size:12px;word-break:break-all;color:#1a1a1a;">${escape(args.claimUrl)}</span></p>`
    );
    lines.push(
      `<p style="font-size:13px;line-height:1.6;color:#888;margin:18px 0 0;">This link is single-use. If the ticket has already been claimed, this URL will no longer work.</p>`
    );

    const html = frame(
      "A ticket has been set aside for you.",
      lines.join("\n")
    );
    const text =
      `${args.fromName ? `${args.fromName} sent` : "You have received"} a ticket — ${args.eventName}\n\n` +
      `Claim: ${args.claimUrl}\n` +
      `\nThis link is single-use.`;

    return send(this.payload, {
      to: args.recipientEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Activation confirmation — paid:false → true. Carries the QR URL.
   */
  async sendActivation(args: ActivationArgs): Promise<boolean> {
    const subject = `Your ticket is confirmed — ${args.eventName}`;
    const lines: string[] = [];
    lines.push(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Payment received. Your ticket is now <strong>active</strong>.</p>`
    );
    lines.push(
      `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:12px;margin:24px 0;">
        ${args.ticketNumber ? `<tr><td style="padding:6px 0;color:#888;width:38%;">Ticket №</td><td style="padding:6px 0;">${args.ticketNumber}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#888;">Event</td><td style="padding:6px 0;">${escape(args.eventName)}</td></tr>
        ${args.eventDate ? `<tr><td style="padding:6px 0;color:#888;">When</td><td style="padding:6px 0;">${escape(formatDateTime(args.eventDate))}</td></tr>` : ""}
        ${args.eventLocation ? `<tr><td style="padding:6px 0;color:#888;">Where</td><td style="padding:6px 0;">${escape(args.eventLocation)}</td></tr>` : ""}
      </table>`
    );
    lines.push(
      `<p style="margin:28px 0;"><a href="${args.qrUrl}" style="display:inline-block;border:1px solid #1a1a1a;padding:12px 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;">Open your ticket</a></p>`
    );
    lines.push(
      `<p style="font-size:13px;line-height:1.6;color:#555;margin:0;">Bring your phone the day-of. Staff will scan the QR code on the ticket page.</p>`
    );

    const html = frame("You're in.", lines.join("\n"));
    const text =
      `Your ticket is confirmed — ${args.eventName}\n\n` +
      (args.ticketNumber ? `Ticket №: ${args.ticketNumber}\n` : "") +
      `\nOpen: ${args.qrUrl}`;

    return send(this.payload, {
      to: args.recipientEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Refund confirmation — fired by onTicketRefund afterChange.
   */
  async sendRefund(args: RefundArgs): Promise<boolean> {
    const subject = `Refund issued — ${args.eventName}`;
    const lines: string[] = [];
    lines.push(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Your ticket has been canceled and a refund of <strong>${formatKRW(args.refundAmount)}</strong> (${args.refundPercent}% of the ticket price) has been issued.</p>`
    );
    lines.push(
      `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:12px;margin:24px 0;">
        ${args.ticketNumber ? `<tr><td style="padding:6px 0;color:#888;width:38%;">Ticket №</td><td style="padding:6px 0;">${args.ticketNumber}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#888;">Event</td><td style="padding:6px 0;">${escape(args.eventName)}</td></tr>
        ${args.ticketPrice ? `<tr><td style="padding:6px 0;color:#888;">Paid</td><td style="padding:6px 0;">${formatKRW(args.ticketPrice)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#888;">Refunded</td><td style="padding:6px 0;">${formatKRW(args.refundAmount)}</td></tr>
      </table>`
    );
    lines.push(
      `<p style="font-size:13px;line-height:1.6;color:#555;margin:0;">Refunds typically settle within 3–5 business days on the original payment method. Schedule details: <a href="${SITE_URL}/refund" style="color:#1a1a1a;">${SITE_URL.replace(/^https?:\/\//, "")}/refund</a>.</p>`
    );

    const html = frame("Refund issued.", lines.join("\n"));
    const text =
      `Refund issued — ${args.eventName}\n\n` +
      `Refunded: ${formatKRW(args.refundAmount)} (${args.refundPercent}%)\n` +
      `\nDetails: ${SITE_URL}/refund`;

    return send(this.payload, {
      to: args.recipientEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Order-password mail (P4C-2). Sent to the **purchaser** when an admin
   * flips `ticket-orders.paid` to true. Carries the 48h password the
   * purchaser must share with each gift recipient so they can complete
   * `/day-n-night/claim/[token]`.
   *
   * Locale is per-order (snapshotted from the purchaser's session locale
   * at order creation by the 4-step flow; admin-overridable). Strings
   * are pulled from `messages/{en,ko}.json` under
   * `Event.Order.PasswordMail` — same single-source-of-locale rule as
   * the rest of the site.
   */
  async sendOrderPaidPassword(args: OrderPasswordArgs): Promise<boolean> {
    const t = await getTranslations({
      locale: args.locale,
      namespace: "Event.Order.PasswordMail"
    });

    const fmtDate = (iso: string | null | undefined): string => {
      if (!iso) return "—";
      try {
        return new Intl.DateTimeFormat(
          args.locale === "ko" ? "ko-KR" : "en-GB",
          {
            dateStyle: "long",
            timeStyle: "short",
            timeZone: "Asia/Seoul"
          }
        ).format(new Date(iso));
      } catch {
        return iso;
      }
    };

    const subject = t("subject");
    const heading = t("heading");
    const lead = t("lead", { quantity: args.quantity });
    const fEvent = t("fields.event");
    const fWhen = t("fields.when");
    const fWhere = t("fields.where");
    const fQty = t("fields.quantity");
    const fPassword = t("fields.password");
    const fExpires = t("fields.expires");
    const passwordCaption = t("passwordCaption");
    const shareTitle = t("share.title");
    const shareBody = t("share.body");
    const ctaLabel = t("ctaLabel");
    const ctaFallback = t("ctaFallback");
    const footerNote = t("footerNote");

    const lines: string[] = [];
    lines.push(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${escape(lead)}</p>`
    );
    lines.push(
      `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:12px;margin:24px 0;">
        <tr><td style="padding:6px 0;color:#888;width:38%;">${escape(fEvent)}</td><td style="padding:6px 0;">${escape(args.eventName)}</td></tr>
        ${args.eventDate ? `<tr><td style="padding:6px 0;color:#888;">${escape(fWhen)}</td><td style="padding:6px 0;">${escape(fmtDate(args.eventDate))}</td></tr>` : ""}
        ${args.eventLocation ? `<tr><td style="padding:6px 0;color:#888;">${escape(fWhere)}</td><td style="padding:6px 0;">${escape(args.eventLocation)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#888;">${escape(fQty)}</td><td style="padding:6px 0;">${args.quantity}</td></tr>
      </table>`
    );
    lines.push(
      `<div style="background:#f7f6f3;padding:22px 24px;border-left:2px solid #1a1a1a;margin:24px 0;">
        <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin:0 0 12px;">${escape(fPassword)}</p>
        <p style="font-family:'Courier New',monospace;font-size:28px;letter-spacing:0.08em;margin:0;color:#1a1a1a;font-weight:600;">${escape(args.password)}</p>
        <p style="font-family:'Courier New',monospace;font-size:11px;color:#888;margin:14px 0 0;">${escape(fExpires)}: ${escape(fmtDate(args.expiresAt))} · ${escape(passwordCaption)}</p>
      </div>`
    );
    lines.push(
      `<h2 style="font-size:15px;font-weight:500;margin:32px 0 8px;letter-spacing:-0.005em;">${escape(shareTitle)}</h2>`
    );
    lines.push(
      `<p style="font-size:14px;line-height:1.65;color:#555;margin:0 0 24px;">${escape(shareBody)}</p>`
    );
    lines.push(
      `<p style="margin:28px 0;"><a href="${args.orderUrl}" style="display:inline-block;border:1px solid #1a1a1a;padding:12px 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;">${escape(ctaLabel)}</a></p>`
    );
    lines.push(
      `<p style="font-size:13px;line-height:1.6;color:#555;margin:0 0 18px;">${escape(ctaFallback)}<br/><span style="font-family:'Courier New',monospace;font-size:12px;word-break:break-all;color:#1a1a1a;">${escape(args.orderUrl)}</span></p>`
    );
    lines.push(
      `<p style="font-size:12px;line-height:1.6;color:#888;margin:24px 0 0;">${escape(footerNote)}</p>`
    );

    const html = frame(heading, lines.join("\n"));
    const text =
      `${subject}\n\n` +
      `${lead}\n\n` +
      `${fEvent}: ${args.eventName}\n` +
      (args.eventDate ? `${fWhen}: ${fmtDate(args.eventDate)}\n` : "") +
      (args.eventLocation ? `${fWhere}: ${args.eventLocation}\n` : "") +
      `${fQty}: ${args.quantity}\n\n` +
      `${fPassword}: ${args.password}\n` +
      `${fExpires}: ${fmtDate(args.expiresAt)}\n` +
      `${passwordCaption}\n\n` +
      `${shareTitle}\n${shareBody}\n\n` +
      `${ctaLabel}: ${args.orderUrl}\n\n` +
      `${footerNote}`;

    return send(this.payload, {
      to: args.purchaserEmail,
      subject,
      html,
      text
    });
  }

  /**
   * Pre-event reminder. Caller controls timing; this just renders.
   */
  async sendReminder(args: ReminderArgs): Promise<boolean> {
    const subject = `Tomorrow — ${args.eventName}`;
    const lines: string[] = [];
    lines.push(
      `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">A reminder: ${args.eventName} ${args.hoursUntil <= 24 ? "is tomorrow" : `is in ${Math.round(args.hoursUntil / 24)} days`}.</p>`
    );
    lines.push(
      `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:12px;margin:24px 0;">
        ${args.eventDate ? `<tr><td style="padding:6px 0;color:#888;width:38%;">When</td><td style="padding:6px 0;">${escape(formatDateTime(args.eventDate))}</td></tr>` : ""}
        ${args.eventLocation ? `<tr><td style="padding:6px 0;color:#888;">Where</td><td style="padding:6px 0;">${escape(args.eventLocation)}</td></tr>` : ""}
      </table>`
    );
    lines.push(
      `<p style="margin:28px 0;"><a href="${args.qrUrl}" style="display:inline-block;border:1px solid #1a1a1a;padding:12px 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;">Open your ticket</a></p>`
    );

    const html = frame("See you soon.", lines.join("\n"));
    const text =
      `Reminder: ${args.eventName} — ${formatDateTime(args.eventDate)}\n\n` +
      `Open: ${args.qrUrl}`;

    return send(this.payload, {
      to: args.recipientEmail,
      subject,
      html,
      text
    });
  }
}

export const siteUrl = SITE_URL;
