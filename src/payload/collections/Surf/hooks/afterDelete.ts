import { CollectionAfterDeleteHook } from "payload";

export const afterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload }
}) => {
  try {
    await payload.delete({
      collection: "bookmarks",
      where: { target: { equals: doc.id } },
      overrideAccess: true
    });
  } catch (error) {
    console.error(error);
  }
};
