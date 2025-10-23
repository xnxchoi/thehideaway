"use server"
import {PayloadHandler, PayloadRequest} from "payload"
import {cache} from "react"
import {getDeltaBookMarks} from "./getDeltaBookmarks"


export const deltaBookmarksHandler: PayloadHandler = cache(async (req: PayloadRequest) => {

	const deltaId = req?.routeParams?.id
	const id = deltaId
	if (!id) return Response.json({error: "Provide a delta to query for; a delta id"},
		{status: 400})
	if (deltaId && (typeof deltaId !== 'string')) return Response.json(
		{error: "Provide a valid delta id"}, {status: 400})

	const result = await getDeltaBookMarks({payload: req.payload, id: `${id}`}).then(
		result => result instanceof Error ? Response.json({error: result.message},
			{status: 500}) : Response.json({bookmarks: result.bookmarks, count: result.count},
			{status: 200})).catch(error => Response.json({error: error.message}, {status: 500}))
	return result


})