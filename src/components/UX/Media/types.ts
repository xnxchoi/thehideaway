import type {StaticImageData} from "next/image"
import type {
	ElementType,
	Ref,
	ComponentPropsWithoutRef,
	ReactNode,
} from "react"

import type {Media as MediaType, UserMedia} from "@/payload-types"
import HTMLAttributes from "react"

export interface Props
	extends Omit<ComponentPropsWithoutRef<"div">, "resource" | "className"> {
	alt?: string
	className?: string
	fill?: boolean // for NextImage only
	htmlElement?: ElementType | null
	pictureClassName?: string
	imgClassName?: string
	onClick?: () => void
	onLoad?: () => void
	caption?: string | ReactNode
	loading?: "lazy" | "eager" // for NextImage only
	priority?: boolean // for NextImage only
	ref?: Ref<HTMLImageElement | HTMLVideoElement | null>
	resource?:
		| (Omit<UserMedia, "createdAt" | "updatedAt" | "id" | "author"> & {
		createdAt?: string
		updatedAt?: string
		id: string
	})
		| (Omit<MediaType, "createdAt" | "updatedAt" | "id" | "author"> & {
		createdAt?: string
		updatedAt?: string
		id: string
	})
		| string
		| number
		| null // for Payload media
	size?: string // for NextImage only
	src?: StaticImageData // for static media
	videoClassName?: string
}
