import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

import type { User } from "@/payload-types";
import type {
  ImageBaseSelect,
  ImageCollectionSlug
} from "@/types/payload-api-helpers";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import type { SelectFromCollectionSlug } from "node_modules/payload/dist/collections/config/types";
export type ImageCollectionOverview = ImageBaseSelect;
type ImageS<T extends SelectFromCollectionSlug<ImageCollectionSlug>> = {
  [K in keyof T]: K extends keyof ImageCollectionOverview ? true : never;
};
export type FrontImageResource = ImageCollectionOverview & {
  author?: string | User;
};
export type ViewportSizes = "lg" | "md" | "sm" | "xl" | "2xl" | "3xl" | "xs";

export type AspectRatio =
  | ({
      def: number;
    } & {
      [x in ViewportSizes]?: number;
    })
  | number;
export interface MediaElementProps
  extends Omit<ComponentPropsWithoutRef<"div">, "resource" | "className"> {
  alt?: string;
  className?: string;
  pictureClassName?: string;
  captionClassName?: string;
  htmlElement?: keyof HTMLElementTagNameMap;
  aspectRatio?: AspectRatio;
  imgClassName?: string;
  onClick?: () => void;
  onLoad?: () => void;
  caption?: string | ReactNode;
  resource?: FrontImageResource | string | null;
  fill?: boolean; // for NextImage only
  size?: string; // for NextImage only
  loading?: "lazy" | "eager"; // for NextImage only
  priority?: boolean; // for NextImage only
  ref?: Ref<HTMLImageElement> | Ref<HTMLVideoElement>;
  src?: StaticImport | string;
  videoClassName?: string;
}
export type MediaProps = Omit<MediaElementProps, "videoClassName" | "ref"> & {
  ref?: Ref<HTMLImageElement>;
};

type QueriedMediaProps = {
  resource: FrontImageResource | string;
};
type StaticMediaProps = {
  fill?: boolean; // for NextImage only
  size?: string; // for NextImage only
  loading?: "lazy" | "eager"; // for NextImage only
  priority?: boolean; // for NextImage only

  src: StaticImport | string;
};
