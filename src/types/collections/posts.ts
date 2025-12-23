import type {Post, User} from "@/payload-types";
import {TagOverview} from "@/types/collections/delta";
import {RalueAsDataWithRelation} from "@/types/collections/imageCollections";

export type ArticleOverview = Omit<ReqArticle, "author"> & {
	author: AuthorOverview;

	bookmarks: string[];
	bookmarksCount: number;
};

export type MediaReq = RalueAsDataWithRelation
/**
 *  Represents the actual API response-accurate type of fetching a {@link Post} as of 2025-05-28.
 *
 * Fields that assuredly resolve have been accounted for via explicit typing.
 *
 * **Warning** this is only meant to be used for {@link queryPostOverview queryPostOverview}
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export type ReqArticle = Pick<
	Post,
	| "id"
	| "title"
	| "locked"
	| "authority"
	| "allowList"
	| "subtitle"
	| "updatedAt"
> & {
	author: RelUser;
	category: {
		title: string;
		id: string;
		slug: string;
	};
	tagged: Array<TagOverview>;
	publishedAt: string;
	image?: RalueAsDataWithRelation | null;
	id: string;
	slug: string;
};
export type AuthorOverview = Pick<
	User,
	"name" | "slug" | "displayUsername" | "id" | "image"
>;
export type UserOverview = AuthorOverview;
export type RelUser = AuthorOverview | string;
export type RelAuthor = RelUser;
export type AuthorSingle = AuthorOverview;
export type FocusedUser = AuthorOverview;
export type FocusedArticle = ArticleOverview &
	Pick<
		Post,
		| "content"
		| "allowList"
		| "authority"
		| "relatedPosts"
		| "updatedAt"
		| "createdAt"
	>;
export type SingleArticle = Omit<FocusedArticle, "author" | "relatedPosts"> & {
	author: AuthorSingle;
	disabled?: boolean;
	relatedPosts: ArticleOverview[];
	queuedIDs: string[];
	prev?: ArticleOverview;
	next?: ArticleOverview;
};
