"use server";

import { CollectionAfterChangeHook } from "payload";
import { Tag } from "@payload-types";
import { revalidatePath, revalidateTag } from "next/cache";

export const revalidateTagged: CollectionAfterChangeHook<Tag> = async ({ collection, operation, doc, previousDoc }) => {

  switch (operation) {
    case "update": {
      revalidatePath("/tagged/" + doc.slug, "page");
      if (previousDoc?.slug !== doc?.slug) {
        revalidatePath("/tagged/" + previousDoc.slug, "page");
      }
      revalidateTag("tag-" + (doc as Tag).slug, "max");
    }
      break;
  }
  return doc;
};