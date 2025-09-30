import type { Track } from "@/payload-types";
import type { FrontEndCollections } from "@/stores/Routing/RP_Voyageur";
import type { SelectFromCollectionSlug } from "node_modules/payload/dist/collections/config/types";
import type { CollectionSlug, DataFromCollectionSlug } from "payload";
export type LockedIndex = "locked" | "allowList" | "authority";
export type UploadsIndex = "mimeType" | "filename" | "url" | "thumbnailURL";
export type StandardIndex = "id" | "title" | "slug" | "updatedAt";

type ReqTrack = Pick<
  Track,
  "id" | "title" | "slug" | "updatedAt" | "description" | "artist"
>;
