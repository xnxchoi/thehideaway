import type {CollectionAfterChangeHook, CollectionAfterDeleteHook} from 'payload'

import {revalidatePath, revalidateTag} from 'next/cache'
import {Post} from '@/payload-types'
import {arraysEqualContents} from "@/utilities/compareArrays";

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
	doc,
	previousDoc,
	req: {payload, context},
}) => {
	if (!context.disableRevalidate) {
		if (doc._status === 'published') {
			let changed=(doc._status!==previousDoc._status)
			changed=changed||doc.slug!==previousDoc.slug
			changed=changed||doc.locked!==previousDoc.locked
			if(doc.locked&&previousDoc.locked){
				const nowAllowlist=(doc.allowList||null)
				const prevAllowlist=(previousDoc.allowList||null)
				if(nowAllowlist){
					if(prevAllowlist){
						changed=changed||!arraysEqualContents(nowAllowlist,prevAllowlist)
					}else{
						changed=true
					}
				}
				const nowAuth=(doc.authority||1)
				const prevAuth=(previousDoc.authority||1)
				changed=changed||nowAuth!==prevAuth
			}
			if(changed) {
				const path = `/posts/${doc.slug}`

				payload.logger.info(`Revalidating post at path: ${path}`)

				revalidatePath(path)

				revalidateTag('posts-sitemap')
			}
		}

		// If the post was previously published, we need to revalidate the old path
		if (previousDoc._status === 'published' && doc._status !== 'published') {
			const oldPath = `/posts/${previousDoc.slug}`

			payload.logger.info(`Revalidating old post at path: ${oldPath}`)

			revalidatePath(oldPath)
			revalidateTag('posts-sitemap')
		}
	}
	return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
	doc,
	req: {context},
}) => {
	if (!context.disableRevalidate) {
		const path = `/posts/${doc?.slug}`

		revalidatePath(path)
		revalidateTag('posts-sitemap')
	}

	return doc
}
