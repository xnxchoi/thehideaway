import { getPayload } from "payload";
import config from "@payload-config";
import type { Currency, Plan, Price } from "@/payload-types";
import { MakeRequired, RequiredAndNonNullable } from "@/utilities/typeUtilities";
import { DateTime } from "luxon";

export type ResolvedPrice =RequiredAndNonNullable<Price['currencies'] >[0] |null

export type ResolvedPlan = MakeRequired<Plan>

const formatCurrency = (amount: number, code: string): string => {
  const locale = code === "KRW" ? "ko-KR" : code === "EUR" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency", currency: code, maximumFractionDigits: code === "KRW" ? 0 : 2
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${code}`;
  }
};

const resolvePrice = async (priceFromProps: Plan["price"][0], preferred: "KRW" | "USD" | "EUR" = "KRW"): Promise<ResolvedPrice | null> => {
  let priceDoc: Price | null = null;
  if (!!priceFromProps) {
    if (typeof priceFromProps === "object" && !!priceFromProps) {
      priceDoc = priceFromProps;
    } else if (typeof priceFromProps === "string") {

      const payload = await getPayload({ config });
      const res = await payload.findByID({
        collection: "plans", id: priceFromProps, overrideAccess: true
      }).catch((e) => {
        payload.logger.error(`Error fetching price document id ${priceFromProps} at ${DateTime.now().toISO()}`);
        return null;
      });
      priceDoc = res;
    }
  }
  if (!priceDoc || !priceDoc.currencies?.length) return null;
  const ranked = [...priceDoc.currencies].sort((a, b) => {
    const ac = (a.currency as Currency)?.name ?? "";
    const bc = (b.currency as Currency)?.name ?? "";
    if (ac === preferred) return -1;
    if (bc === preferred) return 1;
    return 0;
  });
  const first = ranked[0];
  if (!first) return null;
  const code = (first.currency as Currency)?.name ?? "KRW";
  return {
    amount: first.amount, currency: code, display: formatCurrency(first.amount, code)
  };
};

export async function getPlansData(): Promise<ResolvedPlan[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "plans", where: { state: { equals: "active" } }, depth: 2, limit: 100, overrideAccess: true
  });

  const resolved: ResolvedPlan[] = [];
  for (const p of res.docs) {
    const plan = p ;
    const firstPrice = plan.price[0];
    const price = await resolvePrice(firstPrice);
    if (!price) continue;
    const seat_limit = typeof plan.seat_limit === "number" && plan.seat_limit > 0 ? plan.seat_limit : null;

    // Count active subscriptions on this plan (active = paid/role-granting).
    const seatsCount = seat_limit ? await payload.count({
      collection: "subscriptions", overrideAccess: true, where: {
        and: [{ plan: { equals: plan.id } }, {
          subscription_status: {
            in: ["active", "pending"]
          }
        }]
      }
    }).then(r => r.totalDocs).catch((e) => {
      payload.logger.error(`Error counting active subscriptions for plan ${plan.id} at ${DateTime.now().toISO()}`);
      return 0;
    }) : 0;

    const seats_taken = seatsCount ?? 0;
    const seats_remaining = seat_limit ? Math.max(0, seat_limit - seats_taken) : null;
    const sold_out = seat_limit !== null && seats_taken >= seat_limit;

    resolved.push({
      id: plan.id,
      name: plan.name,
      tier: plan.tier as "member" | "patron",
      tier_label: plan.tier_label,
      validity: plan.validity as "yearly" | "lifetime",
      description: plan.description ?? "",
      features: (plan.features ?? []).map((f) => ({
        label: f.label, included: f.included ?? true
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
