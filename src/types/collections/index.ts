import type { FrontEndCollections } from "@/stores/Routing/RP_Voyageur";
import type { SelectFromCollectionSlug } from "node_modules/payload/dist/collections/config/types";

export const baseSelect: SelectFromCollectionSlug<FrontEndCollections> = {
  id: true,
  title: true,
  slug: true,
  updatedAt: true,
  publishedAt: true,
  author: true
};
