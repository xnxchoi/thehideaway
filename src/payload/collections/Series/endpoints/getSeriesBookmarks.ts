"use server";
import {CollectionSlug, PayloadHandler, PayloadRequest} from "payload";


export const getSeriesBookMarks: PayloadHandler = async (req: PayloadRequest) => {

	const seriesId = req?.routeParams?.id;
	const {type} = req.query;
	const id = seriesId;
	if (!id) return Response.json({error: "Provide a series to query for; a series id"},
		{status: 400});
	if (seriesId && typeof seriesId !== 'string') return Response.json(
		{error: "Provide a valid series id"}, {status: 400});


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
						equals: "series",
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


}