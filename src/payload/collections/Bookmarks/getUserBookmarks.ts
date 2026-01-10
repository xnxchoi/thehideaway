"use server";
import type {Bookmark, User} from "@/payload-types";
import config from "@payload-config";
import {CollectionSlug, getPayload, PayloadHandler, PayloadRequest} from "payload";
import {cache} from "react";
import {bookmarkTypesRegex, validTypes} from ".";

export type UserBookmarksResponse = {
	bookmarks: User["id"][];
	count: number;
};
export const getUserBookmarks: PayloadHandler = cache(
	async (req: PayloadRequest) => {
		const {user} = req;
		const userId = req?.routeParams?.id as undefined | User["id"];
		const {type} = req.query;
		const id = userId || user?.id;
		if (!id)
			return Response.json(
				{error: "Provide a user to query for; a user id"},
				{status: 400}
			);
		if (userId && typeof userId !== "string")
			return Response.json(
				{error: "Provide a valid user id"},
				{status: 400}
			);

		if (!type || typeof type !== "string" || !bookmarkTypesRegex.test(type)) {
			return Response.json(
				{
					error:
						"Please provide a valid type-a comma separated list of: " +
						validTypes.join(",")
				},
				{status: 400}
			);
		}
		const queryTypes = type.trim().toLowerCase().split(",");
		if (!queryTypes.every((t) => validTypes.includes(t as CollectionSlug)))
			return Response.json(
				{
					error:
						"Please provide valid types-a comma separated list containing one or more of: " +
						validTypes.join(",")
				},
				{status: 400}
			);

		const payload = req.payload;
		const reqs = queryTypes.map((type) => payload
			.find({
				collection: "bookmarks",
				overrideAccess: true,
				where: {
					and: [
						{
							user: {
								equals: id
							}
						},
						{
							"target.relationTo": {
								equals: type
							}
						}
					]
				},
				select: {
					target: true
				}
			}).then((result) => ({
				[type]: result.docs.map((doc) => {
					const v = doc.target.value
					return typeof v === "string" ? v : v.id
				})
			})));
		const result = await Promise.allSettled(reqs);
		let cnt = 0;
		const toResponse = result.reduce((acc, vs) => {
			if (vs.status === "fulfilled") {
				const ee = Object.entries(vs.value);
				const [slug, values] = ee[0]! as [CollectionSlug, string[]]
				cnt += values.length;
				return {
					...acc,
					[slug]: values
				}
			}
			return acc
		}, {} as Record<CollectionSlug, string[]>);
		return Response.json(
			{bookmarks: toResponse, count: cnt},
			{status: 200}
		)

	}
);

export const getBookmark = cache(
	async ({userId, types}: { userId: string; types: Bookmark["target"]["relationTo"][] }) => {

		if (!types.every((t) => validTypes.includes(t))) {
			throw new Error("Invalid types")
		}
		const payload = await getPayload({config})
		const maps = types.map(type => payload
			.find({
				collection: "bookmarks",
				overrideAccess: true,
				where: {
					and: [
						{
							user: {
								equals: userId
							}
						},
						{
							"target.relationTo": {
								equals: type
							}

						}
					]
				},
				select: {
					user: true,
					target: true
				}
			}).then(r => ([type, r.docs.map(doc => typeof doc.target.value === "string" ? doc.target.value : doc.target.value.id)])));
		const resul = await Promise.allSettled(maps);
		const result = resul.flatMap(x => x.status === "fulfilled" ? (x.value as [Bookmark["target"]["relationTo"], string[]]) : []).reduce((acc, [slug, bookmarks]) => {
			return {
				...acc,
				[slug]: bookmarks
			}
		}, {} as Record<Bookmark["target"]["relationTo"], string[]>);

		return result;
	}
);