import { CollectionAfterDeleteHook } from "payload";

export const afterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload }
}) => {
  try {
    await payload.delete({
      collection: "bookmarks",
      where: {
        and: [
          { "target.value": { equals: doc.id } },
          { "target.relationTo": { equals: "delta" } }
        ]
      },
      overrideAccess: true
    });
  } catch (error) {
    payload.logger.error({ msg: "Failed to clean up bookmarks after delta delete", err: error });
  }
};
