import {getPayload, PaginatedDocs, Payload, Where} from "payload"

import configPromise from "@payload-config"
import {PostsSelect} from "@/payload-types"
import {ArticleOverview, AuthorSingle} from "../post-types"
import {ReqArticle} from "../post-types"
import {cache} from "react"
import {getSeriesPostBookMarks} from "./getSeriesPostBookmarks"

/**
 * @param limit - The number of posts to return
 * @param page - The page number to return
 * @param where - The where clause to filter the posts
 * @param sort - The sort clause to sort the posts
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 */
export type QuerySeriesPostOverviewParams = {
	limit?: number
	page?: number
	where?: Where
	sort?: string
	overrideAccess?: boolean
	select?: PostsSelect
}
/**
 * A wrapper function to streamline the querying process.
 * 1) We query for the latest posts
 * 2) For each returned post, we query for the author info - label, name and slug
 * 3) We return the posts with the author info
 * @param limit - The number of posts to return; default 10
 * @param page - The page number to return; default 1
 * @param where - The where clause to filter the posts; default empty
 * @param sort - The sort clause to sort the postsl; default descending by published date
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export const querySeriesPostOverview = cache(
	async ({
		limit = 10,
		page = 1,
		where = {},
		sort = "-publishedAt",
		overrideAccess = true,
		select = {},
	}: QuerySeriesPostOverviewParams): Promise<ArticleOverview[]> => {
		// 1) Get the payload instance
		const payload = await getPayload({config: configPromise})
		const baseSelect: PostsSelect = {
			title: true,
			publishedAt: true,
			image: true,
			subtitle: true,
			slug: true,
			author: true,
			locked: true,
			category: true,

			...select,
		}
		// 2) Query for the posts
		return await queryOverviewSeries({
			payload,
			params: {limit, page, where, sort, overrideAccess, select: baseSelect},
		}).then((posts) => posts.docs)
	},
)

/**
 * A wrapper function to streamline the querying process.
 * 1) We query for the latest posts
 * 2) For each returned post, we query for the author info - label, name and slug
 *  todo merge the query into one by setting defaultPopulate config on the members collection
 *
 * 3) We return the posts with the author info
 * @param limit - The number of posts to return; default 10
 * @param page - The page number to return; default 1
 * @param where - The where clause to filter the posts; default empty
 * @param sort - The sort clause to sort the postsl; default descending by published date
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 */
export const paginatedSeriesPosts = async (
	params: QuerySeriesPostOverviewParams,
): Promise<PaginatedDocs<ArticleOverview>> => {
	// 1) Get the payload instance
	const payload = await getPayload({config: configPromise})
	return queryOverviewSeries({payload, params})
}

type OveerViewParams = { payload: Payload; params: QuerySeriesPostOverviewParams }
export const queryOverviewSeries = cache(
	async ({
		payload,
		params: {
			limit = 10,
			page = 1,
			where = {},
			sort = "-publishedAt",
			overrideAccess = true,
			select = {},
		},
	}: OveerViewParams): Promise<PaginatedDocs<ArticleOverview>> => {
		const baseWhere: Where & { and: Where[] } = {
			and: [
				{
					_status: {
						equals: "published",
					},
				},
			],
		}
		for (const [key, value] of Object.entries(where)) {
			if (key === "and") {
				baseWhere.and.push(...(value as Where[]))
			} else if (key === "or") {
				baseWhere.and.push({
					or: (value as Where[]).map((w) => ({
						...w,
					})),
				})
			} else {
				baseWhere.and.push({[key]: value})
			}
		}
		const baseSelect: PostsSelect = {
			title: true,
			publishedAt: true,
			image: true,
			subtitle: true,
			slug: true,
			author: true,
			locked: true,
			category: true,
			...select,
		}
		// 2) Query for the posts
		const foundPosts: PaginatedDocs<ReqArticle> = (await payload.find({
			collection: "posts",
			limit,
			page,
			where: baseWhere,
			sort,
			overrideAccess,
			select: baseSelect,
		}).catch((e) => {
			console.error({
				message: `Error while retrieving post overview`,
				error: e,
			})
			return {
				docs: [],
				totalDocs: 0,
				totalPages: 0,
				page: 0,
				hasNextPage: false,
				hasPrevPage: false,
				nextPage: 0,
				prevPage: 0,
				pagingCounter: 0,
				limit: 0,
			}
		})) as PaginatedDocs<ReqArticle>
		// 3) For each post, query for the author info
		const posts: ArticleOverview[] = (await Promise.all(
			foundPosts.docs.flatMap(async (post) => {
				const authorID = post.author
				if (!authorID || typeof authorID !== "number") {
					return []
				}
				const author = await payload.findByID({
					collection: "users",
					id: authorID,
					select: {
						name: true,
						slug: true,
						displayUsername: true,

					},
				}).then((r) => {
					return {
						...r,
						displayUsername: r.displayUsername ?? r.name,

					} as AuthorSingle
				}).catch((e) => {
					console.error({
						message: `Error while retrieving author info`,
						error: e,
					})
					return null
				})
				if (!author) {
					return []
				}
				const bookmarks = await getSeriesPostBookMarks({payload, id: `${post.id}`})
				const finalPost: ArticleOverview = {
					...post,
					author: author,
					category: post.category as {
						title: string
						id: string
					},
					...(bookmarks instanceof Error
						? {bookmarks: [] as string[], bookmarksCount: 0}
						: {
							bookmarks: bookmarks.bookmarks,
							bookmarksCount: bookmarks.count,
						}),
				}
				return finalPost
			}),
		)) as ArticleOverview[]
		const {docs: _, ...rest} = foundPosts
		return {
			docs: posts,
			...rest,
		}
	},
)
