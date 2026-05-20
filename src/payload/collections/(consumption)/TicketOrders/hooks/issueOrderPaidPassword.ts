import { randomBytes } from "crypto";
import type { CollectionAfterChangeHook, PayloadRequest } from "payload";

import {
  TicketMailer,
  siteUrl,
  type MailLocale
} from "@/lib/email/ticket-mailer";
import type { TicketOrder } from "@/payload-types";

const ORDER_PASSWORD_LENGTH = 8;
const ORDER_PASSWORD_TTL_HOURS = 48;

type AnyDoc = Record<string, unknown> & { id: string };

/**
 * Issues the 48h order password the moment an admin flips `paid` to
 * true, and dispatches the password mail to the purchaser. The hook
 * is decomposed into two phases that run in a single combined persist
 * so re-entry through `payload.update` short-circuits cleanly.
 *
 *   Phase A — Password issuance:
 *     If `paid && !password`, generates an 8-char password and stamps
 *     `password_issued_at` / `password_expires_at` / `paid_at`.
 *     Idempotent: re-saves where password is already set leave it
 *     alone. Admins can manually clear `password` to force re-issue;
 *     the new password also clears `mailed_at` (because we don't write
 *     mailed_at when Phase B fails, the manual re-issue path will
 *     re-mail through the normal Phase B path).
 *
 *   Phase B — Password mail:
 *     If `paid && password && !mailed_at`, sends the order-password
 *     mail to the purchaser (locale per `ticket-orders.locale`, body
 *     from `Event.Order.PasswordMail` in messages/{en,ko}.json). On
 *     success → stamps `mailed_at = now`. On failure → leaves
 *     mailed_at null so the next admin save retries.
 *
 *   Re-entry:
 *     The single combined `payload.update` at the end fires this hook
 *     again. On that pass: doc.paid=true, doc.password=set, and
 *     doc.mailed_at=set (when mail succeeded) → the short-circuit
 *     guard at the top fires. When mail failed, the re-entry attempts
 *     Phase B exactly once more (since Phase A is no-op once password
 *     is set), giving us one self-healing retry per admin save.
 *
 *   Mailer is best-effort: it logs but does not throw, so a missing
 *   SMTP env, an unreachable Brevo, or a purchaser without an email
 *   never breaks the admin save round-trip — they leave mailed_at
 *   null and admin can retry by saving the row again.
 */
export const issueOrderPaidPassword: CollectionAfterChangeHook = async ({
  doc,
  previousDoc: _previousDoc,
  operation,
  req
}) => {
  if (operation !== "update") return doc;
  if (!doc?.paid) return doc;

  // Short-circuit re-entry from our own persist below: when password is
  // set AND mail has gone out, there's no work to do. Also covers
  // benign admin re-saves with no field changes.
  if (doc.password && doc.mailed_at) return doc;

  // ─── Phase A: ensure password issued ────────────────────────────────
  const now = new Date();
  let password: string | null = (doc.password as string | null) ?? null;
  let passwordIssuedAt: string | null =
    (doc.password_issued_at as string | null) ?? null;
  let passwordExpiresAt: string | null =
    (doc.password_expires_at as string | null) ?? null;
  let paidAt: string | null = (doc.paid_at as string | null) ?? null;
  let effectiveMailedAt: string | null =
    (doc.mailed_at as string | null) ?? null;
  let mailedAtChanged = false;

  const phaseAGenerated = !password;
  if (phaseAGenerated) {
    const expiry = new Date(
      now.getTime() + ORDER_PASSWORD_TTL_HOURS * 60 * 60 * 1000
    );
    password = generatePassword(ORDER_PASSWORD_LENGTH);
    passwordIssuedAt = now.toISOString();
    passwordExpiresAt = expiry.toISOString();
    paidAt = paidAt ?? now.toISOString();

    // Re-issue path: when admin cleared `password` to force re-issue,
    // we must also clear the stale `mailed_at` stamp so Phase B fires
    // unconditionally with the new password.
    if (effectiveMailedAt) {
      effectiveMailedAt = null;
      mailedAtChanged = true;
    }
  }

  // ─── Phase B: dispatch the password mail ────────────────────────────
  // Condition derives from local state, not `doc.mailed_at`, because
  // Phase A may have just invalidated the stamp above.
  if (password && !effectiveMailedAt) {
    const dispatched = await dispatchPasswordMail({
      doc: doc as AnyDoc,
      req,
      password,
      expiresAt: passwordExpiresAt ?? now.toISOString()
    });
    if (dispatched) {
      effectiveMailedAt = dispatched;
      mailedAtChanged = true;
    }
  }

  // ─── Combined persist ───────────────────────────────────────────────
  // Only write when there's actual work to commit, so plain admin
  // re-saves with no state changes don't loop.
  const patch: Partial<TicketOrder> = {};
  if (phaseAGenerated) {
    patch.password = password;
    patch.password_issued_at = passwordIssuedAt;
    patch.password_expires_at = passwordExpiresAt;
    patch.paid_at = paidAt;
  }
  if (mailedAtChanged) {
    patch.mailed_at = effectiveMailedAt;
  }

  if (Object.keys(patch).length === 0) {
    return doc;
  }

  await req.payload.update({
    collection: "ticket-orders",
    id: doc.id as string,
    overrideAccess: true,
    data: patch
  });

  return { ...doc, ...patch };
};

interface DispatchArgs {
  doc: AnyDoc;
  req: PayloadRequest;
  password: string;
  expiresAt: string;
}

/**
 * Resolves the purchaser email, event metadata, and sibling ticket
 * count, then fires the order-password mail. Returns the ISO timestamp
 * to stamp `mailed_at` with on success, or `null` on any failure
 * (missing data, mail send returned false, exception). Never throws —
 * Phase B errors must not break the admin save round-trip.
 */
async function dispatchPasswordMail(
  args: DispatchArgs
): Promise<string | null> {
  const { doc, req, password, expiresAt } = args;
  try {
    const purchaserId = relationshipId(doc.purchaser);
    const eventId = relationshipId(doc.event);
    if (!purchaserId || !eventId) {
      req.payload.logger?.warn?.(
        `[issueOrderPaidPassword] order ${doc.id} missing purchaser or event id; skipping mail`
      );
      return null;
    }

    const [purchaser, event, ticketsPage] = await Promise.all([
      req.payload
        .findByID({
          collection: "users",
          id: purchaserId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null),
      req.payload
        .findByID({
          collection: "events",
          id: eventId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null),
      req.payload
        .find({
          collection: "tickets",
          where: { order: { equals: doc.id } },
          depth: 0,
          limit: 0,
          overrideAccess: true
        })
        .catch(() => null)
    ]);

    const purchaserEmail =
      purchaser && typeof (purchaser as { email?: unknown }).email === "string"
        ? ((purchaser as { email: string }).email as string)
        : null;
    if (!purchaserEmail) {
      req.payload.logger?.warn?.(
        `[issueOrderPaidPassword] order ${doc.id} purchaser ${purchaserId} has no email; skipping mail`
      );
      return null;
    }

    const eventRow = event as {
      name?: string;
      date?: string | null;
      location?: string | null;
    } | null;

    const locale: MailLocale =
      (doc.locale as string | undefined) === "en" ? "en" : "ko";
    const quantity = Math.max(1, ticketsPage?.totalDocs ?? 1);
    const orderUrl = `${siteUrl}/day-n-night/my`;

    const mailer = new TicketMailer(req.payload);
    const sent = await mailer.sendOrderPaidPassword({
      purchaserEmail,
      locale,
      eventName: eventRow?.name ?? "Day n Night",
      eventDate: eventRow?.date ?? null,
      eventLocation: eventRow?.location ?? null,
      quantity,
      password,
      expiresAt,
      orderUrl
    });

    return sent ? new Date().toISOString() : null;
  } catch (err) {
    req.payload.logger?.error?.(
      `[issueOrderPaidPassword] mail dispatch threw for order ${doc.id}: ${(err as Error).message}`
    );
    return null;
  }
}

function relationshipId(rel: unknown): string | null {
  if (!rel) return null;
  if (typeof rel === "string") return rel;
  if (typeof rel === "object" && rel !== null && "id" in rel) {
    const id = (rel as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

/**
 * Generate a short, human-readable password. Avoids ambiguous chars
 * (0/O/1/l/I) so it's easy to retype from a phone screen.
 */
function generatePassword(length: number): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const buf = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out;
}
