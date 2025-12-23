"use client";
import {EASING} from "@/constants/animations"
import {cn} from "@/lib/utils"
import {
	RP_InternalImageNodeData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {BLUR_COMMAND} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {COMMAND_PRIORITY_EDITOR} from "lexical";
import * as m from "motion/react-m"
import Image from "next/image";
import {ComponentProps, RefObject, useEffect, useMemo} from "react"

const NextImage = m.create(Image);
export type RPImageFrameProps = ComponentProps<"div"> & {
	image: RP_InternalImageNodeData
	darkmode: boolean;
	imageCacheTag?: string;
	hover: boolean
	resizing?: boolean;
	imageRef: RefObject<HTMLImageElement>
}
export const RPImageFrame = ({
	                             imageCacheTag, image, darkmode, imageRef,
	                             hover, resizing = false
                             }: RPImageFrameProps) => {

	const src = useMemo(() => !!imageCacheTag ? `${image.src}${image.src.includes("?") ? "&" : "?"}${encodeURIComponent(imageCacheTag)}` : image.src, [imageCacheTag, image.src])

	return <m.div
		initial={{
			visibility: "hidden",

			opacity: 0
		}}
		animate={{
			visibility: "visible",

			opacity: 1,
			transition: {
				duration: 0.2,
				ease: EASING.power3.in
			}
		}}
		exit={{
			visibility: "hidden",

			opacity: 0,
			transition: {
				duration: 0.2,
				ease: EASING.power3.out
			}
		}}
		className={cn(
			"relative min-h-full w-full overflow-hidden rounded-[6px]"
		)}
	>
		<div
			className={cn(
				"absolute inset-0 z-10 transition-[backdrop-filter] delay-50 duration-150 ease-out-power4",
				!resizing &&
				hover &&
				"backdrop-blur-xs backdrop-brightness-80"
			)}
			style={{
				objectFit: "cover"
			}}
		/>
		<m.figure className={"m-0"}>
			<picture>
				<NextImage
					ref={imageRef}
					alt={""}
					className={
						"absolute inset-0 block max-h-[200px] min-h-[30vh] w-full object-cover"
					}
					dragListener={false}

					priority={false}
					quality={100}
					unoptimized={true}
					src={src}
					width={image.width || undefined}
					fill={true}
				/>
			</picture>

			{
				!!image.caption && (
					<input
						data-dark={darkmode}
						className={cn(
							"right-[.5em] bottom-[.05em]  h-[1em] w-full items-center justify-end bg-transparent p-[1.5em] underline",
							"text-foreground", image.showCaption ? "flex" : "hidden"
						)}
						value={image.caption}

					/>

				)}
		</m.figure>
	</m.div>

}
