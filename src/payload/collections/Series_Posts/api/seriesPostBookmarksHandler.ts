"use server"
import {CollectionSlug, PayloadHandler, PayloadRequest} from "payload"
import {cache} from "react"
import {getSeriesPostBookMarks} from "./getSeriesPostBookmarks"

export const seriesPostBookmarksHandler: PayloadHandler = cache(
	async (req: PayloadRequest) => {
		const postId = req?.routeParams?.id
		const id = postId
		if (!id)
			return Response.json(
				{error: "Provide a post to query for; a post id"},
				{status: 400},
			)
		if (postId && (typeof postId !== "string" || typeof postId !== "number"))
			return Response.json(
				{error: "Provide a valid post id"},
				{status: 400},
			)

		const result = await getSeriesPostBookMarks({
			payload: req.payload,
			id: `${id}`,
		}).then((result) =>
			result instanceof Error
				? Response.json({error: result.message}, {status: 500})
				: Response.json(
					{
						bookmarks: result.bookmarks,
						count: result.count,
					},
					{status: 200},
				),
		).catch((error) =>
			Response.json({error: error.message}, {status: 500}),
		)
		return result
	},
)
