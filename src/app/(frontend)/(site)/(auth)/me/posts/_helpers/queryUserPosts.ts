import "server-only";

import { currentUser } from "@/lib/auth/context/get-context-props";
import { getPayload } from "@/lib/payload";
import { toRelativeIfSameOrigin } from "@/utilities/getURL";
import type { Media, Tag, UserMedia } from "@payload-types";
import type { Where } from "payload";

export type UserPostStatus = "published" | "draft";

export type UserPostRow = {
  id: string;
  slug: string | null;
  title: string;
  subtitle?: string | null;
  status: UserPostStatus;
  updatedAt: string;
  publishedAt?: string | null;
  cover: { url: string; alt: string } | null;
  tags: { id: string; title: string }[];
};

export type UserPostsBundle = {
  rows: UserPostRow[];
  totalDocs: number;
  pageCount: number;
  /** Tag options derived from user's posts — used for the tag filter facet. */
  tagOptions: { id: string; title: string }[];
  /** Status counts across the user's whole library, ignoring filters. */
  counts: { all: number; published: number; draft: number };
};

export type UserPostsQueryArgs = {
  page?: number;
  perPage?: number;
  /** Tanstack-style sort: `[{ id: 'updatedAt', desc: true }]` */
  sort?: { id: string; desc: boolean }[];
  filters?: {
    /** Free-text search across title + subtitle. */
    q?: string;
    /** Filter by status; empty/omitted = both. */
    status?: UserPostStatus[];
    /** Filter to posts that include any of these tag ids. */
    tagIds?: string[];
    /** Posts updated on/after this ISO string. */
    updatedFrom?: string;
    /** Posts updated on/before this ISO string. */
    updatedTo?: string;
  };
};

const DEFAULT_PER_PAGE = 25;

/**
 * Whitelist of sort fields accepted from the URL.
 *
 * SECURITY: the `id` field on each sort entry traces back to a URL search
 * param, so we treat it as untrusted input. Payload's ORM ignores unknown
 * sort fields rather than throwing, so a crafted `?sort=password.asc`
 * silently no-ops today — but the principle is "never let untrusted input
 * name a column." This whitelist is the gate.
 *
 * To allow a new sort key: add it here AND confirm the column exists on
 * Posts (Payload will silently drop unknowns, masking typos).
 */
const ALLOWED_SORT_FIELDS = new Set<string>([
  "updatedAt",
  "publishedAt",
  "createdAt",
  "title",
  "_status"
]);

/** Map TanStack sort id → Payload sort string (e.g. `-updatedAt`). */
const sortToPayload = (sort: UserPostsQueryArgs["sort"]): string => {
  if (!sort || sort.length === 0) return "-updatedAt";
  const safe = sort
    .filter(({ id }) => ALLOWED_SORT_FIELDS.has(id))
    .map(({ id, desc }) => `${desc ? "-" : ""}${id}`);
  return safe.length > 0 ? safe.join(",") : "-updatedAt";
};

/**
 * Narrow the polymorphic `Post.image` value down to a renderer-friendly
 * `{ url, alt }` shape. The field is a polymorphic upload over
 * `userMedia | assets | media` — at `depth: 1` Payload populates `value`
 * with the full doc, but `assets` has no `url` field (system files), so
 * we explicitly route only userMedia/media to a cover slot and let
 * assets fall through to `null` (which the UI shows as a letter-initial
 * placeholder).
 */
const pickMediaShape = (
  field: unknown
): { url: string; alt: string } | null => {
  if (!field || typeof field !== "object") return null;
  const wrapper = field as { relationTo?: unknown; value?: unknown };
  if (wrapper.relationTo === "assets") return null;
  const candidate = wrapper.value ?? field;
  if (!candidate || typeof candidate !== "object") return null;
  const m = candidate as Partial<Media | UserMedia>;
  if (!m.url) return null;
  return {
    url: toRelativeIfSameOrigin(m.url),
    alt: m.alt ?? ""
  };
};

const pickTags = (field: unknown): UserPostRow["tags"] => {
  if (!Array.isArray(field)) return [];
  return field
    .map((entry): UserPostRow["tags"][number] | null => {
      if (typeof entry === "string") return null;
      const t = entry as Partial<Tag>;
      if (!t.id || !t.title) return null;
      return { id: String(t.id), title: t.title };
    })
    .filter((t): t is UserPostRow["tags"][number] => t !== null);
};

/**
 * Resolve a list of post IDs that match a free-text query, scoped to one
 * author. Hybrid: Payload's Search plugin handles published posts (it
 * gives scoring + matches across `meta.title`, `meta.description`,
 * `category.title`, `tags.title`), while drafts come from a scoped
 * `payload.find` on `posts` — the Search plugin only syncs published
 * docs via `afterChange`, so drafts are invisible to it. For /me/posts
 * specifically we need both. The author filter + compound index
 * `(author, _status, updatedAt)` keeps the draft path index-efficient
 * even at scale.
 *
 * See `src/payload/plugins/index.ts` (searchPlugin config) and
 * `src/payload/search/beforeSync.ts` (mirror shape).
 *
 * Returns `null` when no q is provided (caller skips the post-id filter).
 * Returns `[]` when q matches nothing (caller pins to empty result).
 */
async function searchAuthorPostIds(
  payload: Awaited<ReturnType<typeof getPayload>>,
  q: string,
  authorId: string,
  cap = 500
): Promise<string[] | null> {
  const query = q.trim();
  if (query.length === 0) return null;

  // Match the field set used by the global /api/search route, minus
  // `author.name` (already constrained by author.key).
  const searchMirrorClauses: Where[] = [
    { title: { like: query } },
    { slug: { like: query } },
    { "meta.title": { like: query } },
    { "meta.description": { like: query } },
    { "category.title": { like: query } },
    { "tags.title": { like: query } }
  ];

  // Draft search hits posts directly. The mirror has no draft rows, so we
  // can't use it. Title + subtitle cover the affordances drafts actually
  // populate (drafts often lack meta/SEO fields).
  const draftClauses: Where[] = [
    { title: { like: query } },
    { subtitle: { like: query } }
  ];

  const [publishedHits, draftHits] = await Promise.all([
    payload.find({
      collection: "search",
      where: {
        and: [
          { "doc.relationTo": { equals: "posts" } },
          { "author.key": { equals: authorId } },
          { or: searchMirrorClauses }
        ]
      },
      limit: cap,
      sort: "-score",
      depth: 0,
      overrideAccess: true,
      select: { doc: true }
    }),
    payload.find({
      collection: "posts",
      where: {
        and: [
          { author: { equals: authorId } },
          { _status: { equals: "draft" } },
          { or: draftClauses }
        ]
      },
      limit: cap,
      depth: 0,
      draft: true,
      overrideAccess: true,
      select: { id: true }
    })
  ]);

  const ids = new Set<string>();

  for (const hit of publishedHits.docs) {
    const ref = (hit as { doc?: { value?: unknown } }).doc;
    const value = ref?.value;
    if (typeof value === "string") ids.add(value);
    else if (value && typeof value === "object" && "id" in value) {
      const id = (value as { id?: unknown }).id;
      if (typeof id === "string") ids.add(id);
    }
  }
  for (const hit of draftHits.docs) {
    if (typeof hit.id === "string") ids.add(hit.id);
  }

  return Array.from(ids);
}

/**
 * Derive the union of tags appearing on any of an author's posts —
 * published and draft. Hybrid:
 *   - Published: pull the denormalized `tags` array from search-mirror
 *     rows (already carries `{ key, title, slug }` per tag, populated
 *     by the search plugin's beforeSync).
 *   - Draft: pull the `tagged` relationship array from drafts via a
 *     scoped `payload.find` with `depth: 1` so each entry has `{ id,
 *     title }` ready.
 * Dedup in memory by tag id. Two Payload-native finds against indexed
 * collections — no raw SQL.
 *
 * Cap at 1000 per branch: very few authors exceed that. If we ever
 * do, the facet downgrades to a count-capped subset rather than
 * silently breaking.
 */
async function authorTagOptions(
  payload: Awaited<ReturnType<typeof getPayload>>,
  authorId: string,
  cap = 1000
): Promise<{ id: string; title: string }[]> {
  const [publishedMirror, drafts] = await Promise.all([
    payload.find({
      collection: "search",
      where: {
        and: [
          { "doc.relationTo": { equals: "posts" } },
          { "author.key": { equals: authorId } }
        ]
      },
      limit: cap,
      depth: 0,
      overrideAccess: true,
      select: { tags: true }
    }),
    payload.find({
      collection: "posts",
      where: {
        and: [
          { author: { equals: authorId } },
          { _status: { equals: "draft" } }
        ]
      },
      limit: cap,
      depth: 1,
      draft: true,
      overrideAccess: true,
      select: { tagged: true }
    })
  ]);

  const byKey = new Map<string, { id: string; title: string }>();

  for (const doc of publishedMirror.docs) {
    const tags = (doc as { tags?: unknown }).tags;
    if (!Array.isArray(tags)) continue;
    for (const t of tags) {
      if (!t || typeof t !== "object") continue;
      const key = (t as { key?: unknown }).key;
      const title = (t as { title?: unknown }).title;
      if (typeof key !== "string" || typeof title !== "string") continue;
      if (!byKey.has(key)) byKey.set(key, { id: key, title });
    }
  }

  for (const doc of drafts.docs) {
    const tagged = (doc as { tagged?: unknown }).tagged;
    if (!Array.isArray(tagged)) continue;
    for (const t of tagged) {
      if (typeof t === "string") continue;
      if (!t || typeof t !== "object") continue;
      const id = (t as { id?: unknown }).id;
      const title = (t as { title?: unknown }).title;
      if (typeof id !== "string" || typeof title !== "string") continue;
      if (!byKey.has(id)) byKey.set(id, { id, title });
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export async function queryUserPosts(
  args: UserPostsQueryArgs = {}
): Promise<UserPostsBundle | null> {
  const user = await currentUser();
  if (!user) return null;

  const page = Math.max(1, args.page ?? 1);
  const perPage = Math.min(100, Math.max(1, args.perPage ?? DEFAULT_PER_PAGE));
  const sort = sortToPayload(args.sort);

  const payload = await getPayload();

  // ── Free-text search via the Payload Search plugin ─────────────────────────
  // When q is set, narrow the row set to post IDs returned by the search
  // index. When q is unset, leave matchingIds as `null` (no narrowing).
  // When q is set but matches nothing, force the post find to return an
  // empty page (otherwise an empty `id: { in: [] }` becomes a no-op).
  const matchingIds = args.filters?.q
    ? await searchAuthorPostIds(payload, args.filters.q, String(user.id))
    : null;

  const filterClauses: Where[] = [];
  if (matchingIds !== null) {
    if (matchingIds.length === 0) {
      // Sentinel: a non-existent UUID. Cleaner than special-casing the
      // empty-page path in the rest of the function.
      filterClauses.push({
        id: { equals: "00000000-0000-0000-0000-000000000000" }
      });
    } else {
      filterClauses.push({ id: { in: matchingIds } });
    }
  }
  if (args.filters?.status && args.filters.status.length > 0) {
    filterClauses.push({ _status: { in: args.filters.status } });
  }
  if (args.filters?.tagIds && args.filters.tagIds.length > 0) {
    filterClauses.push({ tagged: { in: args.filters.tagIds } });
  }
  if (args.filters?.updatedFrom) {
    filterClauses.push({
      updatedAt: { greater_than_equal: args.filters.updatedFrom }
    });
  }
  if (args.filters?.updatedTo) {
    filterClauses.push({
      updatedAt: { less_than_equal: args.filters.updatedTo }
    });
  }

  const where: Where = {
    and: [{ author: { equals: user.id } }, ...filterClauses]
  };

  // ── Page of rows + unfiltered status counts + tag options in parallel ──────
  // All three are Payload-native (no raw SQL). The three `payload.count`
  // calls fan out cheaply now that the `(author, _status, updatedAt)`
  // compound index is in place — see Posts collection `indexes` config.
  const authorWhere: Where = { author: { equals: user.id } };
  const [result, publishedCount, draftCount, tagOptions] = await Promise.all([
    payload.find({
      collection: "posts",
      where,
      sort,
      page,
      limit: perPage,
      depth: 1,
      draft: true,
      overrideAccess: false,
      user
    }),
    payload.count({
      collection: "posts",
      where: {
        and: [authorWhere, { _status: { equals: "published" } }]
      },
      overrideAccess: true
    }),
    payload.count({
      collection: "posts",
      where: { and: [authorWhere, { _status: { equals: "draft" } }] },
      overrideAccess: true
    }),
    authorTagOptions(payload, String(user.id))
  ]);

  const rows: UserPostRow[] = result.docs.map((doc) => {
    const status: UserPostStatus =
      doc._status === "published" ? "published" : "draft";
    return {
      id: String(doc.id),
      slug: typeof doc.slug === "string" ? doc.slug : null,
      title: doc.title ?? "Untitled",
      subtitle: doc.subtitle ?? null,
      status,
      updatedAt: doc.updatedAt,
      publishedAt: doc.publishedAt ?? null,
      cover: pickMediaShape(doc.image),
      tags: pickTags(doc.tagged)
    };
  });

  const publishedTotal = publishedCount.totalDocs;
  const draftTotal = draftCount.totalDocs;
  const allTotal = publishedTotal + draftTotal;

  return {
    rows,
    totalDocs: result.totalDocs,
    pageCount: result.totalPages,
    tagOptions,
    counts: {
      all: allTotal,
      published: publishedTotal,
      draft: draftTotal
    }
  };
}
