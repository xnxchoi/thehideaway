"use server";
import {getImageMedia} from "@/payload/collections/Posts/api/getImageMedia";
import {postOverviewSelect} from "@/payload/collections/Posts/api/queryBase";
import {OverviewSlugs} from "@/types/collections/index";
import {CategoryOverview, TagOverview} from "@/types/collections/meta-collections";
import {userOverviewSelect} from "@/types/collections/users";

import configPromise from "@payload-config";
import {BasePayload, FindArgs, FindOneArgs, getPayload, PaginatedDocs, SelectType} from "payload";
import {cache} from "react";
import {PostOverview} from "../../../../types/collections/posts";
import {getPostBookMarks} from "./getPostBookmarks";

/**
 * @param limit - The number of posts to return
 * @param page - The page number to return
 * @param where - The where clause to filter the posts
 * @param sort - The sort clause to sort the posts
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 */
export type QueryParams = Omit<FindArgs, "collection" | "select"> & {
	overrideAccess?: boolean
	select?: SelectType
}
export type QueryOverviewParams = Omit<QueryParams, "select">

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
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export const queryPostOverviews = cache(async ({
	                                               limit = 10,
	                                               page = 1,
	                                               where,
	                                               sort = ["-updatedAt", "-publishedAt"],
	                                               overrideAccess = true,
                                               }: QueryOverviewParams) => {
	// 1) Get the payload instance
	const select = postOverviewSelect()
	// 2) Query for the posts
	return await getPostOverviews({
		limit, page, where, sort, select,
	}).then(r => r)
});

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
export const paginatedPosts = async (
	params: QueryOverviewParams
) => {
	// 1) Get the payload instance
	return await queryPostOverviews({...params,});
};

type OveerViewParams = { params: QueryOverviewParams };
export const queryOverview = cache(async <T extends OverviewSlugs, F extends Omit<QueryOverviewParams, "where">>({
	                                                                                                                 params: {
		                                                                                                                 limit = 10,
		                                                                                                                 page = 1,
		                                                                                                                 sort = ["-updatedAt", "-publishedAt"],
		                                                                                                                 overrideAccess = true,
		                                                                                                                 ...props
	                                                                                                                 },
	                                                                                                                 collection
                                                                                                                 }: {
		collection: T;
		params: F & ({ where: NonNullable<QueryOverviewParams["where"]> } | { id: string })
	}) => {
		const payload = await getPayload({config: configPromise});
		if ("id" in props) {
			const {id} = props;

		} else {
			const {where} = props;
		}

	}
);
export const queryPostsByIDs = cache(
	async ({
		       ids
	       }: {
		ids: string[];
	}): Promise<PaginatedDocs<PostOverview>> => {
		return await getPostOverviews({
			where: {
				id: {
					in: ids
				}
			},
		})

	}
);
export const getPostOverviews = async <T extends Omit<FindArgs, "collection" | "locale" | "select">>
({
	 where,

 }: T) => {
	"use cache"
	const payload = await getPayload({config: configPromise});

	const {
		hasNextPage,
		hasPrevPage,
		nextPage, docs, pagingCounter,
		prevPage, totalDocs, totalPages, page, limit,
	} = await payload
		.find({
			collection: "posts",
			where,
			select: {slug: true}
			,
			overrideAccess: true,

		}).then(r => r as PaginatedDocs<{ id: string; slug: string; }>)
		.catch((e) => {
			console.error({
				message: `Error while retrieving post overview`,
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
			} as PaginatedDocs<{ id: string; slug: string }>
		});
	const newpr = docs.map(async (r) => await getPostOverview({payload, id: r.id}))
	const fp = await Promise.allSettled(newpr);
	return {
		page,
		hasNextPage,
		hasPrevPage,
		nextPage,
		prevPage,
		totalDocs,
		totalPages,
		limit,
		pagingCounter,
		docs: fp.filter(r => r.status === "fulfilled").map(r => r.value)
	} satisfies PaginatedDocs<PostOverview>;
}
export const getPostOverview = cache(async <T extends Omit<FindOneArgs, "collection" | "locale" | "id" | "where">>({
	                                                                                                                   payload,
	                                                                                                                   id,
	                                                                                                                   ...rests
                                                                                                                   }: T & {
	payload: BasePayload;
	id: string
}) => {
	const r = await payload.findByID({
		collection: "posts",
		id,
		select: postOverviewSelect(),
		...rests
	});
	const bookres = await getPostBookMarks({id: r.id});
	const authorRes = await getUserOverview(typeof r.author === "string" ? r.author : r.author.id);
	const image = await getImageMedia({payload, post: r});
	return {
		...r,
		image,
		author: authorRes,
		tagged: (r.tagged || []) as TagOverview[],
		publishedAt: r.publishedAt as string,
		authority: typeof r.authority === "number" ? r.authority : 0,
		allowList: r.allowList?.map(r => typeof r === "string" ? r : r.id) || [],
		locked: r.locked || false,
		category: r.category as CategoryOverview,
		bookmarks: bookres?.bookmarks || [],
		bookmarksCount: bookres?.count || 0,
	} as PostOverview
})
export const getUserOverview = cache(async (authorID: string) => {
	const payload = await getPayload({config: configPromise});
	return await payload
		.findByID({
			collection: "users",
			overrideAccess: true,
			id: authorID,
			select: userOverviewSelect()
		})
		.then((r) => {
			return {
				...r,
			}
		})
		.catch((e) => {
			console.error({
				message: `Error while retrieving author info`,
				error: e
			});
			throw new Error("Author not found");
		});
});
