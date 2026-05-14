import type { CollectionAfterChangeHook } from "payload";
import type { Price } from "@/payload-types";

import { nextInvoiceNumber } from "@/lib/db/sequences";

/**
 * Issue an Invoice when a Subscription flips to paid + active.
 *
 * Sprint 2: now reads `subscription.price` directly (the immutable
 * snapshot of which Price the customer transacted) instead of digging
 * through the old `plan.price[0].currencies[0]` shape. Invoice currency
 * is written as the Currency relationship id; `fx_rate_used` stays null
 * at launch because everything is KRW-domestic. The forward-looking
 * `price` ref on the Invoice points back at the Price for traceability.
 */

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

const resolvePrice = async (
  payload: Parameters<CollectionAfterChangeHook>[0]["req"]["payload"],
  priceId: string
): Promise<Price | null> =>
  (await payload
    .findByID({
      collection: "prices",
      id: priceId,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as Price | null;

export const issueInvoiceOnPaid: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req
}) => {
  try {
    const becamePaid = doc.paid === true && previousDoc?.paid !== true;
    const becameActive =
      doc.subscription_status === "active" &&
      previousDoc?.subscription_status !== "active";
    const justActivated = doc.paid === true && (becamePaid || becameActive);
    if (!justActivated) return doc;
    if (doc.subscription_status !== "active") return doc;

    const userId = idOf(doc.user);
    const planId = idOf(doc.plan);
    const priceId = idOf(doc.price);
    if (!userId || !planId || !priceId) return doc;

    const existing = await req.payload.find({
      collection: "invoices",
      where: {
        and: [
          { subscription: { equals: doc.id } },
          { status: { not_equals: "void" } }
        ]
      },
      limit: 1,
      overrideAccess: true,
      depth: 0
    });
    if (existing.totalDocs > 0) return doc;

    const price = await resolvePrice(req.payload, priceId);
    if (!price) {
      req.payload.logger.error?.(
        `[issueInvoice] subscription ${doc.id} references missing price ${priceId}`
      );
      return doc;
    }
    const amount = price.unit_amount;
    const currencyId = idOf(price.currency);
    if (!currencyId) {
      req.payload.logger.error?.(
        `[issueInvoice] price ${priceId} has no currency id`
      );
      return doc;
    }

    // Race-free invoice number — sequence is atomic. Replaces the prior
    // `max() + 1` pattern that silently failed on the unique index when
    // two activations landed near-simultaneously.
    const nextNumber = await nextInvoiceNumber(req.payload);

    const nowIso = new Date().toISOString();
    const requestMethod =
      doc.request_method === "cash" ? "cash" : "bank_transfer";

    await req.payload.create({
      collection: "invoices",
      overrideAccess: true,
      data: {
        invoice_number: nextNumber,
        client: userId,
        subscription: String(doc.id),
        plan: planId,
        price: priceId,
        amount,
        currency: currencyId,
        // fx_rate_used null at launch — invoice currency equals Plan's
        // base currency. Populate this once non-base invoices are issued.
        fx_rate_used: null,
        status: "paid",
        paid_at: nowIso,
        cycle_start: doc.start_date ?? nowIso,
        cycle_end: doc.expires_at ?? null,
        payment_method: [
          {
            method: requestMethod,
            amount,
            currency: currencyId,
            payment_date: nowIso
          }
        ]
      }
    });

    req.payload.logger.info?.(
      `[issueInvoice] HW-${nextNumber} issued for subscription ${doc.id} (user ${userId}, amount ${amount}, currency ${currencyId})`
    );
    return doc;
  } catch (err) {
    req.payload.logger.error?.(
      `[issueInvoice] failed for subscription ${doc?.id}: ${(err as Error).message}`
    );
    return doc;
  }
};
