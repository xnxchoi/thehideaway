import {SurfSelect} from "@/payload-types";
import {CategoryOverview, TagOverview} from "@/types/collections/meta-collections";
import {AuthorOverview} from "@/types/collections/users";

import configPromise from "@payload-config";
import {getPayload, PaginatedDocs, Payload, Where} from "payload";
import {cache} from "react";

import type {ReqSurf, SurfOverview} from "../../../../types/collections/surf";
import {getSurfBookMarks} from "./getSurfBookmarks";

export type SurfOverviewSelect = {
	title: true
	publishedAt: true
	commentsEnabled: true
	source: true
	updatedAt: true
	content: true
	image: true
	slug: true
	author: true
	locked: true
	authority: true
	allowList: true
	category: true
	tagged: true
}
export const surfOverviewSelect = (): SurfOverviewSelect => ({
	title: true,
	publishedAt: true, content: true,
	image: true, updatedAt: true, commentsEnabled: true,
	tagged: true, source: true,
	slug: true,
	author: true,
	allowList: true,
	authority: true,
	locked: true,
	category: true,
})
/**
 * @param limit - The number of posts to return
 * @param page - The page number to return
 * @param where - The where clause to filter the posts
 * @param sort - The sort clause to sort the posts
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 */
export type QuerySurfOverviewParams = {
	limit?: number;
	page?: number;
	where?: Where;
	sort?: string;
	overrideAccess?: boolean;
	select?: SurfSelect;
};
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
export const querySurfOverview = cache(
	async ({
		       limit = 10,
		       page = 1,
		       where = {},
		       sort = "-publishedAt",
		       overrideAccess = true,
		       select = {}
	       }: QuerySurfOverviewParams): Promise<SurfOverview[]> => {
		// 1) Get the payload instance
		const payload = await getPayload({config: configPromise});
		const baseSelect: SurfSelect = {

			...select
		};
		// 2) Query for the posts
		return await queryOverview({
			payload,
			params: {limit, page, where, sort, overrideAccess, select: baseSelect}
		}).then((posts) => posts.docs);
	}
);

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
export const paginatedSurf = async (
	params: QuerySurfOverviewParams
): Promise<PaginatedDocs<SurfOverview>> => {
	// 1) Get the payload instance
	const payload = await getPayload({config: configPromise});
	return queryOverview({payload, params});
};

type OveerViewParams = { payload: Payload; params: QuerySurfOverviewParams };
export const queryOverview = cache(
	async ({
		       payload,
		       params: {
			       limit = 10,
			       page = 1,
			       where = {},
			       sort = "-publishedAt",
			       overrideAccess = true,
			       select = {}
		       }
	       }: OveerViewParams): Promise<PaginatedDocs<SurfOverview>> => {
		const baseWhere: Where & { and: Where[] } = {
			and: [
				{
					_status: {
						equals: "published"
					}
				}
			]
		};
		for (const [key, value] of Object.entries(where)) {
			if (key === "and") {
				baseWhere.and.push(...(value as Where[]));
			} else if (key === "or") {
				baseWhere.and.push({
					or: (value as Where[]).map((w) => ({
						...w
					}))
				});
			} else {
				baseWhere.and.push({[key]: value});
			}
		}
		const baseSelect: SurfSelect = {
			title: true,
			publishedAt: true,
			slug: true,
			tagged: true,
			updatedAt: true,
			author: true,
			locked: true,
			category: true,
			...select
		};
		// 2) Query for the surfs
		const foundSurfs: PaginatedDocs<ReqSurf> = (await payload
			.find({
				collection: "surf",
				limit,
				page,
				where: baseWhere,
				sort,
				overrideAccess,
				select: baseSelect
			})
			.catch((e) => {
				console.error({
					message: `Error while retrieving surf overview`,
					error: e
				});
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
					limit: 0
				};
			})) as PaginatedDocs<ReqSurf>;
		// 3) For each surf, query for the author info
		const surfs: SurfOverview[] = (await Promise.all(
			foundSurfs.docs.flatMap(async (surf) => {
				const authorID = surf.author;
				if (!authorID || typeof authorID !== "string") {
					return [];
				}
				const author = await payload
					.findByID({
						collection: "users",
						id: authorID,
						select: {
							name: true,
							slug: true,
							displayUsername: true
						}
					})
					.then((r) => {
						return {
							...r,
							displayUsername: r.displayUsername ?? r.name
						} as AuthorOverview;
					})
					.catch((e) => {
						console.error({
							message: `Error while retrieving author info`,
							error: e
						});
						return null;
					});
				if (!author) {
					return [];
				}
				const bookmarks = await getSurfBookMarks({
					payload,
					id: `${surf.id}`
				});
				const finalSurf: SurfOverview = {
					...surf,
					author: author,
					category: surf.category as CategoryOverview,
					tagged: surf.tagged ? (surf.tagged as Array<TagOverview>) : [],
					...(bookmarks instanceof Error
						? {bookmarks: [] as string[], bookmarksCount: 0}
						: {
							bookmarks: bookmarks.bookmarks,
							bookmarksCount: bookmarks.count
						})
				};
				return finalSurf;
			})
		)) as SurfOverview[];
		const {docs: _, ...rest} = foundSurfs;
		return {
			docs: surfs,
			...rest
		};
	}
);
