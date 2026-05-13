import type { CollectionAfterChangeHook } from "payload";

import { nextInvoiceNumber } from "@/lib/db/sequences";

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

type PlanWithPrice = {
  id: string;
  price?: Array<{
    currencies?: Array<{
      amount?: number | null;
      currency?: { name?: string } | string | null;
    }> | null;
  }> | null;
};

const resolveAmountAndCurrency = async (
  payload: Parameters<CollectionAfterChangeHook>[0]["req"]["payload"],
  planId: string
): Promise<{ amount: number; currency: "krw" | "usd" | "eur" }> => {
  const plan = (await payload
    .findByID({
      collection: "plans",
      id: planId,
      depth: 2,
      overrideAccess: true
    })
    .catch(() => null)) as PlanWithPrice | null;

  const first = plan?.price?.[0]?.currencies?.[0];
  const amount =
    typeof first?.amount === "number" && first.amount > 0 ? first.amount : 0;

  const currencyName =
    typeof first?.currency === "object" && first?.currency
      ? first.currency.name?.toLowerCase()
      : typeof first?.currency === "string"
        ? first.currency.toLowerCase()
        : "krw";
  const currency: "krw" | "usd" | "eur" =
    currencyName === "usd" || currencyName === "eur" ? currencyName : "krw";

  return { amount, currency };
};

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
    if (!userId || !planId) return doc;

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

    const { amount, currency } = await resolveAmountAndCurrency(
      req.payload,
      planId
    );

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
        amount,
        currency,
        status: "paid",
        paid_at: nowIso,
        cycle_start: doc.start_date ?? nowIso,
        cycle_end: doc.expires_at ?? null,
        payment_method: [
          {
            method: requestMethod,
            amount,
            currency,
            payment_date: nowIso
          }
        ]
      }
    });

    req.payload.logger.info?.(
      `[issueInvoice] HW-${nextNumber} issued for subscription ${doc.id} (user ${userId}, ${currency.toUpperCase()} ${amount})`
    );
    return doc;
  } catch (err) {
    req.payload.logger.error?.(
      `[issueInvoice] failed for subscription ${doc?.id}: ${(err as Error).message}`
    );
    return doc;
  }
};
