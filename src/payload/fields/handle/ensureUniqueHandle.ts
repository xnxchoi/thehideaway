"use server"
import {draftMode} from "next/headers"
import {addDataAndFileToRequest, type PayloadRequest} from "payload"
import {generateSmartSlugCandidates} from "@/payload/fields/handle/smartGenerateHandles"

export const ensureUniqueHandle = async ({req}: { req: PayloadRequest }) => {

	await addDataAndFileToRequest(req)
	const handle = req.data?.handle
	if (!handle) {
		return Response.json(
			{
				error: "Handle is required",
			},
			{status: 400},
		)
	}

	const payload = req.payload
	if (!req.user?.id) {
		return Response.json({error: "forbidden"}, {status: 403})
	}
	const user = await payload.findByID({
		collection: "users",
		id: req.user?.id,

		overrideAccess: true,
		select: {
			name: true,
			firstName: true,
			email: true,
			lastName: true,
			slug: true,
		},
	})

	const exists = await payload.count({
		collection: "users",
		overrideAccess: true,
		where: {
			or: [
				{
					slug: {
						equals: handle,
					},
				},
				{
					name: {
						equals: handle,
					},
				},
			],
		},
	}).then((r) => r.totalDocs > 0).catch((e) => {
		payload.logger.error({
			message: `Error while checking if handle ${handle} exists`,
			error: e,
		})
		return true
	})

	if (exists) {
		const newHandles = generateSmartSlugCandidates({
			base: handle,
			username: user.name ?? user.firstName ?? user.lastName ?? undefined,
			email: user.email ?? undefined,
			maxAttempts: 3,
		})
		const handles: string[] = []
		for (const hd of newHandles) {
			const exists = await payload.count({
				collection: "users",

				overrideAccess: true,

				where: {
					or: [
						{
							slug: {
								equals: hd,
							},
						},
						{
							name: {
								equals: hd,
							},
						},
					],
				},
			}).then((r) => r.totalDocs > 0).catch((e) => {
				payload.logger.error({
					message: `Error while checking if handle ${hd} exists`,
					error: e,
				})
				return true
			})

			if (exists) continue
			handles.push(hd)
		}
		if (handles.length > 0) {
			return Response.json(
				{error: "handle_exists", handles},
				{status: 409},
			)
		}
		return Response.json({error: "handle_exists_no_alt"}, {status: 409})
	}
	return Response.json({message: "ok", handle: handle}, {status: 200})
}
