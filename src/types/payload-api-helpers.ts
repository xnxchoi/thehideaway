import type {Compilation} from "@/payload-types"
import {ImageCollection, ImageCollectionSlug} from "@/types/collections/image-collections";
import type {Flatten, RequiredFields} from "@/utilities/typeUtilities"
import {
	CollectionSlug,
	DataFromCollectionSlug,
	SelectType,
	TransformCollectionWithSelect,
	TypedCollectionSelect
} from "payload"

export type FetchedCompilation<T extends (NonNullable<Flatten<Compilation["items"]>>["relationTo"])> = {
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
type OPOP<T extends CollectionSlug> = Partial<DataFromCollectionSlug<T>>
type VVV<T extends CollectionSlug> = RequiredFields<OPOP<T>>
type FSVS<T extends DataFromCollectionSlug<CollectionSlug>> = RequiredFields<T>

export type PayloadFound<T extends CollectionSlug, K extends TypedCollectionSelect[T], > = K extends SelectType ? TransformCollectionWithSelect<T, K> : DataFromCollectionSlug<T>

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
