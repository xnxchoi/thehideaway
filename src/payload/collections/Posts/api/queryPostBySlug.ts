"use server";
import {draftMode} from "next/headers";
import {getPayload, Payload, Where} from "payload";
import configPromise from "@payload-config";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {cache} from "react";
import {
	ArticleOverview,
	AuthorSingle,
	MediaReq,
	SingleArticle,
} from "../post-types";
import {authClient} from "@/lib/auth/client";
import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {getPostBookMarks} from "./getPostBookmarks";
import {Post} from "@/payload-types";
import {queryOverview} from "./queryPostOverview";

export const queryAuthorsPost = cache(
	async ({
		slug,
		authorSlug,
	}: {
		slug: string;
		authorSlug: string;
	}): Promise<{ post: SingleArticle } | null> => {
		const {isEnabled: draft} = await draftMode();

		const payload = await getPayload({config: configPromise});
		const user = await authClient.getSession();
		const se = user?.data?.user ?? null;
		const author = await payload.find({
			collection: "users",
			limit: 1,
			where: {
				slug: {
					equals: authorSlug,
				},
			},
			overrideAccess: true,
			select: {
				slug: true,
			},
		}).then((r) => {
			return r.docs[0]?.id ?? null;
		});
		if (!author) {
			return null;
		}
		const result = await payload.find({
			collection: "posts",
			draft,
			limit: 1,
			overrideAccess: true,
			pagination: false,
			where: {
				and: [
					{
						author: {
							equals: author,
						},
					},
					{
						slug: {
							equals: slug,
						},
					},
				],
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
		let image: MediaReq | null = post.image
			? typeof post.image === "string"
				? null
				: post.image
			: null;
		if (!image && typeof post.image === "string") {
			const img = await payload.findByID({
				collection: "media",
				id: post.image as string,
				overrideAccess: true,
				select: {
					url: true,
					darkmode: true,
					alt: true,
					caption: true,
					createdAt: true,
					updatedAt: true,
					filename: true,
					mimeType: true,
					size: true,
					width: true,
					height: true,
				},
			});
			if (img) {
				image = img;
			}
		}
		const finalPost: SingleArticle = {
			...post,
			author: null!,
			bookmarks: [] as string[],
			publishedAt: post.publishedAt,
			image: image,
			bookmarksCount: 0,
			slug: post.slug,
			category: post.category as { title: string; id: string; slug: string },
			queuedIDs: null!,
			relatedPosts: null!,
		};
		const bookmarks = await getPostBookMarks({payload, id: `${post.id}`});
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
		const authorInfo: AuthorSingle | null = await payload.findByID({
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
		if (!authorInfo) {
			return null;
		}
		finalPost.author = authorInfo;
		// 3) Get the related posts
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
				finalPost.disabled = true;
				finalPost.queuedIDs = [];
				finalPost.relatedPosts = [];
				return {
					post: finalPost,
				};
			}
		}
		const {queuedIDs, relatedPosts} = await queryRelatedPosts({
			payload,
			postID: post.id,
			relatedPosts: post.relatedPosts,
			limit: 15,
			author,
			isAuthorPage: true,
		});
		finalPost.queuedIDs = queuedIDs;
		finalPost.relatedPosts = relatedPosts;
		const {relatedPosts: __d, author: __, ...rest} = post;

		return {
			post: finalPost,
		};
	},
);
export const queryPostBySlug = cache(
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
			limit: 1,
			pagination: false,
			where: {
				slug: {
					equals: slug,
				},
			},
			draft,
			overrideAccess: true,
			select: {
				title: true,
				subtitle: true,
				content: true,
				slug: true,
				id: true,
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
		if (!result) {
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
		let image: MediaReq | null = post.image
			? typeof post.image === "string"
				? null
				: post.image
			: null;
		if (!image && typeof post.image === "string") {
			const img = await payload.findByID({
				collection: "media",
				id: post.image as string,
				overrideAccess: true,
				select: {
					url: true,
					darkmode: true,
					alt: true,
					caption: true,
					createdAt: true,
					updatedAt: true,
					filename: true,
					mimeType: true,
					size: true,
					width: true,
					height: true,
				},
			});
			if (img) {
				image = img;
			}
		}
		const finalPost: SingleArticle = {
			...post,
			author: null!,
			bookmarks: [] as string[],
			publishedAt: post.publishedAt,
			image: image,
			bookmarksCount: 0,
			slug: post.slug,
			category: post.category as { title: string; id: string; slug: string },
			queuedIDs: null!,
			relatedPosts: null!,
		};
		const bookmarks = await getPostBookMarks({payload, id: `${post.id}`});
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

		const {queuedIDs, relatedPosts} = await queryRelatedPosts({
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
				finalPost.disabled = false;
			} else {
				finalPost.disabled = true;
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
				finalPost.queuedIDs = [];
				finalPost.relatedPosts = [];
			}
		}
		return {
			post: finalPost,
		};
	},
);
export const queryPostByID = cache(
	async ({id}: { id: string }): Promise<{ post: SingleArticle } | null> => {
		const payload = await getPayload({config: configPromise});
		const post = await payload.findByID({
			collection: "posts",
			id,
			select: {
				slug: true,
			},
		});
		if (!post || !post.slug) {
			return null;
		}
		return await queryPostBySlug({slug: post.slug});
	},
);

export const queryRelatedPosts = cache(
	async ({
		payload,
		postID,
		relatedPosts,
		limit = 15,
		author,
		isAuthorPage = false,
	}: {
		payload: Payload;
		postID: string;
		relatedPosts: Post["relatedPosts"];
		limit?: number;
	} & (
		| {
		author?: string;
		isAuthorPage?: false;
	}
		| { isAuthorPage: true; author: string }
		)): Promise<{ queuedIDs: string[]; relatedPosts: ArticleOverview[] }> => {
		//Now we first query for the posts to show in the "More Like This" sidebar
		const relatedPost: ArticleOverview[] = [] as ArticleOverview[];
		const isAuthorMode = isAuthorPage && author;
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

			const directlyRelatedPosts = await queryOverview({
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
				const relPosts = await queryOverview({
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
						if (isAuthorMode) {
							if (r.author && r.author.id === author) {
								relatedIDs.push(r.id);
							}
						} else {
							relatedIDs.push(r.id);
						}
					}
				}
			}
		}
		if (relatedPost.length < limit) {
			const and: Where[] = [
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
			];
			let queryLimit = limit - relatedPost.length;
			if (isAuthorMode) {
				and.push({
					author: {
						equals: author,
					},
				});
				queryLimit = 100 - relatedIDs.length;
			}
			const queuedPosts = await payload.find({
				collection: "posts",
				where: {
					and: and,
				},
				limit: queryLimit,
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
