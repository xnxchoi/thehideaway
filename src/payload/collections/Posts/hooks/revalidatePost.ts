import { Post } from "@/payload-types";
import { arraysEqualContents } from "@/utilities/compareArrays";

import { revalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook
} from "payload";

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  operation,
  req: { payload, context }
}) => {
  if (context.disableRevalidate) {
    return doc;
  }
  if (doc._status === "published") {
    let changed =
      operation === "create" ||
      doc._status !== previousDoc._status ||
      doc.slug !== previousDoc.slug ||
      doc.locked !== previousDoc.locked;
    if (operation === "update") {
      if (doc.locked && previousDoc.locked) {
        const nowAllowlist =
          (doc.allowList as string[] | null | undefined) ?? null;
        const prevAllowlist =
          (previousDoc.allowList as string[] | null | undefined) ?? null;

        if (nowAllowlist) {
          if (prevAllowlist) {
            changed =
              changed || !arraysEqualContents(nowAllowlist, prevAllowlist);
          } else {
            changed = true;
          }
        }
        const nowAuth = doc.authority || 1;
        const prevAuth = previousDoc.authority || 1;
        changed = changed || nowAuth !== prevAuth;
      }
    }

    if (changed) {
      const path = `/essays/${doc.slug}`;

      payload.logger.info(`Revalidating post at path: ${path}`);
      revalidatePath(`/essays`);
      revalidatePath(path);

      // revalidateTag("posts-sitemap", {expire: 50});
    }
  }

  // If the post was previously published, we need to revalidate the old path
  if (previousDoc._status === "published" && doc._status !== "published") {
    const oldPath = `/essays/${previousDoc.slug}`;

    payload.logger.info(`Revalidating old post at path: ${oldPath}`);

    revalidatePath(oldPath);
    // revalidateTag("posts-sitemap", {expire: 50});
  }
  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { context }
}) => {
  if (!context.disableRevalidate) {
    const path = `/essays/${doc?.slug}`;

    revalidatePath(path);
    // revalidateTag("posts-sitemap", {expire: 50});
  }

  return doc;
};
