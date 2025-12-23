"use client";

import {ImageMedia} from "@/components/UX/Media/ImageMedia";
import type {FrontImageResource, MediaProps} from "@/components/UX/Media/types";
import {cn} from "@/lib/utils";
import {useCursor} from "@/providers/RP_Pro";
import type {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {getClientSideURL} from "@/utilities/getURL";
import {useQuery} from "@tanstack/react-query";
import {type Ref, useCallback, useEffect, useMemo, useState, useTransition} from "react";
import {Skeleton} from "../../ui/skeleton";

import {getFallbackImage} from "@/utilities/getFallbackImage";
import {nanoid} from "nanoid";
import {stringify} from "qs-esm";
import {
	FetchedImageDoc,
	ProcessedImageDoc,
	RenderImageFields
} from "@/types/collections/imageCollections";

export type FrontImageProps = Omit<MediaProps, "ref"> & {
	className?: string;
	isUser?: boolean;
	ref?: Ref<HTMLImageElement>;
};
export const FrontImage = (props: FrontImageProps) => {
	const {
		resource: image,
		imgClassName,
		className,
		src,
		isUser,
		...rest
	} = props;
	const hashId = useMemo(() => nanoid(), []);
	return image ? (
		<QueriedImage
			resource={image}
			className={className}
			imgClassName={imgClassName}
			collection={isUser ? "userMedia" : "assets"}
			{...rest}
		/>
	) : !!src ? (
		<ImageMedia className={"relative"} src={src} {...props}   />
	) : (
		<FallbackImage
			hashId={hashId}
			imgClassName={imgClassName}
			{...rest}
		/>
	);
};

function FallbackImage(
	props: { hashId: string } & Omit<FrontImageProps, "src" | "resource">
) {
	const {hashId, imgClassName, className, aspectRatio, ...rest} = props;
	const [isTransitioning, startTransition] = useTransition();
	const [backupImage, setBackupImage] = useState<{
		path: string;
	} | null>(null);

	const getBackupImage = useCallback(() => {
		startTransition(async () => {
			await getFallbackImage(hashId).then((res) => {
				setBackupImage(res);
			});
		});
	}, [hashId]);
	useEffect(() => {
		getBackupImage();
	}, [getBackupImage]);
	return isTransitioning || !backupImage ? (
		<Skeleton
			className={cn(
				className,
				"block h-full w-full rounded-2xl bg-faded-foreground/20 object-cover"
			)}
		/>
	) : (
		<ImageMedia
			src={backupImage.path}
			className={className || "relative"}

			imgClassName={imgClassName}
			fill={true}
			aspectRatio={aspectRatio}
			{...rest}

		/>
	);
}

function QueriedImage(
	props: MediaProps & {
		resource: string | FrontImageResource;
		collection?: ImageCollectionSlug;
	}
) {
	const {
		imgClassName,
		className,
		aspectRatio,
		collection: initCollection,
		resource: rs,
		...rest
	} = props;
	const [hover, setHover] = useState<boolean>(false);
	const collection = useMemo(() => typeof rs === "object" ? rs.relationTo : initCollection || "assets", [initCollection, rs]);
	const onEnter = useCallback(() => setHover(true), []);
	const onLeave = useCallback(() => setHover(false), []);
	const setCursorTheme = useCursor((store) => store.setCursorTheme);
	const resetCursorTheme = useCursor((store) => store.resetCursorTheme);
	const [image, setImage] = useState<RenderImageFields | null>(null);
	const tId = useMemo(() => (typeof rs === "string" ? rs : (typeof rs.value === "string" ? rs.value : rs.value.id)), [rs]);
	const select = useMemo(
		() =>
			({
				darkmode: true,
				src: true,
				alt: true,
				filename: true,
				caption: true,
				blurDataUrl: true,
				url: true,
				width: true, source: true,
				height: true,
			}) as Record<keyof RenderImageFields | "filename" | "url" | "source", true>,
		[]
	);
	const {
		data: resource,
		isLoading,
		isPending,
		isError,
		isEnabled
	} = useQuery({
		initialData: {
			darkmode: false,
			src: "",
			width: 0,
			height: 0,
			caption: "",
		} as RenderImageFields,
		queryKey: [collection, tId],
		queryFn: async () => {
			const res = await fetch(
				`${getClientSideURL()}/api/${collection}/${tId}${stringify({select}, {addQueryPrefix: true})}`
			);
			if (res.ok) {
				const docc = await res.json() as {
					id: string;

				} & Pick<FetchedImageDoc, "blurDataUrl" | "darkmode" | "src" | "width" | "height" | "filename" | "alt" | "source" | "caption">
				const src = docc.src;
				if (typeof src === "string") {
					return {
						src,
						width: docc.width,
						height: docc.height,
						caption: docc.caption,
						darkmode: docc.darkmode,
						alt: docc.alt,
						blurDataUrl: docc.blurDataUrl
					} satisfies RenderImageFields;
				}
			}
			throw new Error("Failed to fetch image");

		},
		enabled: typeof rs === "string" || !rs,
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		gcTime: 1.5 * 60 * 1000
	});
	useEffect(() => {
		if (image) {
			if (hover) {
				setCursorTheme(image.darkmode ? "dark" : "light");
			} else {
				resetCursorTheme();
			}
		}
	}, [hover, image, resetCursorTheme, setCursorTheme]);
	useEffect(() => {
		if (isEnabled) {
			if (!isLoading && !isError && resource) {
				setImage(resource);
			}
		}
	}, [isLoading, isEnabled, resource, isError]);
	return isLoading || isPending || !image ? (
		<div
			className={"block h-full w-full"}
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
		>
			<Skeleton
				className={cn(
					imgClassName,
					"block h-full w-full rounded-2xl bg-faded-foreground/20 object-cover"
				)}
			/>
		</div>
	) : (
		<ImageMedia
			priority={false}
			onMouseEnter={onEnter}
			onMouseLeave={onLeave}
			loading="lazy"
			className={className || "relative"}
			imgClassName={imgClassName}
			src={image.src}
			aspectRatio={aspectRatio}
			{...rest}
		/>
	);
}
