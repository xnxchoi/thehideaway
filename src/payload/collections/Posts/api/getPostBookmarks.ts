"use server"
import {getPayload, Payload} from "payload"
import {cache} from "react"
import config from '@payload-config'

/***
 * Function to fetch bookmark data of a post
 * @param {{payload: Payload, id: string}} props - requires 1) a payload instance and 2) the id of the post to fetch bookmark data for to be passed.

 *
 * returns a Promise:

 * {bookmarks: string[], count: number} where bookmarks is an array of id of users who bookmarked; count is the total # of bookmarks on the post,

 * or an Error if the post id is not provided, or is an invalid value
 */
export const getPostBookMarks = cache(
	async ({id}: {  id: string }): Promise<{
		bookmarks: string[],
		count: number
	} | null> => {
		const payload=await getPayload({config})




		return  await payload.find({
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
				bookmarks: bookmarks.map(r=>r.user as string),
				count: result.totalDocs
			}
		}).catch(error => {
			payload.logger.error(error)
			return null
		})


	})