"use server"
import {PayloadRequest} from "payload"
import {Follow} from "@/payload-types"
import type {DataFromCollectionSlug, Where} from "payload"
import {cache} from "react"

export const createFollow = async ({
	payload,
	user,
	target,
}: {
	payload: PayloadRequest["payload"]
	user: string
	target: NonNullable<Follow["target"]>
}) => {
	const existingFollow = await payload.find({
		collection: "follows",
		where: {
			and: [
				{
					user: {
						equals: user,
					},
				},
				{
					target: {
						equals: target,
					},
				},

			],
		},
		select: {
			target: true,
		},
		overrideAccess: true,
		depth: 0,
	})
	if (existingFollow.totalDocs > 0) {
		existingFollow.totalDocs > 1 &&
		(await payload.delete({
			collection: "follows",
			where: {
				and: [
					{
						user: {
							equals: user,
						},
					},
					{
						target: {
							equals: target,
						},
					},

					{
						id: {
							not_equals: existingFollow.docs[0]!.id,
						},
					},
				],
			},
			overrideAccess: true,
		}))
		return existingFollow.docs[0] as {
			id: string
			user: string
			target: string
		}
	}
	const follow = await payload.create({
		collection: "follows",
		data: {
			user: user,
			target,
		},
		depth: 0,
		overrideAccess: true,
	}).then((b) => {
		return {
			id: b.id,
			user: b.user as string,
			target: b.target as string,
		}
	}).catch(async (err) => {
		console.error(err)
		return null
	})
	return follow
}
export type CreateFollow = Awaited<ReturnType<typeof createFollow>>

export const deleteFollow = async ({
	payload,
	user,
	target,
}: {
	payload: PayloadRequest["payload"]
	user: string
	target: NonNullable<Follow["target"]>
}) => {
	const result = await payload.delete({
		collection: "follows",
		where: {
			and: [
				{
					user: {
						equals: user,
					},
				},
				{
					target: {
						equals: target,
					},
				},
			],
		},
		overrideAccess: true,
	}).then((b) => {
		const res = {
			errors: b.errors,
			errorIDs: b.errors?.map((e) => e.id) || [],
			docs: b.docs.map((b) => b.id) || [],
		}
		if ((!res.docs || res.docs?.length < 1) && res.errorIDs.length > 0) {
			throw res
		}
		return res
	}).catch((err) => {
		console.error(err)
		throw err
	})
	return result
}
export type DeleteFollow = Awaited<ReturnType<typeof deleteFollow>>
export const getFollows = cache(
	async ({
		payload,
		collection,
		query,
	}: {
		payload: PayloadRequest["payload"]
		collection: "users"
		query:
			| {
			user: string
		}
			| {
			id:
				| DataFromCollectionSlug<"users">["id"]
				| DataFromCollectionSlug<"users">["id"][]
		}
			| {
			user: string
			id:
				| DataFromCollectionSlug<"users">["id"]
				| DataFromCollectionSlug<"users">["id"][]
		}
	}) => {
		if (!("user" in query) && !("id" in query)) {
			console.error(
				"No user or id provided. One of them is required. Returning empty array.",
			)
			return []
		}
		const where: Where[] = []
		if ("id" in query) {
			const ids = Array.isArray(query.id) ? query.id : [query.id]
			where.push({
				target: {
					in: ids,
				},
			})
		}
		if ("user" in query) {
			where.push({
				user: {
					equals: query.user,
				},
			})
		}

		const result = await payload.find({
			collection: "follows",
			where: {
				and: [
					{
						target: {
							equals: "users",
						},
					},

					...where,
				],
			},
			depth: 0,
			overrideAccess: true,
		}).then((b) => {
			return b.docs.map((b) => ({
				id: b.id,
				user: b.user as string,
				target: {
					relationTo: "users",
					value: b.target as string,
				},
			}))
		}).catch((err) => {
			console.error(err)
			return []
		})
		return result
	},
);
/**
 * {
        user: string;
        collection?: Target['relationTo'][] | Target['relationTo'];
    } | {
        targetIDs: string[] | string[];
    } | { targets: Target[]; } | { target: Target; } | { targetID: string | string; }
 */
