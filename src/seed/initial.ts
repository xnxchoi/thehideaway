/**
 * Initial Seed — Payload-native source of truth.
 *
 * ───────────────────────────────────────────────────────────────────
 *  Read this first.
 * ───────────────────────────────────────────────────────────────────
 *
 *  This file is the **human-readable source** for every row that must
 *  exist for the app to function at all: the concierge admin user, the
 *  "uncategorized" Category bucket, the default tag taxonomy, the KRW
 *  Currency, and the two launch Plans + their Prices.
 *
 *  These rows used to live inside `payload.config.ts:onInit`. That
 *  pattern deadlocks: when Payload is mid-initialization, the slug /
 *  handle field hooks call `getPayload()` to validate uniqueness, which
 *  returns the still-initializing instance, and the await never
 *  resolves. See `readmes/MIGRATIONS.md` § "Seeding mechanics" for the
 *  full diagnosis and the upstream-issue links.
 *
 *  Workflow:
 *
 *    1. Edit this file in plain Payload idiom (`payload.create`,
 *       `payload.find`, etc.). Every helper is idempotent — safe to
 *       re-run against a partially-seeded DB.
 *    2. Run `pnpm seed:rebuild`. The generator
 *       (`src/scripts/seedToMigration.ts`) runs this seed against a
 *       fresh DB while capturing every SQL statement Drizzle issues,
 *       wraps each in `ON CONFLICT DO NOTHING`, and writes the result
 *       to `src/lib/migrations/99999999_000000_initial_seed.ts`.
 *    3. The generated migration runs as part of `pnpm migrate` /
 *       `pnpm migrate:fresh`. The Payload code in this file does *not*
 *       run at server boot — only at generator time.
 *
 *  Why two artifacts: the Payload-native version stays editable and
 *  human-legible; the generated SQL is the canonical execution path
 *  (fast, deadlock-free, idempotent, runnable from any context including
 *  prod boot). Editing the SQL migration directly is wrong — regenerate
 *  it from here.
 *
 *  Natural keys (used by the generator for the `ON CONFLICT` clause)
 *  are declared in `src/scripts/seedToMigration.ts`'s `NATURAL_KEYS`
 *  map. Keep that map in sync if you add a new seeded collection here.
 */

import type { Payload } from "payload";
import { nanoid } from "nanoid";
import { uuidv7 } from "uuidv7";

import type {
  Plan,
  Price,
  Category,
  Tag,
  Currency,
  User
} from "@/payload-types";

/* ── Defaults ──────────────────────────────────────────────────── */

const CONCIERGE = {
  name: "The Concierge",
  role: "admin" as const,
  slug: "concierge",
  email: "sean.sungyoon.choi@gmail.com",
  username: "concierge",
  firstName: "The",
  lastName: "Concierge",
  emailVerified: true,
  verified: true,
  onboarded: true,
  banned: false,
  twoFactorEnabled: false
};

const UNCATEGORIZED_CATEGORY = {
  title: "Uncategorized",
  slug: "uncategorized",
  description: "Default bucket for all reflections without a category.",
  popularity: 0,
  relatedCategories: [] as never[]
};

const DEFAULT_TAGS: ReadonlyArray<readonly [title: string, slug: string]> = [
  ["Life", "life"],
  ["Startup", "startup"],
  ["Blockchain", "blockchain"],
  ["Poetry", "poetry"],
  ["Life Lessons", "lifeLessons"],
  ["Politics", "politics"],
  ["Health", "health"],
  ["Love", "love"],
  ["Travel", "travel"],
  ["Technology", "technology"],
  ["Entrepreneurship", "entrepreneurship"],
  ["Self Improvement", "selfImprovement"],
  ["Education", "education"],
  ["Writing", "writing"],
  ["Business", "business"],
  ["Cryptocurrency", "cryptocurrency"],
  ["Bitcoin", "bitcoin"],
  ["Design", "design"],
  ["Social Media", "socialMedia"],
  ["Music", "music"],
  ["Relationships", "relationships"],
  ["Sports", "sports"]
];

type SeedPlan = {
  name: string;
  tier: "resident" | "patron" | "cofounder";
  tier_label: string;
  validity: "yearly" | "lifetime";
  description: string;
  features: ReadonlyArray<{ label: string; included: boolean }>;
  seat_limit?: number;
  discount_label?: string;
  sort: number;
  payment_methods: ("bank_transfer" | "cash")[];
  /** KRW amount in the currency's primary unit (won). */
  unit_amount: number;
};

const PLANS: ReadonlyArray<SeedPlan> = [
  {
    name: "Resident · Yearly · KRW",
    tier: "resident",
    tier_label: "Resident",
    validity: "yearly",
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
    payment_methods: ["bank_transfer", "cash"],
    unit_amount: 33_000
  },
  {
    name: "Patron · Lifetime · KRW",
    tier: "patron",
    tier_label: "Patron",
    validity: "lifetime",
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
    payment_methods: ["bank_transfer", "cash"],
    unit_amount: 390_000
  }
];

/* ── Idempotent helpers ─────────────────────────────────────────── */

const findFirst = async <
  Slug extends "users" | "categories" | "tags" | "currency" | "plans" | "prices"
>(
  payload: Payload,
  collection: Slug,
  whereField: string,
  value: string
): Promise<{ id: string } | null> => {
  const res = await payload.find({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: collection as any,
    where: { [whereField]: { equals: value } } as never,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    depth: 0,
    // Restrict the outer SELECT to scalar fields only. For Tags this
    // sidesteps the polymorphic-join `taggedItems` virtual-field SQL
    // generator (Payload 3.84 + Drizzle 0.45.2), which emits a
    // malformed UNION subquery — `select "id",  as "tagged"` with an
    // empty column expression — triggering "syntax error at or near
    // as". Related open upstream issues: #12913, #13089, #13777.
    select: { id: true } as never
  });
  const doc = res.docs[0] as { id: string } | undefined;
  return doc ? { id: doc.id } : null;
};

const ensureConcierge = async (payload: Payload): Promise<string> => {
  const existing = await findFirst(
    payload,
    "users",
    "username",
    CONCIERGE.username
  );
  if (existing) return existing.id;
  // Explicit uuidv7 so the captured INSERT has a literal id (not
  // `default`). Subsequent FK references in the migration thread back
  // to the same value, which is critical for migrate:fresh against a
  // truly clean DB. Requires `allowIDOnCreate: true` (toggled on when
  // SEED_CAPTURE=1 in payload.config.ts).
  const id = uuidv7();
  const created = (await payload.create({
    collection: "users",
    overrideAccess: true,
    draft: false,
    data: { id, ...CONCIERGE } as Partial<User> as never
  })) as { id: string };
  return created.id;
};

const ensureUncategorized = async (payload: Payload): Promise<string> => {
  const existing = await findFirst(
    payload,
    "categories",
    "slug",
    UNCATEGORIZED_CATEGORY.slug
  );
  if (existing) return existing.id;
  const id = uuidv7();
  const created = (await payload.create({
    collection: "categories",
    overrideAccess: true,
    draft: false,
    data: { id, ...UNCATEGORIZED_CATEGORY } as Partial<Category> as never
  })) as { id: string };
  return created.id;
};

const ensureTags = async (
  payload: Payload,
  authorId: string
): Promise<void> => {
  for (const [title, slug] of DEFAULT_TAGS) {
    const existing = await findFirst(payload, "tags", "title", title);
    if (existing) continue;
    await payload.create({
      collection: "tags",
      overrideAccess: true,
      draft: false,
      data: {
        title,
        slug,
        hashId: nanoid(11),
        slugLock: true,
        tagCount: 0,
        author: authorId
      } as Partial<Tag> as never
    });
  }
};

const ensureKrwCurrency = async (payload: Payload): Promise<string> => {
  const existing = await findFirst(payload, "currency", "name", "KRW");
  if (existing) return existing.id;
  const id = uuidv7();
  const created = (await payload.create({
    collection: "currency",
    overrideAccess: true,
    data: {
      id,
      name: "KRW",
      kr_nm: "원"
    } as Partial<Currency> as never
  })) as { id: string };
  return created.id;
};

const ensurePlanWithPrice = async (
  payload: Payload,
  plan: SeedPlan,
  krwCurrencyId: string
): Promise<void> => {
  let planId: string;
  const existing = await findFirst(payload, "plans", "name", plan.name);
  if (existing) {
    planId = existing.id;
  } else {
    const id = uuidv7();
    const created = (await payload.create({
      collection: "plans",
      overrideAccess: true,
      data: {
        id,
        name: plan.name,
        tier: plan.tier,
        tier_label: plan.tier_label,
        validity: plan.validity,
        type: "one_time",
        description: plan.description,
        // Explicit uuidv7() per array sub-row. Payload's default array-id
        // generator emits Mongo-style 24-hex ObjectIds, which the UUID-
        // typed `id` column on `plans_features` rejects with
        // "invalid input syntax for type uuid".
        features: plan.features.map((f) => ({
          id: uuidv7(),
          label: f.label,
          included: f.included
        })),
        ...(plan.seat_limit ? { seat_limit: plan.seat_limit } : {}),
        ...(plan.discount_label ? { discount_label: plan.discount_label } : {}),
        sort: plan.sort,
        state: "active",
        payment_methods: plan.payment_methods
      } as Partial<Plan> as never
    })) as { id: string };
    planId = created.id;
  }

  // Price idempotency: composite key (plan, currency).
  const existingPrice = await payload.find({
    collection: "prices",
    where: {
      and: [
        { plan: { equals: planId } },
        { currency: { equals: krwCurrencyId } }
      ]
    },
    limit: 1,
    pagination: false,
    overrideAccess: true,
    depth: 0
  });
  if (existingPrice.docs[0]) return;

  await payload.create({
    collection: "prices",
    overrideAccess: true,
    data: {
      id: uuidv7(),
      nickname: `${plan.name} · KRW`,
      plan: planId,
      currency: krwCurrencyId,
      unit_amount: plan.unit_amount,
      type: "one_time",
      active: true
    } as Partial<Price> as never
  });
};

/* ── Public entry point ─────────────────────────────────────────── */

/**
 * Run the full initial seed against a fully-initialized Payload
 * instance. Idempotent — safe to re-run on a partially-seeded DB.
 *
 * Order matters: Concierge → Category → Tags (need author=concierge)
 * → Currency → Plans + Prices (Price needs plan_id + currency_id).
 */
export async function runInitialSeed(payload: Payload): Promise<void> {
  payload.logger.info("[seed] starting initial seed");

  const conciergeId = await ensureConcierge(payload);
  payload.logger.info(`[seed] concierge ok: ${conciergeId}`);

  const uncategorizedId = await ensureUncategorized(payload);
  payload.logger.info(`[seed] uncategorized ok: ${uncategorizedId}`);

  await ensureTags(payload, conciergeId);
  payload.logger.info(`[seed] tags ok (${DEFAULT_TAGS.length} entries)`);

  const krwId = await ensureKrwCurrency(payload);
  payload.logger.info(`[seed] currency KRW ok: ${krwId}`);

  for (const plan of PLANS) {
    await ensurePlanWithPrice(payload, plan, krwId);
    payload.logger.info(`[seed] plan + price ok: ${plan.name}`);
  }

  payload.logger.info("[seed] done");
}
