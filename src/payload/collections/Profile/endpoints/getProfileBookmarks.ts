// NOTE: This file intentionally does NOT use `"use server"`. It exports a
// PayloadHandler mounted at GET /api/profile/:id/bookmarks — not a Next.js
// server action. The `PayloadRequest` argument is not serializable, so marking
// this module as a server action would be meaningless and only widen the
// POST-invokable surface.
import {PayloadHandler, PayloadRequest} from "payload";
import {cache} from "react";

export const getProfileBookmarks: PayloadHandler = cache(
	async (req: PayloadRequest) => {
		// Require an authenticated session. The response is low-sensitivity
		// (only a count + the target id echoed back), but there is no reason
		// to expose it to unauthenticated clients.
		if (!req.user) {
			return Response.json(
				{error: "Unauthorized"},
				{status: 401},
			);
		}
		const userId = req?.routeParams?.id;
		const id = userId;
		if (!id)
			return Response.json(
				{error: "Provide a user to query for; a user id"},
				{status: 400},
			);
		if (userId && typeof userId !== "string")
			return Response.json(
				{error: "Provide a valid user id"},
				{status: 400},
			);
		try {
			const payload = req.payload;
			const result = await payload.find({
				collection: "bookmarks",
				overrideAccess: true,
				where: {
					and: [
						{
							"target.value": {
								equals: id,
							},
						},
						{
							"target.relationTo": {
								equals: "users",
							},
						},
					],
				},
				select: {
					target: true,
				},
			}).then((result) =>
				Response.json(
					{
						bookmarks: result.docs,
						count: result.totalDocs,
					},
					{status: 200},
				),
			);

			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			return Response.json({error: message}, {status: 500});
		}
	},
);
