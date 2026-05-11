/**
 * Seed Butler's Posts library — varied states for /me/posts QA.
 *
 * Creates ~12 posts owned by Butler with intentional diversity so the
 * authoring index renders interesting content:
 *   - mix of `published` and `draft` (versions enabled on Posts)
 *   - mix of with-cover and no-cover
 *   - varied tag counts (0, 1, 2-3 tags)
 *   - varied subtitle / title lengths (test ellipsis + balance)
 *   - bilingual: a couple of KO titles alongside EN
 *   - `updatedAt` spread across last ~30 days for sort/date-filter QA
 *
 * Usage:
 *   pnpm seed:butler-posts
 *
 * Idempotency: dedups by `title` within Butler's authorship. The `slug`
 * field on Posts is auto-rewritten by `slugField()`'s beforeChange hook
 * (`encodeURIComponent(slugKey + "-" + hashId)`), so any value the seed
 * passes for `slug` is silently overwritten — see Payload's slugField
 * helper at `src/payload/fields/slug/index.ts`. We therefore key on
 * `title` (which is stable and we control). BLUEPRINTS must keep titles
 * unique; main() asserts this on startup.
 *
 * Dev only — refuses to run when NODE_ENV === 'production'. Seed scripts
 * are not part of the production deploy.
 *
 * Known caveat — atomicity: each blueprint does `create` followed by an
 * `update` to nudge `updatedAt`. If the create succeeds but the update
 * fails, the post is left with `updatedAt = now` rather than the intended
 * historical timestamp. The next re-run sees the post (title-keyed) and
 * skips it, so the stale timestamp persists. Acceptable for a dev seed.
 * See Payload discussion #3122 for the canonical "transactional seeding"
 * pattern (pass a shared `req.transactionID` through every call) — we
 * skip it here for simplicity.
 */
import { getPayload } from "payload";
import config from "@payload-config";

import type { Category, Media, Post, Tag, User } from "@/payload-types";

interface PostBlueprint {
  /**
   * Stable internal key used for log lines. NOT the persisted slug —
   * Payload's slugField hook always rewrites `slug` to
   * `encodeURIComponent(title-slugified + "-" + hashId)` regardless of
   * what we send.
   */
  key: string;
  title: string;
  subtitle: string;
  status: "published" | "draft";
  /** ISO; if omitted, payload sets to now via populatePublishedAt for published. */
  publishedAt?: string;
  /** Days ago for `updatedAt` shift. */
  updatedDaysAgo: number;
  /** null → no cover. */
  coverIndex: number | null;
  /** Tag keys from the BUTLER_TAGS list. */
  tagSlugs: string[];
  /** Lexical body — short paragraph by default. */
  body?: string;
}

const BUTLER_USERNAME = "butler";

// Tag *titles* are unique-indexed in the Tags collection. Reuse if a tag
// with the same title already exists; otherwise create one. Slugs are
// auto-generated from title by the slug field hook, so we don't pin them.
const BUTLER_TAGS: Array<{ title: string; key: string }> = [
  { key: "hideaway-essay", title: "Essay" },
  { key: "hideaway-dispatch", title: "Dispatch" },
  { key: "hideaway-notebook", title: "Notebook" },
  { key: "hideaway-letters", title: "Letters" }
];

const BLUEPRINTS: PostBlueprint[] = [
  {
    key: "the-quiet-room",
    title: "The Quiet Room",
    subtitle: "Notes on attention, after the noise.",
    status: "published",
    updatedDaysAgo: 1,
    coverIndex: 0,
    tagSlugs: ["hideaway-essay"],
    body: "There is a kind of quiet you only notice once the room has emptied — a residue of attention that lingers a few seconds longer than the people who created it."
  },
  {
    key: "letters-from-itaewon",
    title: "Letters from Itaewon",
    subtitle: "On the slow disappearance of a familiar street.",
    status: "published",
    updatedDaysAgo: 3,
    coverIndex: 1,
    tagSlugs: ["hideaway-letters", "hideaway-dispatch"],
    body: "I keep walking the same route, half hoping the closures will reverse themselves overnight."
  },
  {
    key: "a-week-of-rain",
    title: "A Week of Rain",
    subtitle: "Field notes from a stalled monsoon.",
    status: "published",
    updatedDaysAgo: 5,
    coverIndex: 2,
    tagSlugs: ["hideaway-notebook"],
    body: "The forecast says clear skies. The sky has not been informed."
  },
  {
    key: "draft-on-membership",
    title: "Untitled draft on membership",
    subtitle: "What 'paying for entry' actually means.",
    status: "draft",
    updatedDaysAgo: 7,
    coverIndex: null,
    tagSlugs: [],
    body: "Drafting in pieces. Returns to this later."
  },
  {
    key: "hangang-after-midnight",
    title: "Hangang, After Midnight",
    subtitle: "A river is the longest unbroken sentence the city ever writes.",
    status: "published",
    updatedDaysAgo: 9,
    coverIndex: 3,
    tagSlugs: ["hideaway-essay", "hideaway-notebook"],
    body: "Night is the only time the river gets to talk back."
  },
  {
    key: "five-things-i-stole-from-the-archive",
    title:
      "Five Things I Stole From The Archive (Or: How I Learned to Stop Worrying and Reread Calvino)",
    subtitle: "On rereading, theft, and the second draft of every idea.",
    status: "draft",
    updatedDaysAgo: 11,
    coverIndex: 4,
    tagSlugs: ["hideaway-essay"],
    body: "Stealing well is the most honest form of citation."
  },
  {
    key: "ko-jip-eseo-bon-pung-gyeong",
    title: "집에서 본 풍경",
    subtitle: "오래된 창문, 새로 배운 단어들.",
    status: "published",
    updatedDaysAgo: 14,
    coverIndex: 5,
    tagSlugs: ["hideaway-letters"],
    body: "창문 바깥의 풍경이 매일 조금씩 다르다는 것을 깨닫는 데에는 시간이 걸렸다."
  },
  {
    key: "ko-byeolheun-bam-ui-jeokyo",
    title: "별 헌 밤의 적요",
    subtitle: "긴 밤, 짧은 문장.",
    status: "draft",
    updatedDaysAgo: 16,
    coverIndex: null,
    tagSlugs: ["hideaway-notebook", "hideaway-letters"],
    body: "다 적지 못한 채로 잠든 밤이 더 많다."
  },
  {
    key: "the-shortlist",
    title: "Shortlist",
    subtitle: "Books, records, and rooms I returned to this month.",
    status: "published",
    updatedDaysAgo: 19,
    coverIndex: 6,
    tagSlugs: ["hideaway-dispatch"],
    body: "A list is the smallest legitimate piece of writing."
  },
  {
    key: "draft-the-membership-letter",
    title: "Draft: the membership letter",
    subtitle: "A note to whoever joins next.",
    status: "draft",
    updatedDaysAgo: 21,
    coverIndex: null,
    tagSlugs: [],
    body: "Welcome. The work here is slower than the homepage suggests."
  },
  {
    key: "afternoon-with-no-name",
    title: "Afternoon With No Name",
    subtitle: "On the hours that refuse to be productive.",
    status: "published",
    updatedDaysAgo: 24,
    coverIndex: 0,
    tagSlugs: ["hideaway-essay"],
    body: "Some afternoons resist being remembered. They are still the afternoons that make a year."
  },
  {
    key: "an-incomplete-list",
    title: "An Incomplete List",
    subtitle: "Things I have failed to finish, listed without comment.",
    status: "draft",
    updatedDaysAgo: 28,
    coverIndex: null,
    tagSlugs: ["hideaway-notebook"],
    body: "Failure deserves an inventory."
  }
];

interface ButlerSeedDeps {
  butlerId: string;
  uncategorizedId: string;
  tagsBySlug: Map<string, string>;
  covers: CoverRef[];
}

type LexicalDoc = {
  root: {
    type: "root";
    format: "";
    indent: 0;
    version: 1;
    children: Array<{
      type: "paragraph";
      format: "" | "left" | "right" | "center" | "justify" | "start" | "end";
      indent: 0;
      version: 1;
      children: Array<{
        type: "text";
        text: string;
        version: 1;
        detail: 0;
        format: 0;
        mode: "normal";
        style: "";
      }>;
      direction: "ltr";
      textStyle: "";
      textFormat: 0;
    }>;
    direction: "ltr";
    textStyle: "";
    textFormat: 0;
  };
};

function buildLexicalBody(text: string): LexicalDoc {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      textStyle: "",
      textFormat: 0,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          textStyle: "",
          textFormat: 0,
          children: [
            {
              type: "text",
              text,
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: ""
            }
          ]
        }
      ]
    }
  };
}

async function findButler(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<User | null> {
  const found = await payload.find({
    collection: "users",
    where: { username: { equals: BUTLER_USERNAME } },
    limit: 1,
    overrideAccess: true
  });
  return (found.docs[0] as User | undefined) ?? null;
}

async function ensureUncategorizedCategory(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: User
): Promise<string> {
  const found = await payload.find({
    collection: "categories",
    where: { slug: { equals: "uncategorized" } },
    limit: 1,
    overrideAccess: true
  });
  if (found.docs[0]) return (found.docs[0] as Category).id;

  // Cast `data` because Payload's generated `Category` type lists more
  // required fields (e.g. `identity`) than this minimal seed needs;
  // existing rows in the DB don't all carry those fields, so the looser
  // shape works at runtime even where TS complains.
  const created = (await payload.create({
    collection: "categories",
    overrideAccess: true,
    user,
    data: {
      title: "Uncategorized",
      slug: "uncategorized",
      relatedCategories: [],
      popularity: 10
    } as never
  })) as Category;
  return created.id;
}

async function ensureTags(
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: User
): Promise<Map<string, string>> {
  const authorId = user.id;
  const result = new Map<string, string>();

  for (const tag of BUTLER_TAGS) {
    // The Tags collection has a polymorphic `taggedItems` join field that
    // currently generates malformed SQL on `find` in this Payload version.
    // Selecting only scalar columns + depth=0 avoids touching the join.
    // Match by title (unique-indexed) so the seed is idempotent regardless
    // of whatever slug the formatSlug hook generated previously.
    const found = await payload.find({
      collection: "tags",
      where: { title: { equals: tag.title } },
      limit: 1,
      overrideAccess: true,
      depth: 0,
      select: { id: true, slug: true, title: true } as never
    });
    const existing = found.docs[0] as Tag | undefined;
    if (existing) {
      result.set(tag.key, existing.id);
      console.log(
        `[seed:butler-posts] reuse existing tag: ${tag.title} (${existing.id})`
      );
      continue;
    }

    const created = (await payload.create({
      collection: "tags",
      overrideAccess: true,
      user,
      depth: 0,
      data: {
        title: tag.title,
        author: authorId
      } as never
    })) as Tag;
    result.set(tag.key, created.id);
    console.log(`[seed:butler-posts] created tag: ${tag.title}`);
  }

  return result;
}

/** Polymorphic upload reference for a Post's `image` field. */
type CoverRef = { relationTo: "userMedia" | "media" | "assets"; value: string };

/**
 * Returns up to N cover references. Strategy:
 *   1. Reuse existing `userMedia` docs (already cleared upload hooks at insert).
 *   2. If too few, fall back to `media` docs.
 * The Posts `image` field is polymorphic across userMedia/media/assets, so a
 * `{ relationTo, value }` reference is the right shape.
 *
 * We avoid creating new Media docs from this script because the Media
 * `beforeOperation` hook computes a hash that requires an md5 on the file
 * payload that programmatic seeds don't produce cleanly.
 */
async function ensureCovers(
  payload: Awaited<ReturnType<typeof getPayload>>,
  _user: User,
  min: number
): Promise<CoverRef[]> {
  const refs: CoverRef[] = [];

  const userMedia = await payload.find({
    collection: "userMedia",
    limit: Math.max(min, 8),
    overrideAccess: true,
    sort: "-createdAt",
    depth: 0
  });
  for (const doc of userMedia.docs) {
    if (doc.id) refs.push({ relationTo: "userMedia", value: String(doc.id) });
  }

  if (refs.length < min) {
    const media = await payload.find({
      collection: "media",
      limit: Math.max(min - refs.length, 4),
      overrideAccess: true,
      sort: "-createdAt",
      depth: 0
    });
    for (const doc of media.docs as Media[]) {
      if (doc.id) refs.push({ relationTo: "media", value: String(doc.id) });
    }
  }

  return refs;
}

async function seedPost(
  payload: Awaited<ReturnType<typeof getPayload>>,
  blueprint: PostBlueprint,
  deps: ButlerSeedDeps,
  user: User
): Promise<void> {
  // Slug field auto-appends a random hashId suffix (`my-slug-XYZw0`), so an
  // exact slug match misses re-runs. Match by `title` (no unique constraint
  // but our blueprints have distinct titles) within Butler's authorship.
  const existing = await payload.find({
    collection: "posts",
    where: {
      and: [
        { title: { equals: blueprint.title } },
        { author: { equals: deps.butlerId } }
      ]
    },
    limit: 1,
    overrideAccess: true,
    draft: true
  });
  if (existing.docs[0]) {
    console.log(
      `[seed:butler-posts] skip existing: ${blueprint.key} (${blueprint.status})`
    );
    return;
  }

  const tagIds = blueprint.tagSlugs
    .map((slug) => deps.tagsBySlug.get(slug))
    .filter((id): id is string => Boolean(id));

  const cover =
    blueprint.coverIndex !== null && deps.covers.length > 0
      ? deps.covers[blueprint.coverIndex % deps.covers.length]
      : null;

  const updatedAt = new Date(
    Date.now() - blueprint.updatedDaysAgo * 24 * 60 * 60 * 1000
  ).toISOString();

  const publishedAt =
    blueprint.publishedAt ??
    (blueprint.status === "published" ? updatedAt : undefined);

  // Note: `slug` is intentionally not passed. Payload's slugField helper
  // unconditionally rewrites `siblingData.slug` in beforeChange to
  // `encodeURIComponent(slugKey + "-" + hashId)`, where `slugKey` is
  // derived from `title`. Anything we send for `slug` is silently dropped.
  // See `src/payload/fields/slug/index.ts`.
  const data = {
    title: blueprint.title,
    subtitle: blueprint.subtitle,
    category: deps.uncategorizedId,
    author: deps.butlerId,
    content: buildLexicalBody(blueprint.body ?? blueprint.subtitle),
    tagged: tagIds.length > 0 ? tagIds : undefined,
    image: cover ?? undefined,
    publishedAt,
    _status: blueprint.status,
    approved_by_editor: blueprint.status === "published"
  } as Record<string, unknown>;

  const created = (await payload.create({
    collection: "posts",
    overrideAccess: true,
    user,
    // The Posts afterChange hook calls Next.js `revalidatePath()`, which
    // throws "static generation store missing" when invoked outside a Next
    // request context (e.g. this CLI seed). Skip revalidation for seeds.
    context: { disableRevalidate: true } as never,
    draft: blueprint.status === "draft",
    data: data as never
  })) as Post;

  // updatedAt isn't writable through the create API; nudge it directly so
  // the listing has interesting sort/date variance.
  await payload.update({
    collection: "posts",
    id: created.id,
    overrideAccess: true,
    user,
    context: { disableRevalidate: true } as never,
    draft: blueprint.status === "draft",
    data: { updatedAt } as never
  });

  console.log(
    `[seed:butler-posts] ${blueprint.status.padEnd(9)} ${blueprint.key} (${tagIds.length} tag${tagIds.length === 1 ? "" : "s"}${cover ? ", cover" : ""})`
  );
}

/** Belt-and-suspenders: assert blueprint titles are unique at startup. */
function assertUniqueTitles(): void {
  const titles = BLUEPRINTS.map((b) => b.title);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const t of titles) {
    if (seen.has(t)) dupes.add(t);
    seen.add(t);
  }
  if (dupes.size > 0) {
    console.error(
      `[seed:butler-posts] BLUEPRINTS have duplicate titles: ${[...dupes].join(", ")}. Title is the dedup key — duplicates corrupt idempotency. Fix BLUEPRINTS and re-run.`
    );
    process.exit(1);
  }
}

/** Drain the Drizzle pool so node exits cleanly instead of being killed mid-flight. */
async function shutdownDb(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<void> {
  // `payload.db.destroy` exists on the `@payloadcms/db-postgres` adapter and
  // calls `pool.end()` under the hood. Wrap in try/catch — a failed drain
  // shouldn't change the seed's success/failure status.
  try {
    const db = payload.db as { destroy?: () => Promise<void> };
    if (typeof db.destroy === "function") {
      await db.destroy();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[seed:butler-posts] db shutdown warning: ${message}`);
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[seed:butler-posts] Refusing to run with NODE_ENV=production. Seed scripts are dev-only."
    );
    process.exit(1);
  }

  assertUniqueTitles();

  const payload = await getPayload({ config });

  console.log("[seed:butler-posts] starting…");

  try {
    const butler = await findButler(payload);
    if (!butler) {
      console.error(
        "[seed:butler-posts] Butler user not found. Run the dev server once with DEV_BUTLER_PASSWORD set, or seed Butler manually first."
      );
      await shutdownDb(payload);
      process.exit(1);
    }

    const uncategorizedId = await ensureUncategorizedCategory(payload, butler);
    const tagsBySlug = await ensureTags(payload, butler);
    const covers = await ensureCovers(payload, butler, 5);

    if (covers.length === 0) {
      console.warn(
        "[seed:butler-posts] no media available — all posts will seed without covers."
      );
    } else {
      console.log(
        `[seed:butler-posts] ${covers.length} cover candidate${covers.length === 1 ? "" : "s"} available.`
      );
    }

    const deps: ButlerSeedDeps = {
      butlerId: butler.id,
      uncategorizedId,
      tagsBySlug,
      covers
    };

    for (const blueprint of BLUEPRINTS) {
      try {
        await seedPost(payload, blueprint, deps, butler);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[seed:butler-posts] FAILED ${blueprint.key}: ${message}`
        );
      }
    }

    console.log("[seed:butler-posts] done.");
  } finally {
    await shutdownDb(payload);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[seed:butler-posts] fatal:", err);
  process.exit(1);
});
