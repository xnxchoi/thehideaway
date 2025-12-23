"use client";
import {ImageCollectionSlug} from "@/types/payload-api-helpers";
import {Menu} from "@base-ui/react"
import * as m from "motion/react-m"
import type {ChangeEvent, ComponentProps, MouseEventHandler, ReactNode} from "react"
import {useCallback, useEffect, useState} from "react"

import {EASING} from "@/constants/animations"
import {cn} from "@/lib/utils"
import {MenuPopup, MenuPositioner} from "@/payload/components/Popover"
import {errorToast} from "@/payload/components/sonner"
import {Tab, TabIndicator, TabPanel, TabsList, TabsRoot} from "@/payload/elements/Tabs"
import type {HTMLMotionProps} from "motion/react"
import NextImage, {StaticImageData} from "next/image"
import {useGalleryFetch} from "../useGalleryFetch"
import {useDarkRoom} from "../ImageNode/DarkRoom"
import {
	ProcessedImage,
	RalueWithRelation,
	RenderImageFields,
	TabNames
} from "@/types/collections/imageCollections";
import {useAuth} from "@payloadcms/ui";
import {FetchedUnsplashImage, UnsplashFetchResult} from "@/payload/collections/Media/hooks/types";

type OnFetchProps = { file: File; unsplashMeta: FetchedUnsplashImage };
type FallbackImageInsertProps = {
	unsplash: UnsplashFetchResult;
	caption?: ReactNode;
};
export const InsertFallbackImage = ({
	                                    unsplash,
	                                    caption = "Add Cover"
                                    }: FallbackImageInsertProps) => {
	const {user} = useAuth();
	const onClick = useCallback(async () => {
		try {
			if (!user) {
				throw new Error("Please login to upload image");
			}
			if (!unsplash) {
				throw new Error("Failed to fetch image from Unsplash");
				return;
			}
			const imageResponse = await fetch(unsplash.form.url);
			if (imageResponse.ok) {
				const blob = await imageResponse.blob();
				const file = new File(
					[blob],
					`unsplash-${unsplash.form.source.identifier}.jpg`,
					{
						type: blob.type || "image/jpeg"
					}
				);
				if (file.size > Number(process.env.NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE)) {
					throw new Error("Image is too large, please try again");

				}
				// onInsert({
				//     file,
				//     provider: 'unsplash',
				//     collection: 'exMedia',
				//     data: {
				//         src: unsplash.form.url,
				//         alt: unsplash.form.alt,
				//         caption: unsplash.form.caption,
				//         source: {
				//             ...unsplash.form.source
				//         },
				//         author: user.id + "",
				//         metadata: {
				//             width: unsplash.fallback.width,
				//             height: unsplash.fallback.height
				//         }
				//     }
				// })
			}
		} catch (error) {
			console.error("Error uploading random Unsplash image:", error);
			errorToast("Failed to upload random image. Please try again.");
		}
	}, [unsplash, user]);

	return (
		<m.span
			className={cn(
				"ease relative rounded-xl border border-solid border-[currentColor] p-5 px-3.5 py-1 text-center text-sm! leading-normal! transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-off-background hover:bg-off-foreground hover:text-off-background"
			)}
			role="button"
			onClick={onClick}
		>
			{caption}
		</m.span>
	);
};
export type ImageMenuProps = {
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	enabled: boolean;
	open: boolean; setImage: (image: null | string | ProcessedImage) => void;
	setOpen: (open: boolean) => void;
	onClickRemove: () => void;
	openedTab?: TabNames; setOpenedTab: (tab: TabNames) => void;
	setActiveCollection: (collection: ImageCollectionSlug) => void;
};

export const ImageMenu = ({
	                          setOpen,
	                          open,
	                          enabled,
	                          setActiveCollection,
	                          openedTab = "gallery",
	                          setOpenedTab,
	                          setImage,
	                          onClickRemove,
	                          onChange
                          }: ImageMenuProps) => {
	const onOpenChange = useCallback((open: boolean) => {
		setOpen(open)
	}, [setOpen])

	// const [galleryFetchEnabled, setGalleryFetchEnabled] = useState(false);

	// useEffect(() => {
	//   setGalleryFetchEnabled(open && !disabled && openedTab === "gallery");
	//   return () => {
	//     setGalleryFetchEnabled(false);
	//   };
	// }, [open, openedTab, disabled]);
	return (
		<m.div
			initial={{
				opacity: 0
			}}
			animate={{
				opacity: 1
			}}
			transition={{
				type: "tween",
				ease: EASING.power3.out,
				duration: 0.2
			}}
			style={{
				height: "100%",
				justifyContent: "flex-start",
				display: "flex",
				alignItems: "flex-end"
			}}
		><Menu.Root open={open} onOpenChange={onOpenChange}>
			<Menu.Trigger
				data-themed={"border-color, color, background-color"}
				disabled={!enabled}
				className={cn(
					"border-r-solid-[.5px]! flex appearance-none items-center justify-center border-none bg-transparent p-0 text-sm! l=font-normal text-inherit! shadow-none transition-colors duration-200 ease-out-power3 outline-none select-none",
					"flex overflow-hidden leading-[1.2]")
				}
			>
        <span className={"text-sm leading-normal"}>
        Change cover
        </span>
			</Menu.Trigger>
			<Menu.Portal>
				<MenuPositioner
					align={"end"}
				>
					<MenuPopup className="relative max-w-[calc(100vw-24%)] p-0">
						<ImageModal setImage={setImage} setActiveCollection={setActiveCollection}
						            setOpenedTab={setOpenedTab} openedTab={openedTab}
						            onChange={onChange} onClickRemove={onClickRemove}/>
					</MenuPopup>
				</MenuPositioner>
			</Menu.Portal>
		</Menu.Root></m.div>
	);
};

const ImageModal = ({
	                    openedTab,
	                    setImage,
	                    onOpenChange,
	                    onChange,
	                    onClickRemove,
	                    setOpenedTab,
	                    setActiveCollection
                    }: {
	openedTab: TabNames;
	onOpenChange?: (openTab: TabNames | null) => void;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onClickRemove: () => void;
	setOpenedTab: (tab: TabNames) => void;
	setActiveCollection: (collection: ImageCollectionSlug) => void;
	setImage: (image: null | string | ProcessedImage) => void
}) => {
	const onOpenTabChange = useCallback((tab: null | TabNames) => {
		setActiveCollection(tab === "unsplash" || tab === "url" ? "exMedia" : tab === "upload" || tab === "personal" ? "userMedia" : "assets");
		setOpenedTab(tab || "gallery");
		onOpenChange?.(tab)
	}, [onOpenChange, setActiveCollection, setOpenedTab]);

	return <TabsRoot value={openedTab}
	                 onValueChange={onOpenTabChange}>

		<TabsList

			slots={<RemoveImageButton
				onClick={onClickRemove}/>

			}
		>
			<Tab
				value="gallery"
			>
				Gallery
			</Tab>
			<Tab
				value="upload"
			>
				Upload
			</Tab>
			<Tab
				value="unsplash"
			>
				Unsplash
			</Tab>
			<TabIndicator/>
		</TabsList>

		<TabPanel value="gallery">
			<ImageGallery setImage={setImage}/>
		</TabPanel>
		<TabPanel value="upload">
			<UploadButton onChange={onChange}/>
		</TabPanel>
		<TabPanel
			className={
				"relative flex h-32 shrink-0 grow-0 items-center justify-center -outline-offset-1 data-hidden:hidden"
			}
			value="unsplash"
		></TabPanel>
	</TabsRoot>
}

export const ImageGallery = ({enabled: galleryFetchEnabled = true, setImage}: {
	enabled?: boolean;
	setImage: (image: null | string | ProcessedImage) => void
}) => {

	const {
		fetchNextPage,
		isEnabled,
		isError,
		isFetching,
		isFetchingNextPage,
		data
	} = useGalleryFetch(galleryFetchEnabled);
	return <> {isFetching ? (
		<div>Loading...</div>
	) : ((!isEnabled || isError) && <div>Error!</div>) || (
		<div
			className="flex w-full flex-wrap content-start bg-muted-faded-background/30 px-[12px] py-0">
			{data &&
				((data.pages.length ?
					data.pages.map((r, i) => (

						r.totalDocs > 0 ? (
							r.docs.map((c, idx) => (
								<div className={"relative w-full flex flex-col gap-px p-2"}
								     key={`pages-${idx}`}>
									{c.items.map((cv, ii) => (
										<ImageInsert itemValue={cv.value} data={cv.data}
										             setImage={setImage}
										             key={`item-${idx}-${ii}`}/>))}
								</div>))) : <></>
					))
					: <div>{":("}</div>)) || <div>Empty!</div>}
		</div>)}</>
}
const ImageInsert = ({
	                     onClick,
	                     className,
	                     ref,
	                     onSelect,
	                     itemValue, data,
	                     figureClassName, setImage,
	                     ...props
                     }: ComponentProps<"div"> & {
	itemValue: RalueWithRelation;
	data: RenderImageFields;
	setImage: (image: string | ProcessedImage | null) => void;
	figureClassName?: string;
}) => {

	const {alt, caption, darkmode, src, width, height,} = data;
	// eslint-disable-next-line react-hooks/preserve-manual-memoization
	const onClickCallback: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
		onClick?.(e);
		setImage({
			alt,
			darkmode,
			src: typeof src === "string" ? src : src.src,
			width,
			height,
			url: typeof src === "string" ? src : src.src
		})
	}, [onClick, setImage,])
	return <div
		className={cn("w-[25%] p-1.5 relative", className)}
		role="button"
		onClick={onClickCallback}
		{...props}
	>
		{src ?
			<figure
				className={cn("w-full relative m-0 h-[64px] rounded-[4px] overflow-hidden transition-[opacity,background-color] duration-200 ease-out-power2 hover:opacity-85 hover:bg-muted-faded-background", figureClassName)}>
				<NextImage
					unoptimized={true}
					preload={false}
					src={src}
					alt={alt || ""}
					fill={true}
					className={
						"position-[center_60%] block w-full absolute inset-0 object-cover"
					}
				/>
				{caption && <figcaption
                    className={"right-[.5em] bottom-[.05em] flex h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline"}>{caption}</figcaption>}
			</figure> : null}
	</div>
}
export const RemoveImageButton = ({
	                                  onClick,
	                                  className,
	                                  children,
	                                  ...rest
                                  }: ComponentProps<"button">) => {
	return <button
		className={cn("relative h-fit w-22 appearance-none rounded-md border! border-muted-faded-foreground/0 bg-transparent px-2 py-0 break-keep whitespace-nowrap text-muted-faded-foreground/60 transition-colors duration-300 ease-out-power2! before:inset-x-0 hover:border-muted-faded-foreground/80 hover:text-muted-faded-foreground", className)}
		onClick={onClick}
		{...rest}
	>
		{children || <>Remove</>}
	</button>
}
export const UploadButton = ({onChange, className, ...rest}: HTMLMotionProps<"span">) => {

	return <m.span
		className={cn(
			"relative flex h-14 w-3/4 items-center justify-center rounded-[35px] border border-solid border-muted-faded-foreground/80 p-5 px-3.5 py-1 text-center! leading-normal text-faded-foreground/90 transition-[z-index,opacity,border-color,background-color,color] duration-200 ease-out-power2 hover:border-muted-faded-foreground/30 hover:bg-faded-foreground hover:text-faded-background", className
		)}
		data-themed={"opacity,border-color,background-color,color"}
		role="button"
		{...rest}
	>
		<input
			id={"user_settings_photo_file"}
			name={"user_settings[photo][file]"}
			className={cn(
				"absolute! inset-0 z-10 h-full w-full cursor-none! overflow-hidden opacity-0"
			)}
			onChange={onChange}
			accept="image/*"
			type={"file"}
		/>
		<label
			className={
				"flex w-fit cursor-none! items-center font-sans!"
			}
			htmlFor="user_settings_photo_file"
		>
			Upload File
			<svg
				className="relative inline-block w-auto cursor-none! border-none! bg-transparent! transition-colors duration-200 ease-out-power2! outline-none!"
				viewBox="0 0 20 20"
				fill="none"
				height="18"
			>
				<path
					xmlns="http://www.w3.org/2000/svg"
					d="M16.3,8.2C15.9,5.3,13.2,3,10,3C7.4,3,5.2,4.5,4.2,6.6C1.8,7.2,0,9.2,0,11.7c0,3,2.5,5.3,5.5,5.3 c0.6,0,1-0.4,1-1c0-0.6-0.4-1-1-1c-2,0-3.5-1.5-3.5-3.3c0-1.6,1.3-3,3-3.2c0.4,0,0.7-0.3,0.8-0.6C6.4,6.2,8,5,10,5 c2.5,0,4.4,1.9,4.4,4.1c0,0.6,0.4,1,1,1c1.5,0,2.6,1.1,2.6,2.4c0,1.3-1.1,2.4-2.6,2.4c-0.6,0-1,0.4-1,1c0,0.6,0.4,1,1,1 c2.5,0,4.6-1.9,4.6-4.4C20,10.4,18.4,8.7,16.3,8.2z"
					fill={"currentColor"}
				/>
			</svg>
		</label>
	</m.span>
}
