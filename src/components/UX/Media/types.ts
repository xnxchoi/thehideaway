import {cssVariables} from "@/cssVariables";
import type {FetchedImageDoc, ImageCollectionSlug} from "@/types/collections/image-collections";
import type {StaticImport} from "next/dist/shared/lib/get-img-props";
import type {ComponentPropsWithoutRef, ReactNode, Ref} from "react";

export type ImageCollectionOverview<T extends ImageCollectionSlug = ImageCollectionSlug> = {
	[x in ImageCollectionSlug]: {
		relationTo: x;
		value: FetchedImageDoc | string;
	}
}[T];

export type FrontImageResource = ImageCollectionOverview
type CSSVARS = typeof cssVariables;
export type ViewportBreakpoints = CSSVARS["breakpoints"];
export type ViewportSizes = keyof ViewportBreakpoints;

export type AspectRatio = number | {
	[key in ViewportSizes]?: number;
} & {
	base: number;
}

export interface MediaElementProps
	extends Omit<ComponentPropsWithoutRef<"div">, "resource" | "className"> {
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
