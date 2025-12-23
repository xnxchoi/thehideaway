import type {Compilation} from "@/payload-types"
import type {Flatten} from "@/utilities/typeUtilities"
import type {CollectionSlug, DataFromCollectionSlug} from "payload"

export type ImageCollectionSlug = Extract<
	CollectionSlug,
	"assets" | "userMedia" | "exMedia"
>;

export type ImageCollection = DataFromCollectionSlug<ImageCollectionSlug>;

type ImageCoreKeys = "url" | "src" | "alt" |
	"darkmode";
type ImageMetaKeys = "caption" | "source" |
	"attribution"
type ImageDimensionKeys = "height" | "width"
type ImageSizesKey = | "sizes"
export type MandatedImageKeys =
	ImageCoreKeys;
export type ImageDocKeys =
	| "filename"
	| "mimeType"
	| ImageSizesKey | ImageDimensionKeys | ImageMetaKeys
	| "locked" | "allowList" | "authority"
	| "blurDataUrl"
	| "thumbnailURL" | MandatedImageKeys | "id";
export type FetchedCompilation<T extends (Flatten<Compilation["items"]>["relationTo"])> = {
	id: string;
	title: string;
	items: Array<
		{
			relationTo: T,
			value: T extends ImageCollectionSlug ? Pick<ImageCollection, "id" | "url" | "thumbnailURL" | "filename" | "mimeType" | "width" | "height" | "alt" | "caption"> & {
				disabled: boolean
			} : DataFromCollectionSlug<T>
		}>
}

export type DocWithId = {
	id: string;
	[x: string]: any;
}
export type PayloadFindFetch<T> = {
	docs: T[];
	hasNextPage: boolean;
	hasPrevPage: boolean;
	limit: number;
	nextPage: number | null;
	page: number;
	pagingCounter: number;
	prevPage: number | null;
	totalDocs: number;
	totalPages: number;
};
export type PayloadCreateResult<T extends CollectionSlug> = {
	doc: DataFromCollectionSlug<T>;
	message: string;
}
export type PayloadCreateFetch<T> = {
	doc: T;
	message: string;
}
