"use server";
import {draftMode} from "next/headers";
import {getPayload, Payload} from "payload";
import configPromise from "@payload-config";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {cache} from "react";
import {ArticleOverview, AuthorSingle, SingleArticle} from "../post-types";
import {authClient} from "@/lib/auth/client";
import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {getSeriesPostBookMarks} from "./getSeriesPostBookmarks";
import {Post} from "@/payload-types";
import {queryOverviewSeries} from "./querySeriesPostOverview";

export const querySeriesPostBySlug = cache(
	async ({
		slug,
	}: {
		slug: string;
	}): Promise<{ post: SingleArticle } | null> => {
		const {isEnabled: draft} = await draftMode();

		const payload = await getPayload({config: configPromise});
		const user = await authClient.getSession();
		const se = user?.data?.user ?? null;

		const result = await payload.find({
			collection: "posts",
			draft,
			limit: 1,
			overrideAccess: true,
			pagination: false,
			where: {
				slug: {
					equals: slug,
				},
			},
			select: {
				title: true,
				subtitle: true,
				content: true,
				slug: true,
				relatedPosts: true,
				category: true,
				allowList: true,
				authority: true,
				author: true,
				publishedAt: true,
				locked: true,
				updatedAt: true,
				createdAt: true,
				image: true,
			},
		}).catch((e) => {
			console.error({
				message: `Error while retrieving post by slug ${slug}`,
				error: e,
			});
			return null;
		});
		if (!result || !result.docs || result.docs.length < 1) {
			return null;
		}
		// 1) Get the post
		const post = result.docs[0];
		if (!post) {
			return null;
		}
		// 2) Get the author info
		if (!post.author || !post?.slug || !post.publishedAt) {
			return null;
		}
		const finalPost: SingleArticle = {
			...post,
			author: null!,
			bookmarks: [] as string[],
			publishedAt: post.publishedAt,
			image: null,
			bookmarksCount: 0,
			slug: post.slug,
			category: post.category as { title: string; id: string },
			queuedIDs: null!,
			relatedPosts: null!,
		};
		const bookmarks = await getSeriesPostBookMarks({
			payload,
			id: `${post.id}`,
		});
		if (bookmarks instanceof Error) {
			console.error({
				message: `Error while retrieving bookmarks for post ${post.id}`,
				error: bookmarks,
			});
			finalPost.bookmarks = [] as string[];
			finalPost.bookmarksCount = 0;
		} else {
			finalPost.bookmarks = bookmarks.bookmarks;
			finalPost.bookmarksCount = bookmarks.count;
		}
		const author: AuthorSingle | null = await payload.findByID({
			collection: "users",
			id: post.author as string,
			overrideAccess: true,
			select: {
				name: true,
				slug: true,
				displayUsername: true,
			},
		}).then((r) => {
			return {
				...r,
				displayUsername: r.displayUsername ?? r.name,
			} as AuthorSingle;
		}).catch((e) => {
			console.error({
				message: `Error while retrieving author info`,
				error: e,
			});
			return null;
		});
		//This is a rather draconian approach, but I'd like (for now) to not deal with "author may be undefined"
		if (!author) {
			return null;
		}
		finalPost.author = author;
		// 3) Get the related posts

		const {queuedIDs, relatedPosts} = await queryRelatedPostsInSeries({
			payload,
			postID: post.id,
			relatedPosts: post.relatedPosts,
			limit: 15,
		});
		finalPost.queuedIDs = queuedIDs;
		finalPost.relatedPosts = relatedPosts;
		const {relatedPosts: __d, author: __, ...rest} = post;
		if (post.locked) {
			//We consider the default value to be 1, representing an authenticated user; otherwise locked is usesless as a property
			const auth = post.authority ?? 1;
			if (
				se &&
				se.id &&
				se.role &&
				(roleToAuthority(se.role as RP_Roles) >= auth ||
					post.allowList?.some(
						(r) => `${typeof r === "string" ? r : r.id}` === se.id,
					))
			) {
				finalPost.content = post.content;
			} else {
				finalPost.content = {
					root: {
						type: "paragraph",
						children: [],
						direction: "ltr",
						format: "start",
						indent: 0,
						version: 0,
					},
				};
			}
		}
		return {
			post: finalPost,
		};
	},
);
export const queryRelatedPostsInSeries = cache(
	async ({
		payload,
		postID,
		relatedPosts,
		limit = 15,
	}: {
		payload: Payload;
		postID: string;
		relatedPosts: Post["relatedPosts"];
		limit?: number;
	}): Promise<{ queuedIDs: string[]; relatedPosts: ArticleOverview[] }> => {
		//Now we first query for the posts to show in the "More Like This" sidebar
		const relatedPost: ArticleOverview[] = [] as ArticleOverview[];

		const nextSlugs: string[] = [];
		const relatedIDs: string[] = [];
		const displayPostLimit = 5;
		//Query for a total of 3 posts
		//1) We query for the IDs we got from related posts - sliced by (0,3)
		if (
			relatedPosts &&
			Array.isArray(relatedPosts) &&
			relatedPosts.length > 0
		) {
			const ids = relatedPosts.flatMap((r) => {
				const id =
					typeof r === "string"
						? r
						: typeof r === "object" && r.id
							? r.id
							: null;
				if (!id) return [];
				return id;
			});
			relatedIDs.push(...ids);
			const directlyRelatedPosts = await queryOverviewSeries({
				payload,
				params: {
					where: {
						id: {
							in: ids,
						},
					},
					limit: displayPostLimit,
				},
			});
			if (directlyRelatedPosts && directlyRelatedPosts.totalDocs > 0) {
				for (const r of directlyRelatedPosts.docs) {
					relatedPost.push(r);
					relatedIDs.push(r.id);
				}
			}
			if (relatedPost.length < displayPostLimit) {
				const relPosts = await queryOverviewSeries({
					payload,
					params: {
						where: {
							id: {
								not_in: relatedIDs,
							},
						},
						limit: displayPostLimit - relatedPost.length,
					},
				});
				if (relPosts && relPosts.docs && relPosts.docs.length > 0) {
					for (const r of relPosts.docs) {
						relatedPost.push(r);
						relatedIDs.push(r.id);
					}
				}
			}
		}
		if (relatedPost.length < limit) {
			const queuedPosts = await payload.find({
				collection: "posts",
				where: {
					and: [
						{
							_status: {
								equals: "published",
							},
						},
						{
							id: {
								not_in: relatedIDs,
							},
						},
					],
				},
				limit: limit - relatedPost.length,
				select: {
					slug: true,
				},
			});
			if (queuedPosts && queuedPosts.docs && queuedPosts.docs.length > 0) {
				for (const r of queuedPosts.docs) {
					relatedIDs.push(r.id);
				}
			}
		}
		return {
			queuedIDs: relatedIDs,
			relatedPosts: relatedPost,
		};
	},
);
