import type {User, Post} from "@/payload-types"
import {querySeriesPostOverview} from "./api/querySeriesPostOverview"
import type {Users} from "@/payload/collections/Users/index"
import type {Media} from "@/payload-types"

export type ArticleOverview = Omit<ReqArticle, "author"> & {
	author: AuthorOverview

	bookmarks: string[]
	bookmarksCount: number
}

export type MediaReq = Pick<
	Media,
	| "id"
	| "thumbnailURL"
	| "url"
	| "darkmode"
	| "mimeType"
	| "width"
	| "height"
	| "filename"
>
/**
 *  Represents the actual API response-accurate type of fetching a {@link Post} as of 2025-05-28.
 *
 * Fields that assuredly resolve have been accounted for via explicit typing.
 *
 * **Warning** this is only meant to be used for {@link querySeriesPostOverview queryPostOverview}
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export type ReqArticle = Pick<Post, "id" | "title" | "locked" | "subtitle"> & {
	author: string | User
	category: {
		title: string
		id: string
	}
	publishedAt: string
	image?: MediaReq | null
	slug: string
}
export type AuthorOverview = Pick<
	User,
	"name" | "slug" | "displayUsername" | "id"
>
export type AuthorSingle = AuthorOverview
export type FoundArticle = ArticleOverview
export type FocusedArticle = ArticleOverview &
	Pick<
		Post,
		| "content"
		| "allowList"
		| "authority"
		| "relatedPosts"
		| "updatedAt"
		| "createdAt"
	>
export type SingleArticle = Omit<FocusedArticle, "author" | "relatedPosts"> & {
	author: AuthorSingle
	relatedPosts: ArticleOverview[]
	queuedIDs: string[]
}
