"use server";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {draftMode} from "next/headers";
import {headersWithCors, type PayloadRequest} from "payload";

import {cache} from "react";

import {RP_Roles} from "@/stores/Notification/NotificationStore";
import type {AuthorSingle} from "../../Posts/post-types";
import type {DeltaOverview, SingleDelta, TagOverview} from "../delta-types";
import {getDeltaBookMarks} from "./getDeltaBookmarks";

export const getDeltaHandler = cache(
	async ({req}: { req: PayloadRequest }) => {
		const deltaSlug = req.routeParams?.slug as string | undefined;
		console.log("from routeParams", deltaSlug);
		if (!deltaSlug) {
			return Response.json(
				{error: "No delta slug provided"},
				{status: 400},
			);
		}
		const user = req.user;
		const draft = await draftMode();
		const payload = req.payload;

		const result = await payload.find({
			collection: "delta",
			where: {
				slug: {
					equals: deltaSlug,
				},
			},
			draft: draft.isEnabled,
			overrideAccess: true,

			select: {
				title: true,
				content: true,
				slug: true,
				category: true,
				authority: true,
				author: true,
				tags: true,
				allowList: true,
				source: true,
				publishedAt: true,
				locked: true,
				updatedAt: true,
				createdAt: true,
			},
		}).then((r) => r.docs[0] ?? null).catch((e) => {
			console.error({
				message: `Error while retrieving delta by slug ${deltaSlug}`,
				error: e,
			});
			return null;
		});
		if (!result) {
			console.error({
				message: `No delta found for slug ${deltaSlug}`,
			});
			return Response.json(
				{error: "No delta found for slug " + deltaSlug},
				{status: 404},
			);
		}

		const delta = result;
		console.log("delta in API route", delta);
		if (!delta || !delta.slug || !delta.publishedAt || !delta.author) {
			if (!delta) {
				console.error({
					message: `No delta found for slug ${deltaSlug}`,
				});
			}
			return Response.json(
				{error: "No delta found for slug " + deltaSlug},
				{status: 404},
			);
		}
		const author = await payload.findByID({
			collection: "users",
			id: delta.author as string,
			select: {
				name: true,
				displayUsername: true,

				slug: true,
			},
		}).then((r) => {
			return {
				...r,
				name: r.name,
			} as AuthorSingle;
		}).catch((e) => {
			console.error({
				message: `Error while retrieving author for delta ${delta.id}`,
				error: e,
			});
			return null;
		});
		if (!author) {
			console.error({
				message: `No author found for delta ${delta.id}`,
			});
			return Response.json(
				{error: "No author found for delta " + delta.id},
				{status: 404},
			);
		}
		const tags:TagOverview[]=[]
		if(result.tags){
			tags.push(...(result.tags as TagOverview[]))
		}
		const finalDelta: SingleDelta = {
			...delta,
			bookmarks: [] as string[],
			bookmarksCount: 0,
			tags,
			slug: delta.slug,
			publishedAt: delta.publishedAt,
			category: delta.category as { title: string; id: string },
			author: author,
			queuedIDs: [] as string[],
			relatedDeltas: [] as DeltaOverview[],
		};
		const bookmarks = await getDeltaBookMarks({payload, id: `${delta.id}`});
		if (bookmarks instanceof Error) {
			console.error({
				message: `Error while retrieving bookmarks for delta ${delta.id}`,
				error: bookmarks,
			});
		} else {
			finalDelta.bookmarks = bookmarks.bookmarks;
			finalDelta.bookmarksCount = bookmarks.count;
		}
		if (delta.locked) {
			const auth = delta.authority ?? 1;

			if (
				!user ||
				(roleToAuthority((user?.role as RP_Roles) ?? "user") < auth &&
					delta.allowList?.some((r) => r === user?.id))
			) {
				finalDelta.content = {
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
			{delta: finalDelta},
			{
				headers: headersWithCors({
					headers: new Headers(),
					req,
				}),
			},
		);
	},
);
