"use server";
import {CollectionSlug, PayloadHandler, PayloadRequest} from "payload";
import {cache} from "react";


export const getSurfBookMarks: PayloadHandler = cache(async (req: PayloadRequest) => {

	const surfId = req?.routeParams?.id;
	const {type} = req.query;
	const id = surfId;
	if (!id) return Response.json({error: "Provide a surf to query for; a surf id"},
		{status: 400});
	if (surfId && typeof surfId !== 'string') return Response.json(
		{error: "Provide a valid surf id"}, {status: 400});


	const payload = req.payload;
	const result = await payload.find({
		collection: "bookmarks",
		where: {
			and: [
				{
					'target.value': {
						equals: id,
					},
				},
				{
					'target.relationTo': {
						equals: "surf",
					},
				}
			],
		},
		select: {
			target: true,
		},
	}).then(
		result => Response.json({bookmarks: result.docs, count: result.totalDocs}, {status: 200})).
		catch(() => Response.json({error: "Failed to fetch bookmarks"}, {status: 500}));
	return result;


})