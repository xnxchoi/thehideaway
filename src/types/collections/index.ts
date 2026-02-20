import {postOverviewSelect} from "@/payload/collections/Posts/api/queryBase";
import {surfOverviewSelect} from "@/payload/collections/Surf/api/querySurfOverview";
import type {FrontEndCollections} from "@/stores/Routing/RP_Voyageur";
import {ImageCollectionSlug, ProcessedImageDoc} from "@/types/collections/image-collections";
import {
	CategoryOverview,
	categoryOverviewSelect,
	TagOverview,
	tagOverviewSelect
} from "@/types/collections/meta-collections";
import {PostOverview} from "@/types/collections/posts";
import {SurfOverview} from "@/types/collections/surf";
import {UserOverview, userOverviewSelect} from "@/types/collections/users";
import {imageSelect} from "@/types/payload-api-selects";
import {PagesSelect} from "@payload-types";
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

//|"albums"|"tracks"|"playlists"
export type OverviewSlugs = Extract<CollectionSlug, "users" | "posts" | "pages" | ImageCollectionSlug | "surf" | "categories" | "tags">;
export type CollectionOverviewMap = {
	[x in OverviewSlugs]: x extends "users" ? UserOverview : x extends "posts" ? PostOverview : x extends "pages" ? PostOverview :
		x extends "surf" ? SurfOverview :
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
	pages: (): PagesSelect => ({
		title: true,
		slug: true,
		id: true,

	}),
	surf: surfOverviewSelect
} as const
export type OverviewSelectorMap = {
	-readonly [x in OverviewSlugs]: ReturnType<(typeof overviewSelectMap)[x]>
}