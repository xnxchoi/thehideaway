import { revalidatePath, revalidateTag } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import type { Surf } from "@/payload-types";

export const revalidateSurf: CollectionAfterChangeHook<Surf> = async ({
  doc,
  previousDoc,
  operation,
  req: { payload, context }
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === "published") {
      const changed =
        operation === "create" ||
        doc._status !== previousDoc._status ||
        doc.slug !== previousDoc.slug;

      if (changed) {
        const path = `/surf/${doc.slug}`;
        payload.logger.info(`Revalidating surf at path: ${path}`);
        revalidatePath(path);
        revalidateTag("surf-" + doc.slug);
      }
    }

    if (previousDoc._status === "published" && doc._status !== "published") {
      const oldPath = `/surf/${previousDoc.slug}`;
      payload.logger.info(`Revalidating old surf at path: ${oldPath}`);
      revalidatePath(oldPath);
      revalidateTag("surf-" + previousDoc.slug);
    }
  }
  return doc;
};

export const revalidateSurfDelete: CollectionAfterDeleteHook<Surf> = async ({
  doc,
  req: { context }
}) => {
  if (!context.disableRevalidate) {
    revalidatePath(`/surf/${doc?.slug}`);
    revalidateTag("surf-" + doc?.slug);
  }
  return doc;
};
