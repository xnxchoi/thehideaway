import { getPayload } from "payload";
import config from "@payload-config";
import type { Plan, Price, Currency } from "@/payload-types";

export type ResolvedPrice = {
  amount: number;
  currency: string;
  display: string;
};

export type ResolvedPlan = {
  id: string;
  name: string;
  tier: "member" | "patron";
  tier_label: string;
  validity: "yearly" | "lifetime";
  description: string;
  features: { label: string; included: boolean }[];
  featured: boolean;
  discount_label: string | null;
  presentation: "standard" | "founder";
  price: ResolvedPrice;
  payment_methods: string[];
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

const resolvePrice = (
  priceDoc: Price | null | undefined,
  preferred: "KRW" | "USD" | "EUR" = "KRW"
): ResolvedPrice | null => {
  if (!priceDoc?.currencies?.length) return null;
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
    amount: first.amount,
    currency: code,
    display: formatCurrency(first.amount, code)
  };
};

export async function getPlansData(): Promise<ResolvedPlan[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "plans",
    where: { state: { equals: "active" } },
    depth: 2,
    limit: 100,
    overrideAccess: true
  });

  const resolved: ResolvedPlan[] = [];
  for (const p of res.docs) {
    const plan = p as Plan;
    const firstPrice = (plan.price?.[0] as Price) ?? null;
    const price = resolvePrice(firstPrice);
    if (!price) continue;

    const seat_limit =
      typeof plan.seat_limit === "number" && plan.seat_limit > 0
        ? plan.seat_limit
        : null;

    // Count active subscriptions on this plan (active = paid/role-granting).
    const seatsCount = seat_limit
      ? await payload.count({
          collection: "subscriptions",
          overrideAccess: true,
          where: {
            and: [
              { plan: { equals: plan.id } },
              {
                subscription_status: {
                  in: ["active", "pending"]
                }
              }
            ]
          }
        })
      : { totalDocs: 0 };

    const seats_taken = seatsCount.totalDocs ?? 0;
    const seats_remaining = seat_limit
      ? Math.max(0, seat_limit - seats_taken)
      : null;
    const sold_out = seat_limit !== null && seats_taken >= seat_limit;

    resolved.push({
      id: plan.id,
      name: plan.name,
      tier: plan.tier as "member" | "patron",
      tier_label: plan.tier_label,
      validity: plan.validity as "yearly" | "lifetime",
      description: plan.description ?? "",
      features: (plan.features ?? []).map((f) => ({
        label: f.label,
        included: f.included ?? true
      })),
      featured: plan.featured ?? false,
      discount_label: plan.discount_label ?? null,
      presentation: (plan.presentation as "standard" | "founder") ?? "standard",
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
