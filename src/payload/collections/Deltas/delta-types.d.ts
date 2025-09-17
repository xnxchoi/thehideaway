import type {Category, Delta, Tag} from "@/payload-types"
import type {ArticleOverview, AuthorOverview} from "../Posts/post-types"

export type DeltaOverview = Omit<ReqDelta, "author"> & {
	author: AuthorOverview
	tags: TagOverview[];

	bookmarks: string[]
	bookmarksCount: number
}
/**
 *  Represents the actual API response-accurate type of fetching a {@link Delta} as of 2025-06-28.
 *
 * Fields that assuredly resolve have been accounted for via explicit typing.
 *
 * **Warning** this is only meant to be used for {@link queryDeltaOverview queryDeltaOverview}
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export type ReqDelta = Pick<Delta, "source" | "id" | "title" | "locked" | "content"> & {
	author: string | User
	category: {
		title: string
		id: string
	}
	tags:TagOverview[] | undefined|null;
	publishedAt: string

	slug: string
}


export type FocusedDelta = DeltaOverview &
	Pick<
		Delta,
		| "relatedDeltas"
		| "updatedAt"
		| "createdAt"
	>
export type SingleDelta = Omit<FocusedDelta, "author" | "relatedDeltas"> & {
	author: AuthorSingle
	disabled?: boolean
	relatedDeltas: (DeltaOverview | ArticleOverview)[]
	queuedIDs: string[]
}
export type TagOverview = Pick<NonNullable<Tag>,
	| 'title'
	| 'id'
	| 'slug'>
export type CatOverview = Pick<Category, "title" | "id" | "slug">