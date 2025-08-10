"use server"
import {Payload} from "payload"
import {cache} from "react"
import {Bookmark} from "@/payload-types"

/***
 * Function to fetch bookmark data of a post
 * @param {{payload: Payload, id: string}} props - requires 1) a payload instance and 2) the id of the post to fetch bookmark data for to be passed.

 *
 * returns a Promise:

 * {bookmarks: string[], count: number} where bookmarks is an array of id of users who bookmarked; count is the total # of bookmarks on the post,

 * or an Error if the post id is not provided, or is an invalid value
 */
export const getPostBookMarks = cache(
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
							equals: "posts",
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