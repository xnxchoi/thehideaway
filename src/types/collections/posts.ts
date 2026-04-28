import type {Post} from "@/payload-types";
import {SinglePostKeys, SinglePostSelector} from "@/payload/collections/Posts/api/queryBase";

import {CategoryOverview, TagOverview} from "@/types/collections/meta-collections";
import {AuthorOverview, AuthorSingle, RelUser} from "@/types/collections/users";
import {RalueAsDataWithRelation} from "@/types/collections/image-collections";
import {PayloadFound} from "@/types/payload-api-helpers";

export type PostOverview = {
	id: string;
	title: string;
	slug: string;
	subtitle: string;
	allowList: string[];
	publishedAt: string;
	updatedAt: string;
	locked?: boolean;
	authority?: number;
	image?: RalueAsDataWithRelation | null;
	author: AuthorOverview;
	category: CategoryOverview;
	tagged: TagOverview[];
	bookmarks: string[];
	bookmarksCount: number;
};

export type MediaReq = RalueAsDataWithRelation
export type FetchedPost = PayloadFound<"posts", SinglePostSelector>

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
	SinglePostKeys
> & {
	author: RelUser;
	category: CategoryOverview;
	tagged: Array<TagOverview>;
	publishedAt: string;
	image?: RalueAsDataWithRelation | null;
};
export type FocusedArticle = PostOverview &
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
	relatedPosts: PostOverview[];
	queuedIDs: string[];
	prev?: PostOverview;
	next?: PostOverview;
	/**
	 * Populated by queryPostBySlug when the viewer fails the audience gate:
	 * the first ~20% of the post body, sent so the Paywall surface can lure
	 * the reader without exposing the full essay.
	 */
	teaser?: FocusedArticle["content"] | null;
};
