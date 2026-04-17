"use server";
import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook } from "payload";
import { Delta } from "../../../src/payload-types";

export const validateDelta: CollectionAfterChangeHook<Delta> = async ({
  doc,
  previousDoc,
  req: { payload }
}) => {
  if (doc._status === "published") {
    const path = `/delta/${doc.slug}`;

    payload.logger.info(`Revalidating delta at path: ${path}`);

    revalidatePath(path);
  }

  // If the post was previously published, we need to revalidate the old path
  if (previousDoc._status === "published" && doc._status !== "published") {
    const oldPath = `/delta/${previousDoc.slug}`;

    payload.logger.info(`Revalidating old delta at path: ${oldPath}`);

    revalidatePath(oldPath);
  }

  return doc;
};
