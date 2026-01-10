"use server";
import {getImageMedia} from "@/payload/collections/Posts/api/getImageMedia";
import {singlePostSelect} from "@/payload/collections/Posts/api/queryBase";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {RP_Roles} from "@/stores/Notification/NotificationStore";

import {TagOverview} from "@/types/collections/meta-collections";
import {PostOverview, SingleArticle} from "@/types/collections/posts";
import {AuthorSingle} from "@/types/collections/users";
import {draftMode} from "next/headers";
import {headersWithCors, type PayloadRequest} from "payload";
import {getPostBookMarks} from "./getPostBookmarks";

export const getPostHandler = async ({req}: { req: PayloadRequest }) => {
	const postSlug = req.routeParams?.slug as string | undefined;
	console.log("from routeParams", postSlug);
	if (!postSlug) {
		return Response.json({error: "No post slug provided"}, {status: 400});
	}
	const user = req.user;
	const draft = await draftMode();
	const payload = req.payload;

	const result = await payload
		.find({
			collection: "posts",
			where: {
				slug: {
					equals: postSlug
				}
			},
			draft: draft.isEnabled,
			overrideAccess: true,

			select: singlePostSelect()
		})
		.then((r) => r.docs[0] ?? null)
		.catch((e) => {
			console.error({
				message: `Error while retrieving post by slug ${postSlug}`,
				error: e
			});
			return null;
		});
	if (!result) {
		console.error({
			message: `No post found for slug ${postSlug}`
		});
		return Response.json(
			{error: "No post found for slug " + postSlug},
			{status: 404}
		);
	}

	const post = result;
	console.log("post in API route", post);
	if (!post || !post.slug || !post.publishedAt || !post.author) {
		if (!post) {
			console.error({
				message: `No post found for slug ${postSlug}`
			});
		}
		return Response.json(
			{error: "No post found for slug " + postSlug},
			{status: 404}
		);
	}
	const author = await payload
		.findByID({
			collection: "users",
			id: post.author as string,
			select: {
				name: true,
				displayUsername: true,

				slug: true
			}
		})
		.then((r) => {
			return {
				...r
			} as AuthorSingle;
		})
		.catch((e) => {
			console.error({
				message: `Error while retrieving author for post ${post.id}`,
				error: e
			});
			return null;
		});
	if (!author) {
		console.error({
			message: `No author found for post ${post.id}`
		});
		return Response.json(
			{error: "No author found for post " + post.id},
			{status: 404}
		);
	}
	const image = await getImageMedia({post, payload})

	const finalPost: SingleArticle = {
		...post,
		bookmarks: [] as string[],
		bookmarksCount: 0,
		tagged: post.tagged ? (post.tagged as TagOverview[]) : [],
		id: post.id,
		slug: post.slug,
		publishedAt: post.publishedAt,
		category: post.category as { title: string; id: string; slug: string },
		image: image,
		author: author,
		queuedIDs: [] as string[],
		relatedPosts: [] as PostOverview[]
	};
	const bookmarks = await getPostBookMarks({id: `${post.id}`});
	if (bookmarks) {
		finalPost.bookmarks = bookmarks.bookmarks;
		finalPost.bookmarksCount = bookmarks.count;
	}
	if (post.locked) {
		const auth = post.authority ?? 1;

		if (
			!user ||
			(roleToAuthority((user?.role as RP_Roles) ?? "user") < auth &&
				post.allowList?.some((r) => r === user?.id))
		) {
			finalPost.content = {
				root: {
					type: "paragraph",
					children: [],
					direction: "ltr",
					format: "start",
					indent: 0,
					version: 0
				}
			};
		}
	}
	return Response.json(
		{post: finalPost},
		{
			headers: headersWithCors({
				headers: new Headers(),
				req
			})
		}
	);
};
