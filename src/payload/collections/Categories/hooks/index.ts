// Helper to update a specific category
import {
  TaggedCollection,
  TaggedCollectionSlug
} from "@/payload/collections/Tags";
import type { CollectionHookArgs } from "@/payload/collections/helpers";
import { arraysEqualContents } from "@/utilities/compareArrays";
import {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Operation,
  PayloadRequest
} from "payload";

const updateCount = async (
  req: PayloadRequest,
  categoryId: string | number
) => {
  if (!categoryId) return;
  const payload = req.payload;
  // 1. Count references in 'posts'
  const postsCount = await payload.count({
    collection: "posts",
    where: { category: { equals: categoryId } }
  });

  // 2. Count references in 'surf'
  const surfsCount = await payload.count({
    collection: "surf",
    where: { category: { equals: categoryId } }
  });

  const total = postsCount.totalDocs + surfsCount.totalDocs;

  // 3. Update the category
  await payload.update({
    collection: "categories",
    id: categoryId,
    data: {
      popularity: total
    },
    overrideAccess: true,
    context: {
      ...req.context,
      overrideAccess: true
    }
  });
};
export const updateCategoryAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req
}) => {
  // If creation, or if the category field changed
  if (
    operation === "create" ||
    (operation === "update" && doc.category !== previousDoc.category)
  ) {
    // Update the NEW category
    if (doc.category) await updateCount(req, doc.category);

    // If the doc moved FROM an old category, update that one too
    if (previousDoc?.category && previousDoc.category !== doc.category) {
      await updateCount(req, previousDoc.category);
    }
  }
  return doc;
};

export const tagsDidChange = <
  T extends TaggedCollectionSlug,
  E extends Extract<Operation, "create" | "update">
>({
  operation,
  doc,
  previousDoc
}: {
  collection: T;
  operation: E;
} & Pick<CollectionHookArgs<"afterChange", T>, "doc" | "previousDoc"> &
  Partial<
    Omit<
      CollectionHookArgs<"afterChange", T>,
      "operation" | "doc" | "previousDoc" | "collection"
    >
  >): {
  verdict: boolean;
  currentIsArray: boolean;
} & (
  | {
      operation: "create";
    }
  | {
      operation: "update";
      previousIsArray: boolean;
    }
) => {
  const currentIsArray = Array.isArray(doc.tagged);
  if (operation === "create")
    return {
      verdict: currentIsArray
        ? (doc.tagged as TaggedCollection["tagged"])!.length > 0
        : false,
      operation,
      currentIsArray
    };
  const previousIsArray = Array.isArray(previousDoc.tagged);
  const areBothArraysOrNeither = currentIsArray === previousIsArray;
  const verdict = !areBothArraysOrNeither
    ? true
    : (currentIsArray &&
        !arraysEqualContents(
          previousDoc.tagged as NonNullable<typeof previousDoc.tagged>,
          doc.tagged as NonNullable<typeof doc.tagged>
        )) ||
      false;
  return { currentIsArray, previousIsArray, verdict, operation };
};
export const updateTagsAfterChange: CollectionAfterChangeHook<
  TaggedCollection
> = async ({ doc, previousDoc, operation, req, collection }) => {
  const { verdict, currentIsArray, ...rest } = tagsDidChange({
    collection: collection.slug as TaggedCollectionSlug,
    doc,
    operation,
    previousDoc
  });
  const payload = req.payload;
  if (verdict) {
    const taggedCollections = [
      "surf",
      "posts",
      "profile",
      "pages",
      "albums",
      "playlists",
      "tracks"
    ] as const;
    const tagIDsToQuery = new Set<string>();
    if (doc.tagged && doc.tagged.length > 0) {
      doc.tagged.forEach((tag) =>
        typeof tag === "string"
          ? tagIDsToQuery.add(tag)
          : tagIDsToQuery.add(tag.id)
      );
    }
    if (previousDoc && previousDoc.tagged && previousDoc.tagged.length > 0) {
      previousDoc.tagged.forEach((tag) =>
        typeof tag === "string"
          ? tagIDsToQuery.add(tag)
          : tagIDsToQuery.add(tag.id)
      );
    }
    const tagsToLookUp = [...tagIDsToQuery];
    const counts: {
      tagID: string;
      tagCount: number;
    }[] = [];
    for (const tagID of tagsToLookUp) {
      let countsForTag = 0;
      for (const col of taggedCollections) {
        const r = await payload
          .count({
            collection: col,
            overrideAccess: true,
            where: { tagged: { equals: tagID } },
            req
          })
          .then((r) => r.totalDocs)
          .catch((e) => {
            req.payload.logger.error(
              "Error while querying count for tag with ID : " + tagID,
              e
            );
            return 0;
          });
        countsForTag += r;
      }
      counts.push({ tagID, tagCount: countsForTag });
    }
    if (counts.length > 0) {
      for (const { tagID, tagCount } of counts) {
        payload.update({
          collection: "tags",
          id: tagID,
          data: {
            tagCount
          },
          draft: false,
          overrideAccess: true,
          req
        });
      }
    }
  }

  return doc;
};

export const updateCategoryAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req
}) => {
  if (doc.category) {
    await updateCount(req, doc.category);
  }
  return doc;
};
