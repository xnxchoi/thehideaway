'use server'
import {getPayload, PaginatedDocs} from "payload"
import configPromise from '@payload-config'
import {Delta, type Search} from '@/payload-types'

import {cache} from 'react'

export const getNextDeltas: (props: {
	id: string
	relatedDeltas?: Delta["relatedDeltas"]
}) => Promise<Array<string>> = cache(
	async (props: { id: string; relatedDeltas?: Delta["relatedDeltas"] }) => {
		const {id, relatedDeltas} = props
		const payloadDeltas: string[] = []
		const payload = await getPayload({config: configPromise})
		if (relatedDeltas && relatedDeltas.length > 0) {
			const ids = relatedDeltas.flatMap((delta) =>
				typeof delta.value === "string" || false ? delta.value : delta.value.id,
			)
			const relPosts = await payload.find({
				collection: "search",
				where: {
					and: [
						{
							'doc.value': {
								in: ids,
							},
						}, {
							'doc.relationTo': {
								in: ['delta', 'posts', 'users'],
							},
						}
					],
				},
				select: {
					doc: true,
				}
			}).catch((e) => {
				console.error({
					message: `Error while retrieving related deltas for ${id}`,
					error: e,
				})
			})
			if (relPosts && relPosts.totalDocs > 0) {
				const ps = relPosts.docs.flatMap((doc) => {
					if (typeof doc.doc.value === "string") return doc.doc.value
					return []
				})
				payloadDeltas.push(...ps)
			}
		}
		const lim = Math.max(0, 5 - (relatedDeltas?.length ?? 0))
		const nextDeltas: PaginatedDocs<Pick<Search, "doc">> | null = await payload.find({
			collection: "search",
			draft: false,
			limit: lim,
			select: {
				doc: true,
			},
			pagination: false,
			overrideAccess: true,
			where: {
				'doc.value': {
					not_in: [id, ...payloadDeltas],
				},
			},
		}).then((res) => {
			if (res && res.docs && res.docs.length > 0) {
				return res
			}
			return null
		}).catch((e) => {
			payload.logger.error({
				message: `Error while retrieving content sans relatedDeltas for ${id}`,
				error: e,
			})
			return null
		})
		if (nextDeltas && nextDeltas.totalDocs > 0) {
			const ps = nextDeltas.docs.flatMap((doc) => {
				if (typeof doc.doc.value === "string") {
					return doc.doc.value
				} else {
					return []
				}
			})
			payloadDeltas.push(...ps)
		}
		return payloadDeltas
	},
)
