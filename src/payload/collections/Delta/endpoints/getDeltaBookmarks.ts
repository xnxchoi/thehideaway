"use server";
import {CollectionSlug, PayloadHandler, PayloadRequest} from "payload";
import {cache} from "react";


export const getDeltaBookMarks: PayloadHandler = cache(async (req: PayloadRequest) => {

	const deltaId = req?.routeParams?.id;
	const {type} = req.query;
	const id = deltaId;
	if (!id) return Response.json({error: "Provide a delta to query for; a delta id"},
		{status: 400});
	if (deltaId && typeof deltaId !== 'string') return Response.json(
		{error: "Provide a valid delta id"}, {status: 400});


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
						equals: "delta",
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