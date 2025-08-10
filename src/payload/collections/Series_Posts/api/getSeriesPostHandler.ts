"use server";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {draftMode} from "next/headers";
import {headersWithCors, type PayloadRequest} from "payload";
import {getSeriesPostBookMarks} from "./getSeriesPostBookmarks";
import {cache} from "react";
import {ArticleOverview, AuthorSingle, SingleArticle} from "../post-types";
import {RP_Roles} from "@/stores/Notification/NotificationStore";

export const getSeriesPostHandler = cache(
	async ({req}: { req: PayloadRequest }) => {
		const postSlug = req.routeParams?.slug as string | undefined;
		console.log("from routeParams", postSlug);
		if (!postSlug) {
			return Response.json({error: "No post slug provided"}, {status: 400});
		}
		const user = req.user;
		const draft = await draftMode();
		const payload = req.payload;
		const slug = postSlug;

		const result = await payload.find({
			collection: "posts",
			draft: draft.isEnabled,
			limit: 1,
			overrideAccess: true,
			pagination: false,
			where: {
				slug: {
					equals: encodeURIComponent(slug),
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
		if (
			!result ||
			!result.docs ||
			result.totalDocs < 1 ||
			result.docs.length < 1
		) {
			console.error({
				message: `No post found for slug ${slug}`,
			});
			return Response.json(
				{error: "No post found for slug " + slug},
				{status: 404},
			);
		}

		const post = result.docs.at(0)!;
		console.log("post in API route", post);
		if (!post || !post.slug || !post.publishedAt || !post.author) {
			if (!post) {
				console.error({
					message: `No post found for slug ${slug}`,
				});
			}
			return Response.json(
				{error: "No post found for slug " + slug},
				{status: 404},
			);
		}
		const author = await payload.findByID({
			collection: "users",
			id: post.author as string,
			select: {
				name: true,
				displayUsername: true,

				slug: true,
			},
		}).then((r) => {
			return {
				...r,
				displayUsername: r.displayUsername ?? r.name,
			} as AuthorSingle;
		}).catch((e) => {
			console.error({
				message: `Error while retrieving author for post ${post.id}`,
				error: e,
			});
			return null;
		});
		if (!author) {
			console.error({
				message: `No author found for post ${post.id}`,
			});
			return Response.json(
				{error: "No author found for post " + post.id},
				{status: 404},
			);
		}

		const finalPost: SingleArticle = {
			...post,
			bookmarks: [] as string[],
			bookmarksCount: 0,
			slug: post.slug,
			publishedAt: post.publishedAt,
			category: post.category as { title: string; id: string },
			image: null!,
			author: author,
			queuedIDs: [] as string[],
			relatedPosts: [] as ArticleOverview[],
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
		} else {
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
						version: 0,
					},
				};
			}
		}
		return Response.json(
			{post: finalPost},
			{
				headers: headersWithCors({
					headers: new Headers(),
					req,
				}),
			},
		);
	},
);
