import {deltaOverviewSelect} from "@/payload/collections/Delta/api/queryDeltaOverview";
import {postOverviewSelect} from "@/payload/collections/Posts/api/queryBase";
import type {FrontEndCollections} from "@/stores/Routing/RP_Voyageur";
import {DeltaOverview} from "@/types/collections/delta";
import {ImageCollectionSlug, ProcessedImageDoc} from "@/types/collections/image-collections";
import {
	CategoryOverview,
	categoryOverviewSelect,
	TagOverview,
	tagOverviewSelect
} from "@/types/collections/meta-collections";
import {PostOverview} from "@/types/collections/posts";
import {UserOverview, userOverviewSelect} from "@/types/collections/users";
import {imageSelect} from "@/types/payload-api-selects";
import type {SelectFromCollectionSlug} from "node_modules/payload/dist/collections/config/types";
import {CollectionSlug} from "payload";

export const baseSelect: SelectFromCollectionSlug<FrontEndCollections> = {
	id: true,
	title: true,
	slug: true,
	updatedAt: true,
	publishedAt: true,
	author: true
};

export type OverviewSlugs = Extract<CollectionSlug, "users" | "posts" | ImageCollectionSlug | "delta" | "categories" | "tags">;
export type CollectionOverviewMap = {
	[x in OverviewSlugs]: x extends "users" ? UserOverview : x extends "posts" ? PostOverview :
		x extends "delta" ? DeltaOverview :
			x extends "tags" ? TagOverview :
				x extends "categories" ? CategoryOverview :
					x extends ImageCollectionSlug ? {
						relationTo: x;
						value: ProcessedImageDoc
					} : never

};
export type CollectionOverview<T extends OverviewSlugs = OverviewSlugs> = CollectionOverviewMap[T]
export const overviewSelectMap = {
	users: userOverviewSelect,
	posts: postOverviewSelect,
	tags: tagOverviewSelect,
	categories: categoryOverviewSelect,
	assets: imageSelect,
	media: imageSelect,
	userMedia: imageSelect,
	delta: deltaOverviewSelect
} as const
export type OverviewSelectorMap = {
	-readonly [x in OverviewSlugs]: ReturnType<(typeof overviewSelectMap)[x]>
}