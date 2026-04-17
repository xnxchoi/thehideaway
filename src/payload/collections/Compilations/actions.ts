"use server";

import { currentUser } from "@/lib/auth/context/get-context-props";
import type { Bookmark, Category, Compilation, Media, User } from "@/payload-types";
import { CompilationItemType, compilationItemTypes } from "@/payload/collections/Compilations";
import { getUserOverview } from "@/payload/collections/Posts/api/queryPostOverviews";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { ImageCollection } from "@/types/collections/image-collections";
import { CategoryOverview } from "@/types/collections/meta-collections";
import { AuthorOverview } from "@/types/collections/users";
import { KeysOfValue } from "@/utilities/typeUtilities";
import config from "@payload-config";
import { nanoid } from "nanoid";
import { CollectionSlug, getPayload } from "payload";
import { cache } from "react";

export type CompilationSummary = {
  id: string;
  hashId: string;
  title: string;
  description?: string | null;
  visibility: "public" | "private";
  coverImage?: { url: string; alt: string } | null;
  itemCount: number;
  author: { id: string; username?: string | null; slug?: string | null };
  createdAt: string;
  updatedAt: string;
};
export type BookmarkedCollectionsSlugs =
  (Bookmark["target"] & {})["relationTo"];
export type BookmarkItemBase<
  T extends BookmarkedCollectionsSlugs = BookmarkedCollectionsSlugs
> = {
  id: string;
  title: string;
  url: string;
  image?: { url: string; alt: string } | null;
  meta?: string | null;
  createdAt?: string | null;
  collection: T;
};
export type CategorizedCollections = Extract<
  CollectionMap[keyof CollectionMap],
  { category: Category | string }
>;
export type CategorizedCollectionsSlug = KeysOfValue<
  CollectionMap,
  CategorizedCollections
>;
export type AuthorCollections = Extract<
  CollectionMap[keyof CollectionMap],
  | { author: User | string }
  | {
      author: User[] | string[];
    }
>;
export type AuthorCollectionsSlug = KeysOfValue<
  CollectionMap,
  AuthorCollections
>;
export type BookmarkItemTyped<
  T extends BookmarkedCollectionsSlugs = BookmarkedCollectionsSlugs
> = Omit<BookmarkItemBase<T>, "collection"> & {
  collection: T;
} & (T extends "surf" ? { source: string } : {}) &
  (T extends "tracks" | "albums" ? { artist: string } : {}) &
  (T extends AuthorCollectionsSlug
    ? {
        author: string | AuthorOverview;
      }
    : {}) &
  (T extends CategorizedCollectionsSlug
    ? { category: CategoryOverview | string }
    : {});
type B = BookmarkItemTyped<"surf">;

function mediaToImageShape(
  m: string | ImageCollection | null | undefined
): { url: string; alt: string } | null {
  if (!m || typeof m === "string") return null;
  return { url: m.url ?? "", alt: m.alt ?? m.filename ?? "" };
}

// SECURITY: Every export in this file is a `"use server"` action and therefore
// a POST-invokable endpoint. The previously-accepted `userId` parameter was
// self-attestation — any authenticated client could read, create, mutate, and
// delete compilations owned by any user. All user-scoped reads and every
// mutation now derive the viewer from the session and fail closed on no-auth.

// ─── Compilations CRUD ──────────────────────────────────────────────────────

/**
 * Returns the signed-in user's own compilations (all visibilities).
 * Fails closed if no session. Previously accepted a client-supplied userId,
 * which allowed any authenticated client to enumerate another user's private
 * lists.
 */
export const getUserCompilations = cache(
  async (): Promise<CompilationSummary[]> => {
    const viewer = await currentUser();
    if (!viewer) return [];

    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "compilations",
      where: { author: { equals: viewer.id } },
      depth: 1,
      overrideAccess: true,
      limit: 200,
      select: {
        id: true,
        hashId: true,
        title: true,
        description: true,
        visibility: true,
        coverImage: true,
        items: true,
        author: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const r = result.docs.map(async (doc) => ({
      ...doc,
      authorPromise: await getUserOverview(
        typeof doc.author === "string" ? doc.author : doc.author.id
      )
    }));
    const res = await Promise.allSettled(r)
      .then((m) =>
        m.filter((r) => r.status === "fulfilled").map((r) => r.value)
      )
      .catch((r) => {
        payload.logger.error(`Error in getUserCompilations: ${r}`);
        return null;
      });
    if (!res) throw new Error("Error in getUserCompilations");
    return res.map((doc) => {
      return {
        id: doc.id,
        hashId: doc.hashId,
        title: doc.title,
        description: doc.description,
        visibility: doc.visibility as "public" | "private",
        coverImage: mediaToImageShape(doc.coverImage as Media | null),
        itemCount: Array.isArray(doc.items) ? doc.items.length : 0,
        author: doc.authorPromise,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    });
  }
);

/**
 * Returns PUBLIC compilations authored by `userId`. Safe to expose — the
 * `visibility: public` filter is enforced server-side and the `userId`
 * parameter only narrows the result to a specific author (it does not grant
 * privileged access).
 */
export const getPublicUserCompilations = cache(
  async (userId: string): Promise<CompilationSummary[]> => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "compilations",
      where: {
        and: [
          { author: { equals: userId } },
          { visibility: { equals: "public" } }
        ]
      },
      depth: 1,
      overrideAccess: true,
      limit: 200
    });
    const r = result.docs.map(async (doc) => ({
      ...doc,
      authorPromise: await getUserOverview(
        typeof doc.author === "string" ? doc.author : doc.author.id
      )
    }));
    const res = await Promise.allSettled(r)
      .then((m) =>
        m.filter((r) => r.status === "fulfilled").map((r) => r.value)
      )
      .catch((r) => {
        payload.logger.error(`Error in getPublicUserCompilations: ${r}`);
        return null;
      });
    if (!res) throw new Error("Error in getPublicUserCompilations");
    return res.map((doc) => {
      return {
        id: doc.id,
        hashId: doc.hashId,
        title: doc.title,
        description: doc.description,
        visibility: doc.visibility as "public" | "private",
        coverImage: mediaToImageShape(doc.coverImage as Media | null),
        itemCount: Array.isArray(doc.items) ? doc.items.length : 0,
        author: doc.authorPromise,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    });
  }
);

/**
 * Fetches a compilation by its public hashId. Private compilations are only
 * returned to their owner; everyone else sees `null` as if the list did not
 * exist.
 */
export const getCompilationByHashId = cache(
  async (
    hashId: string
  ): Promise<(Compilation & { itemCount: number }) | null> => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "compilations",
      where: { hashId: { equals: hashId } },
      depth: 2,
      overrideAccess: true,
      limit: 1
    });
    if (result.docs.length === 0) return null;
    const doc = result.docs[0]!;

    // Visibility gate: private compilations are only visible to their owner.
    if (doc.visibility !== "public") {
      const viewer = await currentUser();
      if (!viewer) return null;
      const ownerId =
        typeof doc.author === "string" ? doc.author : (doc.author as User).id;
      if (ownerId !== viewer.id) return null;
    }

    return {
      ...doc,
      itemCount: Array.isArray(doc.items) ? doc.items.length : 0
    };
  }
);

export async function createCompilation({
  title,
  description,
  visibility = "private"
}: {
  title: string;
  description?: string;
  visibility?: "public" | "private";
}): Promise<{ id: string; hashId: string } | { error: string }> {
  try {
    const viewer = await currentUser();
    if (!viewer) return { error: "Unauthorized" };

    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: "compilations",
      draft: false,
      data: {
        title,
        description,
        visibility,
        author: viewer.id,
        hashId: nanoid(11),
        items: []
      },
      overrideAccess: true,
      depth: 0
    });
    return { id: doc.id, hashId: doc.hashId };
  } catch (e) {
    console.error("[createCompilation]", e);
    return { error: "Failed to create compilation" };
  }
}

export async function updateCompilation({
  id,
  patch
}: {
  id: string;
  patch: Partial<
    Pick<
      Compilation,
      "title" | "description" | "visibility" | "coverImage" | "items"
    >
  >;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const viewer = await currentUser();
    if (!viewer) return { error: "Unauthorized" };

    const payload = await getPayload({ config });
    // Verify ownership before updating
    const existing = await payload.findByID({
      collection: "compilations",
      id,
      depth: 0,
      overrideAccess: true,
      select: { author: true }
    });
    const ownerId =
      typeof existing.author === "string"
        ? existing.author
        : (existing.author as User).id;
    if (ownerId !== viewer.id) return { error: "Unauthorized" };

    await payload.update({
      collection: "compilations",
      id,
      data: patch,
      overrideAccess: true,
      depth: 0
    });
    return { success: true };
  } catch (e) {
    console.error("[updateCompilation]", e);
    return { error: "Failed to update compilation" };
  }
}

export async function deleteCompilation({
  id
}: {
  id: string;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const viewer = await currentUser();
    if (!viewer) return { error: "Unauthorized" };

    const payload = await getPayload({ config });
    const existing = await payload.findByID({
      collection: "compilations",
      id,
      depth: 0,
      overrideAccess: true,
      select: { author: true }
    });
    const ownerId =
      typeof existing.author === "string"
        ? existing.author
        : (existing.author as User).id;
    if (ownerId !== viewer.id) return { error: "Unauthorized" };

    await payload.delete({
      collection: "compilations",
      id,
      overrideAccess: true
    });
    return { success: true };
  } catch (e) {
    console.error("[deleteCompilation]", e);
    return { error: "Failed to delete compilation" };
  }
}

export async function addItemToCompilation({
  compilationId,
  item
}: {
  compilationId: string;
  item: { relationTo: CompilationItemType; value: string };
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const viewer = await currentUser();
    if (!viewer) return { error: "Unauthorized" };

    const payload = await getPayload({ config });
    const existing = await payload.findByID({
      collection: "compilations",
      id: compilationId,
      depth: 0,
      overrideAccess: true
    });
    const ownerId =
      typeof existing.author === "string"
        ? existing.author
        : (existing.author as User).id;
    if (ownerId !== viewer.id) return { error: "Unauthorized" };

    const currentItems = existing.items || [];
    const alreadyAdded = currentItems.some(
      (i) =>
        i.relationTo === item.relationTo &&
        (typeof i.value === "string" ? i.value : i.value.id) === item.value
    );
    if (alreadyAdded) return { success: true };

    await payload.update({
      collection: "compilations",
      id: compilationId,
      data: { items: [...currentItems, item] },
      overrideAccess: true,
      depth: 0
    });
    return { success: true };
  } catch (e) {
    console.error("[addItemToCompilation]", e);
    return { error: "Failed to add item" };
  }
}

export async function removeItemFromCompilation({
  compilationId,
  itemId,
  relationTo
}: {
  compilationId: string;
  itemId: string;
  relationTo: CollectionSlug;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const viewer = await currentUser();
    if (!viewer) return { error: "Unauthorized" };

    const payload = await getPayload({ config });
    const existing = await payload.findByID({
      collection: "compilations",
      id: compilationId,
      depth: 0,
      overrideAccess: true
    });
    const ownerId =
      typeof existing.author === "string"
        ? existing.author
        : (existing.author as User).id;
    if (ownerId !== viewer.id) return { error: "Unauthorized" };

    const currentItems = [...(existing.items || [])] as {
      relationTo: CollectionSlug;
      value: string;
    }[];
    const filtered = currentItems
      .filter(
        (item) => !(item.value === itemId && item.relationTo === relationTo)
      )
      .map(({ relationTo: r, value }) => ({
        relationTo: r as typeof relationTo,
        value
      }));

    if (filtered.length === currentItems.length) {
      return { error: "Item not found in compilation" };
    }

    await payload.update({
      collection: "compilations",
      id: compilationId,
      //@ts-expect-error this shit is just collslug
      data: { items: filtered },
      overrideAccess: true,
      depth: 0
    });
    return { success: true };
  } catch (e) {
    console.error("[removeItemFromCompilation]", e);
    return { error: "Failed to remove item" };
  }
}

// ─── Bookmarks with populated data ──────────────────────────────────────────

/**
 * Returns the signed-in user's bookmarked items grouped by collection.
 * Fails closed if no session. Previously accepted a client-supplied userId,
 * which let any authenticated client enumerate another user's saved items.
 */
export const getUserBookmarkedItems = cache(
  async (): Promise<{ [K in CompilationItemType]?: BookmarkItemTyped[] }> => {
    const viewer = await currentUser();
    if (!viewer) return {};

    const payload = await getPayload({ config });

    // Fetch all bookmark docs for this user across all supported types
    const bookmarkResults = await Promise.allSettled(
      compilationItemTypes.map((type) =>
        payload
          .find({
            collection: "bookmarks",
            where: {
              and: [
                { user: { equals: viewer.id } },
                { "target.relationTo": { equals: type } }
              ]
            },
            depth: 0,
            overrideAccess: true,
            limit: 500,
            select: { target: true }
          })
          .then((r) => ({
            type,
            ids: r.docs.map((d) =>
              typeof d.target.value === "string"
                ? d.target.value
                : d.target.value.id
            ) as string[]
          }))
      )
    );

    const idsByType: Record<string, string[]> = {};
    for (const r of bookmarkResults) {
      if (r.status === "fulfilled") idsByType[r.value.type] = r.value.ids;
    }

    const result: { [K in CompilationItemType]?: BookmarkItemTyped[] } = {};

    await Promise.allSettled([
      // posts
      idsByType["posts"]?.length
        ? payload
            .find({
              collection: "posts",
              where: { id: { in: idsByType["posts"]! } },
              depth: 1,
              overrideAccess: true,
              limit: 500,
              select: {
                id: true,
                title: true,
                slug: true,
                image: true,
                author: true,
                category: true,
                createdAt: true
              }
            })
            .then((r) => {
              result.posts = r.docs.map((d) => ({
                collection: "posts" as const,
                id: d.id,
                title: d.title,
                url: `/essays/${d.slug}`,
                image: mediaToImageShape(d.image?.value),
                author:
                  typeof d.author === "string"
                    ? null
                    : (d.author?.name ?? null),
                category:
                  typeof d.category === "string"
                    ? null
                    : (d.category?.title ?? null),
                createdAt: d.createdAt ?? null
              }));
            })
        : Promise.resolve(),

      // surf
      idsByType["surf"]?.length
        ? payload
            .find({
              collection: "surf",
              where: { id: { in: idsByType["surf"]! } },
              depth: 1,
              overrideAccess: true,
              limit: 500,
              select: {
                id: true,
                title: true,
                slug: true,
                image: true,
                source: true,
                createdAt: true
              }
            })
            .then((r) => {
              result.surf = r.docs.map((d) => ({
                collection: "surf" as const,
                id: d.id,
                title: d.title ?? "",
                url: `/surf/${d.slug}`,
                source: d.source ?? null,
                createdAt: d.createdAt ?? null
              }));
            })
        : Promise.resolve(),

      // albums
      idsByType["albums"]?.length
        ? payload
            .find({
              collection: "albums",
              where: { id: { in: idsByType["albums"]! } },
              depth: 1,
              overrideAccess: true,
              limit: 500,
              select: { id: true, title: true, image: true, createdAt: true }
            })
            .then((r) => {
              result.albums = r.docs.map((d) => ({
                collection: "albums" as const,
                id: d.id,
                title: d.title ?? "",
                url: `/radio`,
                createdAt: d.createdAt ?? null
              }));
            })
        : Promise.resolve(),

      // playlists
      idsByType["playlists"]?.length
        ? payload
            .find({
              collection: "playlists",
              where: { id: { in: idsByType["playlists"]! } },
              depth: 1,
              overrideAccess: true,
              limit: 500,
              select: { id: true, title: true, image: true, createdAt: true }
            })
            .then((r) => {
              result.playlists = r.docs.map((d) => ({
                collection: "playlists" as const,
                id: d.id,
                title: d.title ?? "",
                url: `/radio`,
                createdAt: d.createdAt ?? null
              }));
            })
        : Promise.resolve(),

      // tracks
      idsByType["tracks"]?.length
        ? payload
            .find({
              collection: "tracks",
              where: { id: { in: idsByType["tracks"]! } },
              depth: 1,
              overrideAccess: true,
              limit: 500,
              select: { id: true, title: true, image: true, createdAt: true }
            })
            .then((r) => {
              result.tracks = r.docs.map((d) => ({
                collection: "tracks" as const,
                id: d.id,
                title: d.title ?? "",
                url: `/radio`,
                createdAt: d.createdAt ?? null
              }));
            })
        : Promise.resolve(),

      // userMedia
      idsByType["userMedia"]?.length
        ? payload
            .find({
              collection: "userMedia",
              where: { id: { in: idsByType["userMedia"]! } },
              depth: 0,
              overrideAccess: true,
              limit: 500,
              select: { id: true, filename: true, url: true, createdAt: true }
            })
            .then((r) => {
              result.userMedia = r.docs.map((d) => ({
                collection: "userMedia" as const,
                id: d.id,
                title: d.filename ?? "Media",
                url: d.url ?? "",
                image: { url: d.url ?? "", alt: d.filename ?? "" },
                createdAt: d.createdAt ?? null
              }));
            })
        : Promise.resolve()
    ]);

    return result;
  }
);
