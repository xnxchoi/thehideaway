import type { CollectionSlug } from "payload";
import type { DataFromCollectionSlug } from "payload";
export type ImageCollectionSlug = Extract<
  CollectionSlug,
  "media" | "assets" | "userMedia"
>;

export type ImageCollection = DataFromCollectionSlug<ImageCollectionSlug>;
export type ImageBaseSelect = Pick<
  ImageCollection,
  | "id"
  | "filename"
  | "mimeType"
  | "width"
  | "height"
  | "darkmode"
  | "url"
  | "blurDataUrl"
  | "thumbnailURL"
>;
