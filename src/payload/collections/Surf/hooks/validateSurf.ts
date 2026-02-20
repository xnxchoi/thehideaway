"use server";
import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook } from "payload";
import { Surf } from "@/payload-types";

export const validateSurf: CollectionAfterChangeHook<Surf> = async ({
  doc,
  previousDoc,
  req: { payload }
}) => {
  if (doc._status === "published") {
    const path = `/surf/${doc.slug}`;

    payload.logger.info(`Revalidating surf at path: ${path}`);

    revalidatePath(path);
  }

  // If the post was previously published, we need to revalidate the old path
  if (previousDoc._status === "published" && doc._status !== "published") {
    const oldPath = `/surf/${previousDoc.slug}`;

    payload.logger.info(`Revalidating old surf at path: ${oldPath}`);

    revalidatePath(oldPath);
  }

  return doc;
};
