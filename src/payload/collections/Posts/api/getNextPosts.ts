'use server'
import {getPayload, PaginatedDocs} from "payload"
import configPromise from '@payload-config'
import {Post} from '@/payload-types'

import {cache} from 'react'

export const getNextPosts: (props: {
	id: string
	relatedPosts?: Post["relatedPosts"]
}) => Promise<Array<string>> = cache(
	async (props: { id: string; relatedPosts?: Post["relatedPosts"] }) => {
		const {id, relatedPosts} = props
		const payloadPosts: string[] = []
		const payload = await getPayload({config: configPromise})
		if (relatedPosts && relatedPosts.length > 0) {
			const ids = relatedPosts.flatMap((post) =>
				typeof post === "string" || false ? post : post.id,
			)
			const relPosts = await payload.find({
				collection: "posts",
				where: {
					and: [
						{
							id: {
								in: ids,
							},
						},
						{
							_status: {
								equals: "published",
							},
						},
					],
				},
				depth: 0,
			}).catch((e) => {
				console.error({
					message: `Error while retrieving related posts for ${id}`,
					error: e,
				})
			})
			if (relPosts && relPosts.totalDocs > 0) {
				const ps = relPosts.docs.flatMap((doc) => {
					if (typeof doc.id === "string") return doc.id
					return []
				})
				payloadPosts.push(...ps)
			}
		}
		const lim = Math.max(0, 5 - (relatedPosts?.length ?? 0))
		const nextPosts = await payload.find({
			collection: "posts",
			draft: false,
			limit: lim,
			depth: 0,
			overrideAccess: true,
			where: {
				id: {
					not_in: [id, ...payloadPosts],
				},
			},
		}).then(r => r.docs.flatMap(d => {
			if (d.id) {
				return d.id
			} else {
				return []
			}
		})).catch((e) => {
			payload.logger.error({
				message: `Error while retrieving posts sans relatedPosts for ${id}`,
				error: e,
			})
			return [] as string[]
		})
		if (nextPosts && nextPosts.length > 0) {
			payloadPosts.push(...nextPosts)
		}
		return payloadPosts
	},
)
