/**
 * Initial Seed — Payload-native source of truth.
 *
 * ───────────────────────────────────────────────────────────────────
 *  Read this first.
 * ───────────────────────────────────────────────────────────────────
 *
 *  This file is the **human-readable source** for every row that must
 *  exist for the app to function at all: the concierge admin user, the
 *  "uncategorized" Category bucket, and the default tag taxonomy.
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

import { CollectionSlug, Payload } from "payload";
import { nanoid } from "nanoid";
import { uuidv7 } from "uuidv7";

import type { Category, User } from "@/payload-types";

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

/* ── Idempotent helpers ─────────────────────────────────────────── */

const findFirst = async <T extends CollectionSlug>(
  payload: Payload,
  collection: T,
  whereField: string,
  value: string
): Promise<{
  id: string;
} | null> => {
  const res = await payload.find({
    collection: collection,
    where: { [whereField]: { equals: value } } as never,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    depth: 0, // Restrict the outer SELECT to scalar fields only. For Tags this
    // sidesteps the polymorphic-join `taggedItems` virtual-field SQL
    // generator (Payload 3.84 + Drizzle 0.45.2), which emits a
    // malformed UNION subquery — `select "id",  as "tagged"` with an
    // empty column expression — triggering "syntax error at or near
    // as". Related open upstream issues: #12913, #13089, #13777.
    select: { id: true } as never
  });
  const doc = res.docs[0] as { id: string } | undefined;
  return doc ?? null;
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
      } as never
    });
  }
};

/* ── Public entry point ─────────────────────────────────────────── */

/**
 * Run the full initial seed against a fully-initialized Payload
 * instance. Idempotent — safe to re-run on a partially-seeded DB.
 *
 * Order matters: Concierge → Category → Tags (need author=concierge).
 */
export async function runInitialSeed(payload: Payload): Promise<void> {
  payload.logger.info("[seed] starting initial seed");

  const conciergeId = await ensureConcierge(payload);
  payload.logger.info(`[seed] concierge ok: ${conciergeId}`);

  const uncategorizedId = await ensureUncategorized(payload);
  payload.logger.info(`[seed] uncategorized ok: ${uncategorizedId}`);

  await ensureTags(payload, conciergeId);
  payload.logger.info(`[seed] tags ok (${DEFAULT_TAGS.length} entries)`);

  payload.logger.info("[seed] done");
}
