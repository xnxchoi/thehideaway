import {ComponentPropsWithoutRef, RefAttributes} from "react";
import type {LinkProps as NextLinkProps} from "next/link";
import type {HTMLMotionProps} from "motion/react";
import {DataFromCollectionSlug} from "payload";

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
	ComponentPropsWithoutRef<"a">,
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
export type RPLinkPropsWithRef = RPLinkProps &
	(
		| RefAttributes<HTMLAnchorElement>
		| RefAttributes<HTMLDivElement>
		| RefAttributes<HTMLButtonElement>
		);
export type MotionBtnProps = HTMLMotionProps<"button">;