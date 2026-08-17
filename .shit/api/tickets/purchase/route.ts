import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders, cookies as nextCookies } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { nanoid } from "nanoid";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { safeEqual } from "@/lib/api/safeEqual";
import { beginIdempotent } from "@/lib/api/idempotency";
import { eventPurchaseLock, nextTicketNumber } from "@/lib/db/sequences";
import { TicketMailer, siteUrl } from "@/lib/email/ticket-mailer";
import { readLocaleCookie } from "@/i18n/cookie";
import { buildTicketManagementUrl } from "@/lib/tickets/event-loop";
import { buildGiftClaimUrl } from "./claim-url";
import {
  eventGateCookieName,
  verifyEventGateCookieValue
} from "@/lib/event-gate";

export const runtime = "nodejs";

const PASSKEY_REQUIRED_PURCHASE_SLUGS = new Set(["day-n-night"]);

const GiftSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional()
});

const BodySchema = z.object({
  event_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  password: z.string().min(1).optional(),
  /**
   * Display name to stamp on the `ticket-orders` row. Snapshotted from
   * the 4-step purchase flow's name step. Surfaced to the host (admin)
   * and on `/day-n-night/my`. Optional — older callers (non-day-n-night
   * surfaces) don't collect a separate purchaser display name and just
   * fall back to the session user's name.
   */
  purchaser_name: z.string().trim().min(1).max(120).optional(),
  /**
   * Name expected to appear as the bank-transfer sender. Snapshotted on the
   * order so the host can reconcile pending transfers without relying on
   * email or free-form follow-up.
   */
  sender_name: z.string().trim().min(1).max(120).optional(),
  /**
   * Optional per-extra-ticket recipient details. Index 0 corresponds to
   * the first gift ticket (i.e. the second ticket overall — index 0 is
   * always the purchaser's own). If shorter than (quantity - 1), the
   * remaining gift tickets are minted without a bound recipient email.
   */
  gifts: z.array(GiftSchema).max(9).optional()
});

/**
 * Resolve the purchaser's session locale from the same locale cookie
 * next-intl reads on the server (see `src/i18n/request.ts`), so the
 * password mail copy (rendered later by `sendOrderPaidPassword` against
 * `ticket-orders.locale`) matches what the user sees on the site.
 *
 * Defaults to `"ko"` (column default) when the cookie is missing or holds
 * an unknown value — day-n-night's audience is Korean-leaning, so an
 * unknown locale is more likely Korean than English. Admins can override
 * `ticket-orders.locale` from the admin UI if the snapshot is wrong.
 */
async function resolveOrderLocale(): Promise<"en" | "ko"> {
  const store = await nextCookies();
  return readLocaleCookie(store, "ko");
}

type EventDoc = {
  id: string;
  name?: string | null;
  slug?: string | null;
  gate_password?: string | null;
  capacity?: number | null;
  max_per_user?: number | null;
  ticket_price?: number | null;
  payment_instructions?: string | null;
  date?: string | null;
  location?: string | null;
  state?: string | null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const session = await getServerSession(await nextHeaders());
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  // Brute-force defense on gate password compare + general transactional throttle.
  const rl = await rateLimitOr429(req, "auth", String(session.user.id));
  if (rl) return rl;

  // Idempotent replay protection — clients pass `Idempotency-Key` (a UUID
  // they persist across retries). A double-submit replays the original
  // response instead of minting a second batch of tickets.
  const idem = beginIdempotent(
    req,
    "tickets/purchase",
    String(session.user.id)
  );
  const replay = idem.get();
  if (replay) return replay as NextResponse;

  const payload = await getPayload({ config });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const found = await payload
    .find({
      collection: "events",
      where: { slug: { equals: body.event_slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null);

  const event = found?.docs?.[0] as EventDoc | undefined;
  if (!event) {
    // Compare against a placeholder so an attacker can't distinguish
    // "event missing" from "event present, wrong password" via timing.
    safeEqual(body.password ?? "", "_no_event_password_placeholder_");
    return NextResponse.json(
      { ok: false, error: "invalid-password" },
      { status: 401 }
    );
  }
  if (event.state !== "open") {
    return NextResponse.json(
      { ok: false, error: "event-not-open" },
      { status: 409 }
    );
  }

  const eventSlug = event.slug ?? body.event_slug;
  const requiresGate =
    Boolean(event.gate_password) || eventSlug === "day-n-night";
  if (requiresGate) {
    const store = await nextCookies();
    const gateCookieValue = store.get(
      eventGateCookieName(body.event_slug)
    )?.value;
    const hasValidEventGate = verifyEventGateCookieValue(
      gateCookieValue,
      event.id
    );
    const hasValidPassword = body.password
      ? safeEqual(body.password, event.gate_password ?? "")
      : false;

    if (!hasValidEventGate && !hasValidPassword) {
      return NextResponse.json(
        { ok: false, error: "invalid-password" },
        { status: 401 }
      );
    }
  } else if (body.password) {
    safeEqual(body.password, "_ungated_event_password_placeholder_");
  }

  const userId = String(session.user.id);
  if (PASSKEY_REQUIRED_PURCHASE_SLUGS.has(eventSlug)) {
    const passkeyResult = await payload.find({
      collection: "passkeys",
      overrideAccess: true,
      pagination: false,
      limit: 1,
      depth: 0,
      where: {
        user: { equals: userId }
      }
    });

    if (!passkeyResult.docs.length) {
      return NextResponse.json(
        { ok: false, error: "passkey-required" },
        { status: 403 }
      );
    }
  }

  const cap = event.max_per_user ?? 3;

  // ── Money-resilient ticket mint ──────────────────────────────────────
  // The capacity + per-user cap + creation steps run inside a single
  // Postgres transaction. A per-event advisory lock serializes concurrent
  // purchases for the SAME event so two requests can't both pass the
  // count check and over-sell. Different events get different lock keys
  // and don't contend with each other.
  //
  // `ticket_number` comes from a real Postgres sequence (atomic; never
  // duplicates even under unbounded concurrency), so we don't need the
  // `max() + 1` pattern that used to race on the unique index.
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return NextResponse.json(
      { ok: false, error: "transaction-failed" },
      { status: 500 }
    );
  }
  // `req` stub passed through every transactional Payload op below.
  // It needs `payload` (the `enforceTicketCap` beforeValidate hook
  // reads `req.payload.findByID`) and `transactionID` (Payload's
  // Drizzle adapter routes ops through `sessions[transactionID].db`
  // when set; without it the ops run on the default pool, outside
  // the lock).
  const txReq = {
    payload,
    transactionID,
    context: {}
  } as Parameters<typeof payload.count>[0]["req"];

  type CreatedTicket = {
    id: string;
    ticket_number: number;
    claim_token: string | null;
    claim_url: string | null;
    recipient_email: string | null;
  };

  // Locale snapshot: read the next-intl cookie at request time. We persist
  // it on the order so the password mail (sent later, when admin flips
  // `paid`) speaks the purchaser's language. The order owns this column;
  // sibling tickets do not duplicate it.
  const orderLocale = await resolveOrderLocale();

  // Resolve a display name for the order. Prefer the explicit value
  // collected in the 4-step flow; fall back to the session user's name so
  // the legacy single-screen purchase still produces a labeled order.
  const orderPurchaserName =
    body.purchaser_name ?? session.user.name?.trim() ?? null;
  const orderSenderName = body.sender_name ?? orderPurchaserName;
  const unitAmount = event.ticket_price ?? 0;
  const totalAmount = unitAmount * body.quantity;

  let created: CreatedTicket[];
  let orderId: string;
  try {
    // Serialize same-event purchases. Held until commit/rollback.
    await eventPurchaseLock(payload, transactionID, event.id);

    // Capacity check (now race-free: only one purchaser per event runs
    // through here at a time).
    if (event.capacity && event.capacity > 0) {
      const total = await payload.count({
        collection: "tickets",
        overrideAccess: true,
        req: txReq,
        where: {
          and: [
            { event: { equals: event.id } },
            { status: { in: ["pending", "active", "used"] } }
          ]
        }
      });
      const remaining = event.capacity - (total.totalDocs ?? 0);
      if (remaining < body.quantity) {
        await payload.db.rollbackTransaction(transactionID);
        return NextResponse.json(
          { ok: false, error: "sold-out", remaining: Math.max(0, remaining) },
          { status: 409 }
        );
      }
    }

    // Per-user cap.
    const existingForUser = await payload.count({
      collection: "tickets",
      overrideAccess: true,
      req: txReq,
      where: {
        and: [
          { event: { equals: event.id } },
          { purchaser: { equals: userId } },
          { status: { in: ["pending", "active", "used"] } }
        ]
      }
    });
    const userRemaining = cap - (existingForUser.totalDocs ?? 0);
    if (userRemaining < body.quantity) {
      await payload.db.rollbackTransaction(transactionID);
      return NextResponse.json(
        {
          ok: false,
          error: "user-cap-reached",
          cap,
          remaining: Math.max(0, userRemaining)
        },
        { status: 409 }
      );
    }

    // Parent order row: created inside the transaction (and the per-event
    // lock) so a failed mint below rolls the order back too. Sibling
    // tickets are FK'd to this id via `order` — the lifecycle docstring
    // in `TicketOrders/index.ts` defines the relationship.
    const orderDoc = await payload.create({
      collection: "ticket-orders",
      overrideAccess: true,
      req: txReq,
      data: {
        purchaser: userId,
        event: event.id,
        purchaser_name: orderPurchaserName,
        sender_name: orderSenderName,
        quantity: body.quantity,
        unit_amount: unitAmount,
        total_amount: totalAmount,
        currency: "KRW",
        locale: orderLocale,
        paid: false
      } as never
    });
    orderId = String(orderDoc.id);

    created = [];
    for (let i = 0; i < body.quantity; i++) {
      const isPurchaserOwn = i === 0;
      const claimToken = isPurchaserOwn ? null : nanoid(24);
      const checkInCode = nanoid(16);
      const ticketNumber = await nextTicketNumber(payload);
      const giftIndex = isPurchaserOwn ? -1 : i - 1;
      const giftDetail = giftIndex >= 0 ? body.gifts?.[giftIndex] : undefined;
      const claimEmail = giftDetail?.email ?? null;

      const doc = await payload.create({
        collection: "tickets",
        overrideAccess: true,
        req: txReq,
        data: {
          ticket_number: ticketNumber,
          event: event.id,
          order: orderId,
          user: isPurchaserOwn ? userId : null,
          purchaser: userId,
          status: "pending",
          paid: false,
          claim_token: claimToken,
          claim_email: claimEmail,
          check_in_code: checkInCode
        } as never
      });

      const claimUrl = claimToken
        ? buildGiftClaimUrl(siteUrl, event.slug, claimToken)
        : null;

      created.push({
        id: String(doc.id),
        ticket_number: ticketNumber,
        claim_token: claimToken,
        claim_url: claimUrl,
        recipient_email: claimEmail
      });
    }

    await payload.db.commitTransaction(transactionID);
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    payload.logger.error?.(
      `[tickets/purchase] transaction failed: ${(err as Error).message}`
    );
    return NextResponse.json(
      { ok: false, error: "purchase-failed" },
      { status: 500 }
    );
  }

  // Customer-facing emails. All best-effort: a mail failure must not roll
  // back the reservation, since the purchaser already has a record in DB.
  const mailer = new TicketMailer(payload);
  const purchaserEmail = session.user.email ?? null;
  const purchaserName = session.user.name ?? null;

  if (purchaserEmail) {
    const managementUrl = buildTicketManagementUrl(siteUrl, event.slug);
    await mailer.sendPurchaseReceipt({
      ticketId: created[0]?.id ?? "",
      ticketNumber: created[0]?.ticket_number ?? null,
      eventName: event.name ?? "Hideaway event",
      eventDate: event.date ?? null,
      eventLocation: event.location ?? null,
      ticketPrice: event.ticket_price ?? null,
      recipientEmail: purchaserEmail,
      recipientName: purchaserName,
      quantity: body.quantity,
      totalAmount,
      paymentInstructions: event.payment_instructions ?? null,
      managementUrl
    });
  }

  for (const t of created) {
    if (!t.claim_url || !t.recipient_email) continue;
    await mailer.sendGiftInvite({
      ticketId: t.id,
      ticketNumber: t.ticket_number,
      eventName: event.name ?? "Hideaway event",
      eventDate: event.date ?? null,
      eventLocation: event.location ?? null,
      ticketPrice: event.ticket_price ?? null,
      recipientEmail: t.recipient_email,
      recipientName: null,
      claimUrl: t.claim_url,
      fromName: purchaserName
    });
  }

  const response = NextResponse.json(
    {
      ok: true,
      order_id: orderId,
      purchaser_id: userId,
      purchaser_name: orderPurchaserName,
      sender_name: orderSenderName,
      tickets: created,
      total_amount: totalAmount
    },
    { status: 200 }
  );
  await idem.put(response);
  return response;
}
