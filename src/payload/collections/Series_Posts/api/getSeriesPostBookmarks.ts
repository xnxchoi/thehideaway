"use server"
import {Payload} from "payload"
import {cache} from "react"
import {Bookmark} from "@/payload-types"

export const getSeriesPostBookMarks = cache(
	async ({
		payload,
		id,
	}: {
		payload: Payload
		id: string
	}): Promise<
		| {
		bookmarks: string[]
		count: number
	}
		| Error
	> => {
		if (!id) return new Error("Provide a post to query for; a post id")
		if (id && typeof id !== "string")
			return new Error("Provide a valid post id")

		const result = await payload.find({
			collection: "bookmarks",
			where: {
				and: [
					{
						"target.value": {
							equals: id,
						},
					},
					{
						"target.relationTo": {
							equals: "posts",
						},
					},
				],
			},
			select: {
				user: true,
			},
			depth: 0,
		}).then((result) => {
			const bookmarks = result.docs as { id: string; user: string }[]
			return {
				bookmarks: bookmarks.flatMap((bookmark) => {
					if (typeof bookmark === "string") {
						return bookmark
					}
					return !bookmark ? [] : bookmark.user
				}),
				count: result.totalDocs,
			}
		}).catch((error) => {
			return new Error(error.message)
		})
		return result
	},
)
