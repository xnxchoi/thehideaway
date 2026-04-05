"use server";
import {surfOverviewSelect} from "@/payload/collections/Surf/api/querySurfOverview";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";

import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {CategoryOverview, TagOverview} from "@/types/collections/meta-collections";
import {AuthorOverview} from "@/types/collections/users";
import {draftMode} from "next/headers";
import {headersWithCors, type PayloadRequest} from "payload";

import {cache} from "react";
import type {SingleSurf, SurfOverview} from "../../../../types/collections/surf";
import {getSurfBookMarks} from "./getSurfBookmarks";

export const getSurfHandler = cache(
	async ({req}: { req: PayloadRequest }) => {
		const surfSlug = req.routeParams?.slug as string | undefined;
		console.log("from routeParams", surfSlug);
		if (!surfSlug) {
			return Response.json(
				{error: "No surf slug provided"},
				{status: 400}
			);
		}
		const user = req.user;
		const draft = await draftMode();
		const payload = req.payload;

		const result = await payload
			.find({
				collection: "surf",
				where: {
					slug: {
						equals: surfSlug
					}
				},
				draft: draft.isEnabled,
				overrideAccess: true,

				select: surfOverviewSelect()
			})
			.then((r) => r.docs[0] ?? null)
			.catch((e) => {
				console.error({
					message: `Error while retrieving surf by slug ${surfSlug}`,
					error: e
				});
				return null;
			});
		if (!result) {
			console.error({
				message: `No surf found for slug ${surfSlug}`
			});
			return Response.json(
				{error: "No surf found for slug " + surfSlug},
				{status: 404}
			);
		}

		const surf = result;
		console.log("surf in API route", surf);
		if (!surf || !surf.slug || !surf.publishedAt || !surf.author) {
			if (!surf) {
				console.error({
					message: `No surf found for slug ${surfSlug}`
				});
			}
			return Response.json(
				{error: "No surf found for slug " + surfSlug},
				{status: 404}
			);
		}
		const author = await payload
			.findByID({
				collection: "users",
				id: surf.author as string,
				select: {
					name: true,
					displayUsername: true,

					slug: true
				}
			})
			.then((r) => {
				return {
					...r,
					name: r.name
				} as AuthorOverview;
			})
			.catch((e) => {
				console.error({
					message: `Error while retrieving author for surf ${surf.id}`,
					error: e
				});
				return null;
			});
		if (!author) {
			console.error({
				message: `No author found for surf ${surf.id}`
			});
			return Response.json(
				{error: "No author found for surf " + surf.id},
				{status: 404}
			);
		}
		const finalSurf: SingleSurf = {
			...surf,
			bookmarks: [] as string[],
			bookmarksCount: 0,
			tagged: [...((result?.tagged as TagOverview[] | null | undefined) || [])],
			slug: surf.slug,
			publishedAt: surf.publishedAt,
			category: surf.category as CategoryOverview,
			author: author,
			queuedIDs: [] as string[],
			relatedSurfs: [] as SurfOverview[]
		};
		const bookmarks = await getSurfBookMarks({payload, id: `${surf.id}`});
		if (bookmarks instanceof Error) {
			console.error({
				message: `Error while retrieving bookmarks for surf ${surf.id}`,
				error: bookmarks
			});
		} else {
			finalSurf.bookmarks = bookmarks.bookmarks;
			finalSurf.bookmarksCount = bookmarks.count;
		}
		if (surf.locked) {
			const auth = surf.authority ?? 1;

			if (
				!user ||
				(roleToAuthority((user?.role as RP_Roles) ?? "user") < auth &&
					surf.allowList?.some((r) => r === user?.id))
			) {
				finalSurf.content = {
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
			{surf: finalSurf},
			{
				headers: headersWithCors({
					headers: new Headers(),
					req
				})
			}
		);
	}
);
