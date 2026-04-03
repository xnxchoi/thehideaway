"use server";

import { CompilationItemType, compilationItemTypes } from "@/payload/collections/Compilations";
import type { Bookmark, Category, Compilation, Media, User } from "@/payload-types";
import config from "@payload-config";
import { getPayload } from "payload";
import { cache } from "react";
import { CategoryOverview } from "@/types/collections/meta-collections";
import { AuthorOverview } from "@/types/collections/users";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { KeysOfValue } from "@/utilities/typeUtilities";
import { nanoid } from "nanoid";
import { getUserOverview } from "@/payload/collections/Posts/api/queryPostOverviews";
import { ImageCollection } from "@/types/collections/image-collections";

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
export type BookmarkedCollectionsSlugs = (Bookmark["target"] & {})["relationTo"];
export type BookmarkItemBase<T extends BookmarkedCollectionsSlugs = BookmarkedCollectionsSlugs> = {
  id: string;
  title: string;
  url: string;
  image?: { url: string; alt: string } | null;
  meta?: string | null;
  createdAt?: string | null;
  collection: T
};
export type CategorizedCollections = Extract<CollectionMap[keyof CollectionMap], { category: Category | string }>
export type CategorizedCollectionsSlug = KeysOfValue<CollectionMap, CategorizedCollections>
export type AuthorCollections = Extract<CollectionMap[keyof CollectionMap], { author: User | string } | {
  author: User[] | string[]
}>
export type AuthorCollectionsSlug = KeysOfValue<CollectionMap, AuthorCollections>
export type BookmarkItemTyped<T extends BookmarkedCollectionsSlugs = BookmarkedCollectionsSlugs> =
  Omit<BookmarkItemBase<T>, "collection">
  & {
  collection: T
}
  & (T extends "surf" ? { source: string } : {})
  & (T extends "tracks" | "albums" ? { artist: string } : {})
  & (T extends AuthorCollectionsSlug ? {
  author: string | AuthorOverview;
} : {})
  & (T extends CategorizedCollectionsSlug ? { category: CategoryOverview | string; } : {})
type B = BookmarkItemTyped<"surf">
//
//   | ({ collectionSlug: "posts" } & BookmarkItemBase & { author?: string | null; category?: string | null }) | ({
//   collectionSlug: "surf"
// } & BookmarkItemBase & { source?: string | null }) | ({ collectionSlug: "profile" } & BookmarkItemBase) | ({
//   collectionSlug: "albums"
// } & BookmarkItemBase & { artist?: string | null }) | ({ collectionSlug: "playlists" } & BookmarkItemBase) | ({
//   collectionSlug: "tracks"
// } & BookmarkItemBase & { artist?: string | null }) | ({ collectionSlug: "userMedia" } & BookmarkItemBase);

function mediaToImageShape(m: string | ImageCollection | null | undefined): { url: string; alt: string } | null {
  if (!m || typeof m === "string") return null;
  return { url: m.url ?? "", alt: m.alt ?? m.filename ?? "" };
}

// ─── Compilations CRUD ──────────────────────────────────────────────────────

export const getUserCompilations = cache(async (userId: string): Promise<CompilationSummary[]> => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "compilations",
    where: { author: { equals: userId } },
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
    ...doc, authorPromise: await getUserOverview(typeof doc.author === "string" ? doc.author : doc.author.id)
  }));
  const res = await Promise.allSettled(r).then(m => m.filter(r => r.status === "fulfilled").map(r => r.value)).
    catch(r => {
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
});

export const getPublicUserCompilations = cache(async (userId: string): Promise<CompilationSummary[]> => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "compilations", where: {
      and: [{ author: { equals: userId } }, { visibility: { equals: "public" } }]
    }, depth: 1, overrideAccess: true, limit: 200
  });
  const r = result.docs.map(async (doc) => ({
    ...doc, authorPromise: await getUserOverview(typeof doc.author === "string" ? doc.author : doc.author.id)
  }));
  const res = await Promise.allSettled(r).then(m => m.filter(r => r.status === "fulfilled").map(r => r.value)).
    catch(r => {
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
});

export const getCompilationByHashId = cache(
  async (hashId: string): Promise<(Compilation & { itemCount: number }) | null> => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "compilations", where: { hashId: { equals: hashId } }, depth: 2, overrideAccess: true, limit: 1
    });
    if (result.docs.length === 0) return null;
    const doc = result.docs[0]!;
    return { ...doc, itemCount: Array.isArray(doc.items) ? doc.items.length : 0 };
  });

export async function createCompilation({
  title, description, visibility = "private", userId
}: {
  title: string; description?: string; visibility?: "public" | "private"; userId: string;
}): Promise<{ id: string; hashId: string } | { error: string }> {
  try {
    const payload = await getPayload({ config });
    const doc = await payload.create({
      collection: "compilations", draft: false, data: {
        title, description, visibility, author: userId, hashId: nanoid(11), items: []
      }, overrideAccess: true, depth: 0
    });
    return { id: doc.id, hashId: doc.hashId };
  } catch (e) {
    console.error("[createCompilation]", e);
    return { error: "Failed to create compilation" };
  }
}

export async function updateCompilation({
  id, userId, patch
}: {
  id: string;
  userId: string;
  patch: Partial<Pick<Compilation, "title" | "description" | "visibility" | "coverImage" | "items">>;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const payload = await getPayload({ config });
    // Verify ownership before updating
    const existing = await payload.findByID({
      collection: "compilations", id, depth: 0, overrideAccess: true, select: { author: true }
    });
    const ownerId = typeof existing.author === "string" ? existing.author : (existing.author as User).id;
    if (ownerId !== userId) return { error: "Unauthorized" };

    await payload.update({
      collection: "compilations", id, data: patch, overrideAccess: true, depth: 0
    });
    return { success: true };
  } catch (e) {
    console.error("[updateCompilation]", e);
    return { error: "Failed to update compilation" };
  }
}

export async function deleteCompilation({
  id, userId
}: {
  id: string; userId: string;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const payload = await getPayload({ config });
    const existing = await payload.findByID({
      collection: "compilations", id, depth: 0, overrideAccess: true, select: { author: true }
    });
    const ownerId = typeof existing.author === "string" ? existing.author : (existing.author as User).id;
    if (ownerId !== userId) return { error: "Unauthorized" };

    await payload.delete({ collection: "compilations", id, overrideAccess: true });
    return { success: true };
  } catch (e) {
    console.error("[deleteCompilation]", e);
    return { error: "Failed to delete compilation" };
  }
}

export async function addItemToCompilation({
  compilationId, item, userId
}: {
  compilationId: string; item: { relationTo: CompilationItemType; value: string }; userId: string;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const payload = await getPayload({ config });
    const existing = await payload.findByID({
      collection: "compilations", id: compilationId, depth: 0, overrideAccess: true
    });
    const ownerId = typeof existing.author === "string" ? existing.author : (existing.author as User).id;
    if (ownerId !== userId) return { error: "Unauthorized" };

    const currentItems = (existing.items || []);
    const alreadyAdded = currentItems.some(
      (i) => i.relationTo === item.relationTo && (typeof i.value === "string" ? i.value : (i.value).id) === item.value);
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
  compilationId, itemIndex, userId
}: {
  compilationId: string; itemIndex: number; userId: string;
}): Promise<{ success: boolean } | { error: string }> {
  try {
    const payload = await getPayload({ config });
    const existing = await payload.findByID({
      collection: "compilations", id: compilationId, depth: 0, overrideAccess: true
    });
    const ownerId = typeof existing.author === "string" ? existing.author : (existing.author as User).id;
    if (ownerId !== userId) return { error: "Unauthorized" };

    const currentItems = [...((existing.items || []))];
    currentItems.splice(itemIndex, 1);

    await payload.update({
      collection: "compilations", id: compilationId, data: { items: currentItems }, overrideAccess: true, depth: 0
    });
    return { success: true };
  } catch (e) {
    console.error("[removeItemFromCompilation]", e);
    return { error: "Failed to remove item" };
  }
}

// ─── Bookmarks with populated data ──────────────────────────────────────────

export const getUserBookmarkedItems = cache(
  async (userId: string): Promise<{ [K in CompilationItemType]?: BookmarkItemTyped[] }> => {
    const payload = await getPayload({ config });

    // Fetch all bookmark docs for this user across all supported types
    const bookmarkResults = await Promise.allSettled(compilationItemTypes.map((type) => payload.find({
      collection: "bookmarks", where: {
        and: [{ user: { equals: userId } }, { "target.relationTo": { equals: type } }]
      }, depth: 0, overrideAccess: true, limit: 500, select: { target: true }
    }).then((r) => ({
      type,
      ids: r.docs.map((d) => typeof d.target.value === "string" ? d.target.value : (d.target.value).id) as string[]
    }))));

    const idsByType: Record<string, string[]> = {};
    for (const r of bookmarkResults) {
      if (r.status === "fulfilled") idsByType[r.value.type] = r.value.ids;
    }

    const result: { [K in CompilationItemType]?: BookmarkItemTyped[] } = {};

    await Promise.allSettled([// posts
      idsByType["posts"]?.length ? payload.find({
        collection: "posts",
        where: { id: { in: idsByType["posts"]! } },
        depth: 1,
        overrideAccess: true,
        limit: 500,
        select: { id: true, title: true, slug: true, image: true, author: true, category: true, createdAt: true }
      }).then((r) => {
        result.posts = r.docs.map((d) => ({
          collection: "posts" as const,
          id: d.id,
          title: d.title,
          url: `/essays/${d.slug}`,
          image: mediaToImageShape(d.image?.value),
          author: typeof (d).author === "string" ? null : (d).author?.name ?? null,
          category: typeof (d).category === "string" ? null : (d).category?.title ?? null,
          createdAt: (d).createdAt ?? null
        }));
      }) : Promise.resolve(),

      // surf
      idsByType["surf"]?.length ? payload.find({
        collection: "surf",
        where: { id: { in: idsByType["surf"]! } },
        depth: 1,
        overrideAccess: true,
        limit: 500,
        select: { id: true, title: true, slug: true, image: true, source: true, createdAt: true }
      }).then((r) => {
        result.surf = r.docs.map((d) => ({
          collection: "surf" as const,
          id: d.id,
          title: d.title ?? "",
          url: `/surf/${(d).slug}`,
          source: (d).source ?? null,
          createdAt: (d).createdAt ?? null
        }));
      }) : Promise.resolve(),

      // albums
      idsByType["albums"]?.length ? payload.find({
        collection: "albums",
        where: { id: { in: idsByType["albums"]! } },
        depth: 1,
        overrideAccess: true,
        limit: 500,
        select: { id: true, title: true, image: true, createdAt: true }
      }).then((r) => {
        result.albums = r.docs.map((d) => ({
          collection: "albums" as const,
          id: d.id,
          title: (d).title ?? "",
          url: `/radio`,
          createdAt: (d).createdAt ?? null
        }));
      }) : Promise.resolve(),

      // playlists
      idsByType["playlists"]?.length ? payload.find({
        collection: "playlists",
        where: { id: { in: idsByType["playlists"]! } },
        depth: 1,
        overrideAccess: true,
        limit: 500,
        select: { id: true, title: true, image: true, createdAt: true }
      }).then((r) => {
        result.playlists = r.docs.map((d) => ({
          collection: "playlists" as const,
          id: d.id,
          title: (d).title ?? "",
          url: `/radio`,
          createdAt: (d).createdAt ?? null
        }));
      }) : Promise.resolve(),

      // tracks
      idsByType["tracks"]?.length ? payload.find({
        collection: "tracks",
        where: { id: { in: idsByType["tracks"]! } },
        depth: 1,
        overrideAccess: true,
        limit: 500,
        select: { id: true, title: true, image: true, createdAt: true }
      }).then((r) => {
        result.tracks = r.docs.map((d) => ({
          collection: "tracks" as const,
          id: d.id,
          title: (d).title ?? "",
          url: `/radio`,
          createdAt: (d).createdAt ?? null
        }));
      }) : Promise.resolve(),

      // userMedia
      idsByType["userMedia"]?.length ? payload.find({
        collection: "userMedia",
        where: { id: { in: idsByType["userMedia"]! } },
        depth: 0,
        overrideAccess: true,
        limit: 500,
        select: { id: true, filename: true, url: true, createdAt: true }
      }).then((r) => {
        result.userMedia = r.docs.map((d) => ({
          collection: "userMedia" as const,
          id: d.id,
          title: (d).filename ?? "Media",
          url: (d).url ?? "",
          image: { url: (d).url ?? "", alt: (d).filename ?? "" },
          createdAt: (d).createdAt ?? null
        }));
      }) : Promise.resolve()]);

    return result;
  });
