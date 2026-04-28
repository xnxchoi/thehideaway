/**
 * Seed Plans + Prices + Currency.
 *
 * - Member · Yearly · KRW: ₩33,000 / year, limited 50, standard card
 * - Patron · Lifetime · KRW: ₩390,000 lifetime, limited 5, founder card (Starliner)
 *
 * Usage:  pnpm tsx --env-file=.env --env-file=.env.local src/scripts/seedMembership.ts
 * Idempotent: matches by `name` (Plans), `name` (Currency); skips if exists.
 */
import { getPayload } from "payload";
import { uuidv7 } from "uuidv7";
import config from "@payload-config";

type SeedPrice = { currencyName: "KRW"; amount: number };

type SeedPlan = {
  name: string;
  tier: "member" | "patron";
  tier_label: string;
  validity: "yearly" | "lifetime";
  prices: SeedPrice[];
  description: string;
  features: { label: string; included: boolean }[];
  featured?: boolean;
  seat_limit?: number;
  discount_label?: string;
  presentation: "standard" | "founder";
  sort: number;
  payment_methods: ("bank_transfer" | "cash")[];
};

const PLANS: SeedPlan[] = [
  {
    name: "Member · Yearly · KRW",
    tier: "member",
    tier_label: "Member",
    validity: "yearly",
    prices: [{ currencyName: "KRW", amount: 33_000 }],
    description:
      "Pay once. Read everything Member-locked for a year. Stay in for free if your work earns it.",
    features: [
      { label: "Read all Member-locked essays", included: true },
      { label: "Highlight + memo", included: true },
      { label: "Comment + bookmark", included: true },
      { label: "Renews free if your work earns it", included: true },
      { label: "Patron-only drops & events", included: false }
    ],
    seat_limit: 50,
    discount_label: "LIMITED 50",
    presentation: "standard",
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
      { label: "Everything in Member, forever", included: true },
      { label: "Read all Patron-locked essays", included: true },
      { label: "Priority access to drops", included: true },
      { label: "Exclusive event invites", included: true },
      { label: "Patron-only quarterly print", included: true }
    ],
    featured: true,
    seat_limit: 5,
    discount_label: "LIMITED 5 · LIFETIME",
    presentation: "founder",
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

async function createPrice(
  payload: Awaited<ReturnType<typeof getPayload>>,
  prices: SeedPrice[]
): Promise<string> {
  const currencies = await Promise.all(
    prices.map(async (p) => ({
      id: uuidv7(),
      amount: p.amount,
      currency: await ensureCurrency(payload, p.currencyName)
    }))
  );
  const created = await payload.create({
    collection: "prices",
    data: { currencies },
    overrideAccess: true
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
    if (existing.docs[0]) {
      console.log(`[seed] skip existing plan: ${plan.name}`);
      continue;
    }

    const priceId = await createPrice(payload, plan.prices);

    await payload.create({
      collection: "plans",
      overrideAccess: true,
      data: {
        name: plan.name,
        tier: plan.tier,
        tier_label: plan.tier_label,
        validity: plan.validity,
        type: "one_time",
        price: [priceId],
        description: plan.description,
        features: plan.features.map((f) => ({ id: uuidv7(), ...f })),
        featured: plan.featured ?? false,
        ...(plan.seat_limit ? { seat_limit: plan.seat_limit } : {}),
        ...(plan.discount_label ? { discount_label: plan.discount_label } : {}),
        presentation: plan.presentation,
        sort: plan.sort,
        state: "active",
        payment_methods: plan.payment_methods
      }
    });
    console.log(`[seed] created plan: ${plan.name}`);
  }

  console.log("[seed] done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
