import type {Pick} from "@react-spring/three"
import type {UserOverview} from "./posts"
import type {ImageCollection, ImageCollectionSlug} from "../payload-api-helpers"
import type {
	ClientCollectionConfig,
	FieldLabelClientProps,
	FilterOptionsResult,
	StaticDescription,
	StaticLabel,
	UploadFieldClient,
	UploadFieldClientProps
} from "payload";
import type {ChangeEvent, ReactNode} from "react";
import type {MarkOptional} from "ts-essentials";
import {StaticImageData} from "next/image";
import {UnsplashFetchResult} from "@/payload/collections/Media/hooks/types";

export type TabNames = "gallery" | "unsplash" | "upload" | "url" | "personal"

export type ImageEssentialProps = {
	url?: string | null;
	width?: number | null;
	height?: number | null;
	mimeType?: string | null;
	filename?: string | null;
};
// export type ImageSizeNames = "og" | "square" | "thumbnail" | "small" | "medium" | "large" | "xlarge"

export type ImageProvider = Exclude<ImageCollection["source"]["provider"], "pexels">
export type ImageSource = {
	identifier: string; provider: ImageProvider; link?: string | null;
}
export type FetchedImage = Pick<ImageCollection, "url" | "width" | "height" | "caption" | "alt" | "darkmode" | "src" | "thumbnailURL" | "blurDataUrl">

type PayloadNativeProps = Pick<ImageCollection, PayloadSpecificKeys | "sizes">
type PayloadSpecificProps = PayloadNativeProps & { source: ImageSource }
export type FetchedImageDoc = FetchedImage & PayloadSpecificProps
export type ImageSizeNames = "thumb" | "card" | "content" | "content_wide" | "hero" | "og"

export type ResizedImageProps = {
	url?: string | null
	width?: number | null
	height?: number | null
	mimeType?: string | null
	filesize?: number | null
	filename?: string | null
}
export type ImageSizes = {
	[x in ImageSizeNames]?: ResizedImageProps
}

type PayloadSpecificKeys = "id" | "filename" | "mimeType"
export type PayloadImageKeys = keyof FetchedImageDoc;
export type BaseImageSelect = Record<PayloadImageKeys, true>
export type ProcessedImage = FetchedImage & {
	src: string; url: string;
}
export type ProcessedImageDoc = ProcessedImage & PayloadSpecificProps

export type ImageTabs = {
	tabs: TabNames[]; openedTab: TabNames | null; setTab: (tab: TabNames | null) => void;
}
export type PopulatedDocs = {
	relationTo: ImageCollectionSlug
	value: FetchedImageDoc
}[]
export type ArticleCoverProps = UploadFieldClientProps & {
	readonly user: UserOverview
	readonly relationTo: ImageCollectionSlug[] | ImageCollectionSlug
	readonly AfterInput?: React.ReactNode
	readonly allowCreate?: boolean
	/**
	 * Controls the visibility of the "Create new collection" button
	 */
	readonly api?: string
	readonly BeforeInput?: ReactNode
	readonly className?: string
	readonly collection?: ClientCollectionConfig
	readonly customUploadActions?: ReactNode[]
	readonly Description?: ReactNode
	readonly description?: StaticDescription
	readonly displayPreview?: boolean
	readonly Error?: ReactNode
	readonly filterOptions?: FilterOptionsResult
	readonly hasMany?: boolean
	readonly hideRemoveFile?: boolean
	readonly isSortable?: boolean
	readonly Label?: ReactNode
	readonly label?: StaticLabel
	readonly labelProps?: FieldLabelClientProps<MarkOptional<UploadFieldClient, "type">>
	readonly localized?: boolean
	readonly maxRows?: number
	readonly onChange?: (e: ChangeEvent) => void
	readonly path: string
	readonly readOnly?: boolean
	readonly required?: boolean
	readonly serverURL?: string
	readonly showError?: boolean
	readonly style?: React.CSSProperties
	readonly value?: RalueAsDataWithRelation | null
} & {
	readonly value?: null | RalueAsDataWithRelation
	readonly fallback?: null | UnsplashFetchResult
}
export type RalueWithRelation = {
	relationTo: ImageCollectionSlug
	value: string
}
export type RalueAsDataWithRelation = {
	relationTo: ImageCollectionSlug
	value: ProcessedImageDoc
}
export type RenderImageFields = {
	src: string | StaticImageData;
	width?: number | null;
	height?: number | null;
	darkmode: boolean;
	alt: string;
	caption?: string | null;
	blurDataUrl?: string | null;
	sizes?: ImageSizes
};