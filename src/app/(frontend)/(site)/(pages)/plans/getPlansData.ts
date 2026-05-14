import { getPayload } from "payload";
import config from "@payload-config";
import type { Currency, Plan, Price } from "@/payload-types";
import { DateTime } from "luxon";

/**
 * Resolved price shape consumed by the /plans page. We render in one
 * currency at a time, so the page-data layer flattens the Price doc
 * down to { amount, currency-code, formatted display string }.
 */
export type ResolvedPrice = {
  amount: number;
  currency: string;
  display: string;
};

/**
 * Resolved plan shape — Plan metadata augmented with the matched Price
 * and seat-availability counts. Not the same as the raw Payload `Plan`
 * type; this is the data contract the pricing UI reads.
 */
export type ResolvedPlan = {
  id: string;
  name: string;
  tier: "member" | "patron";
  tier_label: string;
  validity: "yearly" | "lifetime";
  description: string;
  features: { label: string; included: boolean }[];
  discount_label: string | null;
  price: ResolvedPrice;
  payment_methods: ("bank_transfer" | "cash")[];
  seat_limit: number | null;
  seats_taken: number;
  seats_remaining: number | null;
  sold_out: boolean;
  sort: number;
};

const formatCurrency = (amount: number, code: string): string => {
  const locale = code === "KRW" ? "ko-KR" : code === "EUR" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "KRW" ? 0 : 2
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${code}`;
  }
};

/**
 * Pick the active Price for a Plan in the preferred display currency.
 * Sprint 2: relationship inverted, so we query Prices by `plan`. One
 * Plan typically has one Price today (KRW one-time); multi-currency or
 * multi-cadence will produce multiple Prices that this ranking picks
 * between.
 */
const resolvePriceForPlan = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  planId: string,
  preferred: "KRW" | "USD" | "EUR" = "KRW"
): Promise<ResolvedPrice | null> => {
  const res = await payload
    .find({
      collection: "prices",
      where: {
        and: [
          { plan: { equals: planId } },
          { active: { equals: true } }
        ]
      },
      depth: 1,
      limit: 50,
      overrideAccess: true
    })
    .catch((e) => {
      payload.logger.error(
        `Error fetching prices for plan ${planId} at ${DateTime.now().toISO()}: ${(e as Error).message}`
      );
      return null;
    });
  if (!res || res.docs.length === 0) return null;

  const ranked = [...res.docs].sort((a: Price, b: Price) => {
    const ac = (a.currency as Currency)?.name ?? "";
    const bc = (b.currency as Currency)?.name ?? "";
    if (ac === preferred && bc !== preferred) return -1;
    if (bc === preferred && ac !== preferred) return 1;
    return 0;
  });
  const first = ranked[0];
  const code = (first.currency as Currency)?.name ?? "KRW";
  return {
    amount: first.unit_amount,
    currency: code,
    display: formatCurrency(first.unit_amount, code)
  };
};

export async function getPlansData(): Promise<ResolvedPlan[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "plans",
    where: { state: { equals: "active" } },
    depth: 1,
    limit: 100,
    overrideAccess: true
  });

  const resolved: ResolvedPlan[] = [];
  for (const plan of res.docs as Plan[]) {
    const price = await resolvePriceForPlan(payload, plan.id);
    if (!price) continue;
    const seat_limit =
      typeof plan.seat_limit === "number" && plan.seat_limit > 0
        ? plan.seat_limit
        : null;

    // Count active+pending subscriptions on this plan. Pending count
    // toward the cap so cart-abandoned holds don't open a phantom seat.
    const seatsCount = seat_limit
      ? await payload
          .count({
            collection: "subscriptions",
            overrideAccess: true,
            where: {
              and: [
                { plan: { equals: plan.id } },
                { subscription_status: { in: ["active", "pending"] } }
              ]
            }
          })
          .then((r) => r.totalDocs)
          .catch((e) => {
            payload.logger.error(
              `Error counting active subscriptions for plan ${plan.id} at ${DateTime.now().toISO()}: ${(e as Error).message}`
            );
            return 0;
          })
      : 0;

    const seats_taken = seatsCount ?? 0;
    const seats_remaining = seat_limit
      ? Math.max(0, seat_limit - seats_taken)
      : null;
    const sold_out = seat_limit !== null && seats_taken >= seat_limit;

    resolved.push({
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      tier_label: plan.tier_label,
      validity: plan.validity,
      description: plan.description ?? "",
      features: (plan.features ?? []).map((f) => ({
        label: f.label,
        included: f.included ?? true
      })),
      discount_label: plan.discount_label ?? null,
      price,
      payment_methods: plan.payment_methods ?? [],
      seat_limit,
      seats_taken,
      seats_remaining,
      sold_out,
      sort: plan.sort ?? 0
    });
  }

  return resolved.sort((a, b) => a.sort - b.sort);
}
