import {PayloadHandler, PayloadRequest} from "payload";
import {cache} from "react";

export const getProfileBookmarks: PayloadHandler = cache(
	async (req: PayloadRequest) => {
		const userId = req?.routeParams?.id;
		const {type} = req.query;
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
			return Response.json({error: error.message}, {status: 500});
		}
	},
);
