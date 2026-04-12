import { CollectionAfterDeleteHook, CollectionSlug } from "payload";

/**
 * Factory for an afterDelete hook that removes orphaned bookmarks
 * when the target document is deleted. Pass the collection slug
 * that corresponds to `target.relationTo` in the Bookmarks schema.
 */
export const cleanupBookmarksAfterDelete = (
  relationTo: string
): CollectionAfterDeleteHook => {
  return async ({ doc, req: { payload } }) => {
    try {
      await payload.delete({
        collection: "bookmarks" as CollectionSlug,
        where: {
          and: [
            { "target.value": { equals: doc.id } },
            { "target.relationTo": { equals: relationTo } }
          ]
        },
        overrideAccess: true
      });
    } catch (error) {
      payload.logger.error({
        msg: `Failed to clean up bookmarks after ${relationTo} delete`,
        err: error
      });
    }
  };
};
