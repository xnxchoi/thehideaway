"use server"
import {PayloadHandler, PayloadRequest} from "payload"

export const getUserFollowers: PayloadHandler = async (req: PayloadRequest) => {
	const id = req.routeParams?.id
	if (!id || typeof id !== "string") {
		return Response.json({error: "No id provided"}, {status: 400})
	}
	const userID = id
	const followers = await req.payload.find({
		collection: "follows",
		limit: 3000,
		overrideAccess: true,
		pagination: false,
		where: {
			target: {
				equals: userID,
			},
		},
		select: {
			user: true,
		},
	}).then(
		(res) =>
			res?.docs?.flatMap((doc) =>
				typeof doc.user === "string" ? doc.user : doc.user?.id || [],
			) || [],
	).catch((err) => {
		console.error(err)
		return [] as string[]
	})
	return Response.json(
		{followers: followers, count: followers.length},
		{status: 200},
	)
}
