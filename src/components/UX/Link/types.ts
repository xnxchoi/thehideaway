import type {HTMLMotionProps} from "motion/react";
import type {LinkProps as NextLinkProps} from "next/link";
import {DataFromCollectionSlug} from "payload";
import {type ComponentProps, ComponentPropsWithoutRef} from "react";

export type PayloadLinkProps = {
  type: "reference" | "custom";
  newTab?: boolean;
  reference?: {
    relationTo:
      | "pages"
      | "users"
      | "posts"
      | "delta"
      | "albums"
      | "tracks"
      | "playlists"
      | "organizations"
      | "categories";
    value:
      | DataFromCollectionSlug<
          | "pages"
          | "users"
          | "posts"
          | "delta"
          | "albums"
          | "tracks"
          | "playlists"
          | "organizations"
          | "categories"
        >
      | DataFromCollectionSlug<
          | "pages"
          | "users"
          | "posts"
          | "delta"
          | "albums"
          | "tracks"
          | "playlists"
          | "organizations"
          | "categories"
        >["id"];
  } | null;
  url?: string | null;
  label?: string;
  appearance?: "default" | "outline" | null;
};
type AllowedTags = HTMLAnchorElement | HTMLSpanElement | HTMLDivElement;
export type RPLinkProps = Omit<
  ComponentProps<"a">,
  "onMouseEnter" | "onClick" | "onMouseLeave"
> &
  Omit<NextLinkProps, "onMouseEnter" | "onClick" | "onMouseLeave"> & {
    onMouseLeave?: () => void;
    onMouseEnter?: () => void;
    onClick?: () => void;
  };
export type RPButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "onMouseEnter" | "onClick" | "onMouseLeave"
> & {
  onMouseLeave?: () => void;
  onMouseEnter?: () => void;
  onClick?: () => void;
};
export type RPLinkPropsWithRef = RPLinkProps & {
  disabled?: boolean;
};
export type MotionBtnProps = HTMLMotionProps<"button">
