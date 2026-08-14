import type { CollectionBeforeChangeHook } from "payload";
import { Post } from "@/payload-types";

export const populatePublishedAt: CollectionBeforeChangeHook = async ({
  data: d, operation, originalDoc: ogDoc
}) => {
  const data = d as Post;
  const originalDoc = ogDoc as Post | null;
  data.publishedAt = data._status !== "published" ? null : (operation === "update" && originalDoc?._status === "published" && !!originalDoc?.publishedAt) && originalDoc.publishedAt || Date.now() as unknown as string;
  return data;
};
