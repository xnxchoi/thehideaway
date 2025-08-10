"use server"
import {Payload} from "payload"
import {cache} from "react"


export const getDeltaBookMarks = cache(
	async ({payload, id}: { payload: Payload, id: string }): Promise<{
		bookmarks: string[],
		count: number
	} | Error> => {


		if (!id) return new Error("Provide a post to query for; a post id")
		if (id && typeof id !== 'string') return new Error("Provide a valid post id")


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
				user: true,
			},
			depth: 0,
		}).then(result => {
			const bookmarks = result.docs
			return {
				bookmarks: bookmarks.flatMap(bookmark => {
					return (!bookmark) ? [] : bookmark.user as string
				}),
				count: result.totalDocs
			}
		}).catch(error => {
			return new Error(error.message)
		})
		return result


	})