/**
 * Seed Plans + Prices + Currency.
 *
 * - Member · Yearly · KRW: ₩33,000 / year, limited 50
 * - Patron · Lifetime · KRW: ₩390,000 lifetime, limited 5
 *
 * Usage: pnpm tsx --env-file=.env --env-file=.env.local src/scripts/seedMembership.ts
 *
 * Idempotent: matches Plans by `name`, Currency by `name`, Prices by
 * (plan, currency). Sprint 2 rebuild — the Product/Price split now
 * inverts the relationship, so each Plan is created first and the
 * Price is created with `plan: <plan id>`.
 */
import { getPayload } from "payload";
import { uuidv7 } from "uuidv7";
import config from "@payload-config";

type SeedPrice = { currencyName: "KRW"; amount: number };

type SeedPlan = {
  name: string;
  tier: "resident" | "patron" | "cofounder";
  tier_label: string;
  validity: "yearly" | "lifetime";
  prices: SeedPrice[];
  description: string;
  features: { label: string; included: boolean }[];
  seat_limit?: number;
  discount_label?: string;
  sort: number;
  payment_methods: ("bank_transfer" | "cash")[];
};

const PLANS: SeedPlan[] = [
  {
    name: "Resident · Yearly · KRW",
    tier: "resident",
    tier_label: "Resident",
    validity: "yearly",
    prices: [{ currencyName: "KRW", amount: 33_000 }],
    description:
      "Pay once. Read everything Resident-locked for a year. Stay in for free if your work earns it.",
    features: [
      { label: "Read all Resident-locked essays", included: true },
      { label: "Highlight + memo", included: true },
      { label: "Comment + bookmark", included: true },
      { label: "Renews free if your work earns it", included: true },
      { label: "Patron-only drops & events", included: false }
    ],
    seat_limit: 50,
    discount_label: "LIMITED 50",
    sort: 10,
    payment_methods: ["bank_transfer", "cash"]
  },
  {
    name: "Patron · Lifetime · KRW",
    tier: "patron",
    tier_label: "Patron",
    validity: "lifetime",
    prices: [{ currencyName: "KRW", amount: 390_000 }],
    description:
      "Pay once. The door stays open. Founders get drop priority and quarterly print, no expiry.",
    features: [
      { label: "Everything in Resident, forever", included: true },
      { label: "Read all Patron-locked essays", included: true },
      { label: "Priority access to drops", included: true },
      { label: "Exclusive event invites", included: true },
      { label: "Patron-only quarterly print", included: true }
    ],
    seat_limit: 5,
    discount_label: "LIMITED 5 · LIFETIME",
    sort: 20,
    payment_methods: ["bank_transfer", "cash"]
  }
];

async function ensureCurrency(
  payload: Awaited<ReturnType<typeof getPayload>>,
  name: "KRW"
): Promise<string> {
  const existing = await payload.find({
    collection: "currency",
    where: { name: { equals: name } },
    limit: 1,
    overrideAccess: true
  });
  if (existing.docs[0]) return existing.docs[0].id;
  const krNm = name === "KRW" ? "원" : name;
  const created = await payload.create({
    collection: "currency",
    data: { name, kr_nm: krNm } as unknown as Record<string, unknown> as never,
    overrideAccess: true
  });
  return created.id;
}

async function ensurePrice(
  payload: Awaited<ReturnType<typeof getPayload>>,
  args: {
    planId: string;
    planName: string;
    currencyId: string;
    currencyName: string;
    amount: number;
  }
): Promise<string> {
  const existing = await payload.find({
    collection: "prices",
    where: {
      and: [
        { plan: { equals: args.planId } },
        { currency: { equals: args.currencyId } }
      ]
    },
    limit: 1,
    overrideAccess: true
  });
  if (existing.docs[0]) return existing.docs[0].id;
  const created = await payload.create({
    collection: "prices",
    overrideAccess: true,
    data: {
      nickname: `${args.planName} · ${args.currencyName}`,
      plan: args.planId,
      currency: args.currencyId,
      unit_amount: args.amount,
      type: "one_time",
      active: true
    }
  });
  return created.id;
}

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  for (const plan of PLANS) {
    const existing = await payload.find({
      collection: "plans",
      where: { name: { equals: plan.name } },
      limit: 1,
      overrideAccess: true
    });

    let planId: string;
    if (existing.docs[0]) {
      planId = existing.docs[0].id;
      console.log(`[seed] reuse existing plan: ${plan.name}`);
    } else {
      const created = await payload.create({
        collection: "plans",
        overrideAccess: true,
        data: {
          name: plan.name,
          tier: plan.tier,
          tier_label: plan.tier_label,
          validity: plan.validity,
          type: "one_time",
          description: plan.description,
          features: plan.features.map((f) => ({ id: uuidv7(), ...f })),
          ...(plan.seat_limit ? { seat_limit: plan.seat_limit } : {}),
          ...(plan.discount_label
            ? { discount_label: plan.discount_label }
            : {}),
          sort: plan.sort,
          state: "active",
          payment_methods: plan.payment_methods
        }
      });
      planId = created.id;
      console.log(`[seed] created plan: ${plan.name}`);
    }

    for (const p of plan.prices) {
      const currencyId = await ensureCurrency(payload, p.currencyName);
      await ensurePrice(payload, {
        planId,
        planName: plan.name,
        currencyId,
        currencyName: p.currencyName,
        amount: p.amount
      });
    }
  }

  console.log("[seed] done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
