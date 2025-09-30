import type { StaticImageData } from "next/image";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

import type {
  ImageCollection,
  ImageCollectionSlug
} from "@/types/payload-api-helpers";
import type { SelectFromCollectionSlug } from "node_modules/payload/dist/collections/config/types";
export type ImageCollectionOverview = Pick<
  ImageCollection,
  "darkmode" | "locked" | "url" | "width" | "height" | "id" | "mimeType"
>;
type ImageS<T extends SelectFromCollectionSlug<ImageCollectionSlug>> = {
  [K in keyof T]: K extends keyof ImageCollectionOverview ? true : never;
};
export type FrontImageResource = ImageCollectionOverview & { author?: string };

export interface MediaProps
  extends Omit<ComponentPropsWithoutRef<"div">, "resource" | "className"> {
  alt?: string;
  className?: string;
  pictureClassName?: string;
  imgClassName?: string;
  onClick?: () => void;
  onLoad?: () => void;
  caption?: string | ReactNode;
  resource?: FrontImageResource | string | null;
  fill?: boolean; // for NextImage only
  size?: string; // for NextImage only
  loading?: "lazy" | "eager"; // for NextImage only
  priority?: boolean; // for NextImage only
  ref?: Ref<HTMLImageElement | HTMLVideoElement | null>;
  src?: StaticImageData;
  videoClassName?: string;
}

type QueriedMediaProps = {
  resource: FrontImageResource | string;
};
type StaticMediaProps = {
  fill?: boolean; // for NextImage only
  size?: string; // for NextImage only
  loading?: "lazy" | "eager"; // for NextImage only
  priority?: boolean; // for NextImage only

  src: StaticImageData;
};
