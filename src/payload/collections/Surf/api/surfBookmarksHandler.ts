import {PayloadHandler, PayloadRequest} from "payload"
import {cache} from "react"
import {getSurfBookMarks} from "./getSurfBookmarks"


export const surfBookmarksHandler: PayloadHandler = cache(async (req: PayloadRequest) => {

	const surfId = req?.routeParams?.id
	const id = surfId
	if (!id) return Response.json({error: "Provide a surf to query for; a surf id"},
		{status: 400})
	if (surfId && (typeof surfId !== 'string')) return Response.json(
		{error: "Provide a valid surf id"}, {status: 400})

	const result = await getSurfBookMarks({payload: req.payload, id: `${id}`}).then(
		result => result instanceof Error ? Response.json({error: result.message},
			{status: 500}) : Response.json({bookmarks: result.bookmarks, count: result.count},
			{status: 200})).catch(error => Response.json({error: error.message}, {status: 500}))
	return result


})