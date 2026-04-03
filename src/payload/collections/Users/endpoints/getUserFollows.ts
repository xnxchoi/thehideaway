import {PayloadHandler, PayloadRequest} from "payload"
import {User} from "better-auth"
import {cache} from "react"

export type UserFollowingResponse = {
	follows: User['id'][]
	count: number
}
export const getUserFollowing: PayloadHandler = cache(async (req: PayloadRequest) => {
	const userId = req?.routeParams?.id ?? req.user?.id
	if (!userId) return Response.json({error: "Provide a user to query for; a user id"},
		{status: 400})
	if (typeof userId !== 'string') return Response.json({error: "Provide a valid user id"},
		{status: 400})
	const id = userId
	const payload = req.payload
	const result = await payload.find({
		collection: "follows",
		limit: 3000,
		pagination: false,
		where: {
			user: {
				equals: id,
			},
		},
		select: {
			target: true,
		},
	}).then(result => result.docs.map(doc => doc.target) || []).catch(error => {
		console.error(error)
		return []
	})
	return Response.json({following: result, count: result.length}, {status: 200})


})