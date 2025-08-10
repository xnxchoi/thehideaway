"use server"
import {PayloadRequest} from "payload"
import {Bookmark} from "@/payload-types"
import type {CollectionSlug, DataFromCollectionSlug, Where} from "payload"
import {cache} from "react"
import type {Payload} from 'payload'


export type BookmarkParams = {
	payload: Payload
	user: string
	target: {
		relationTo: Extract<CollectionSlug, 'posts' | 'delta' | 'playlists' | 'profile' | 'albums' | 'tracks' | 'userMedia'>
		value: string
	}
}
export const createBookmark = async ({
	payload,
	user,
	target,
}: BookmarkParams) => {
	const existingBookmark = await payload.find({
		collection: "bookmarks",
		where: {
			and: [
				{
					user: {
						equals: user,
					},
				},
				{
					"target.value": {
						equals: target.value,
					},
				},
				{
					"target.relationTo": {
						equals: target.relationTo,
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
	if (existingBookmark.totalDocs > 0) {
		existingBookmark.totalDocs > 1 &&
		(await payload.delete({
			collection: "bookmarks",
			where: {
				and: [
					{
						user: {
							equals: user,
						},
					},
					{
						"target.value": {
							equals: target.value,
						},
					},
					{
						"target.relationTo": {
							equals: target.relationTo,
						},
					},
					{
						id: {
							not_equals: existingBookmark.docs[0]!.id,
						},
					},
				],
			},
			overrideAccess: true,
		}))
		return existingBookmark.docs[0] as {
			id: string
			user: string
			target: {
				relationTo: string
				value: string
			}
		}
	}
	const bookmark = await payload.create({
		collection: "bookmarks",
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
			target: {
				relationTo: b.target!.relationTo,
				value: b.target!.value as string,
			},
		}
	}).catch(async (err) => {
		console.error(err)
		return null
	})
	return bookmark
}
export type CreateBookmark = Awaited<ReturnType<typeof createBookmark>>

export const deleteBookmark = async ({
	payload,
	user,
	target,
}: {
	payload: PayloadRequest["payload"]
	user: string
	target: NonNullable<Bookmark["target"]>
}) => {
	const result = await payload.delete({
		collection: "bookmarks",
		where: {
			and: [
				{
					user: {
						equals: user,
					},
				},
				{
					"target.value": {
						equals: target.value,
					},
				},
				{
					"target.relationTo": {
						equals: target.relationTo,
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
export type DeleteBookmark = Awaited<ReturnType<typeof deleteBookmark>>
type Target = NonNullable<Required<Bookmark>["target"]>
export const getBookmarks = cache(
	async <T extends Target["relationTo"]>({
		payload,
		collection,
		query,
	}: {
		payload: PayloadRequest["payload"]
		collection: T
		query:
			| {
			user: string
		}
			| {
			id:
				| DataFromCollectionSlug<T>["id"]
				| DataFromCollectionSlug<T>["id"][]
		}
			| {
			user: string
			id:
				| DataFromCollectionSlug<T>["id"]
				| DataFromCollectionSlug<T>["id"][]
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
				"target.value": {
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
			collection: "bookmarks",
			where: {
				and: [
					{
						"target.relationTo": {
							equals: collection,
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
					relationTo: b.target!.relationTo as T,
					value: b.target!.value as DataFromCollectionSlug<T>["id"],
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
        // user: string;
        collection?: Target['relationTo'][] | Target['relationTo'];
    } | {
        targetIDs: string[] | string[];
    } | { targets: Target[]; } | { target: Target; } | { targetID: string | string; }
 */
