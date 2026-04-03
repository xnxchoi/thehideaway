"use server"
import {clamp} from "@/utilities/mathUtilities"
import {UserView} from "@payload-types";
import {Payload} from "payload"
import {cache} from "react"

export type TrackedTargetType = UserView['target']['relationTo']

interface TrackViewParams {
	payload: Payload
	user: string
	target: string
	targetType: TrackedTargetType
	progress: number
	viewed?: boolean
	lastViewed?: string | null
}

export const trackUserView = cache(async ({
	payload,
	user,
	target,
	targetType,
	progress,
	viewed,
	lastViewed
}: TrackViewParams): Promise<{
	id: string
	user: string
	target: {
		relationTo: TrackedTargetType
		value: string
	}
	version: string
	viewed: boolean
	progress: number
	lastViewed?: string | null
} | Error> => {
	const collection = targetType

	try {
		// Get the current published version of the post
		const post = await payload.findVersions({
			collection: collection,
			where: {
				and: [
					{
						parent: {
							equals: target,
						},
					},
					{
						_status: {
							equals: 'published',
						},
					},
				],
			},
			sort: '-createdAt',
			limit: 1,
			depth: 1,
			overrideAccess: true,

		}).then(res => res.docs).then(r => r[0]?.id || null).catch(e => {
			payload.logger.error('Error finding post:', e)
			return null
		})
		console.log('queried with _status', post)
		const controlPost = await payload.findVersions({
			collection: collection,
			where: {
				and: [
					{
						parent: {
							equals: target,
						},
					},
					{
						version__status: {
							equals: 'published',
						},
					},
				],
			},
			sort: '-createdAt',
			limit: 1,
			depth: 1,
			overrideAccess: true,
		}).then(res => res.docs).then(r => r[0]?.id || null).catch(e => {
			payload.logger.error('Error finding post:', e)
			return null
		})
		console.log('queried with version__status', controlPost)

		if (!post) throw new Error('Post not found')

		// Get the latest version ID
		// When a document is published, _status is 'published' and it has a version
		const currentVersionID = post

		// Find existing view record
		const existingView = await payload.find({
			collection: 'userViews',
			where: {
				and: [
					{user: {equals: user}},
					{'target.value': {equals: target}},
					{'target.relationTo': {equals: collection}},
					{version: {equals: currentVersionID}},
				],
			},
			sort: '-updatedAt',
			limit: 1,
			overrideAccess: true,
			pagination: false,
			depth: 1,
		}).then(res => res.docs).then(r => r[0] || null).catch(e => {
			payload.logger.error('Error finding user view:', e)
			return null
		})
		const normalizedProgress = clamp(progress, 0.00, 1.00)
    let dataViewed = normalizedProgress > 0
		if (typeof viewed === 'boolean') {
			dataViewed = viewed || dataViewed
		}
		const viewData = {
			user: user,
			target: {
				relationTo: collection,
				value: target,
			},
			version: currentVersionID,
			viewed: dataViewed,
			progress: normalizedProgress,

		}

		if (existingView) {
			const currentView = existingView
			// Delete all but the current doc
			await payload.delete({
				collection: 'userViews',
				where: {
					and: [
						{user: {equals: user}},
						{'target.value': {equals: target}},
						{version: {equals: currentVersionID}},
						{
							id: {
								not_equals: currentView.id
							}
						}
					],
				},
				overrideAccess: true,
			})
			const finalProgress = Math.max(currentView.progress, viewData.progress)


			const passedData = {
				...currentView,
				progress: finalProgress,
				version: viewData.version,
			}
			if (viewData.viewed) {
				passedData.viewed = true
				passedData.lastViewed = new Date().toISOString()
			}
			const res = await payload.update({
				collection: 'userViews',
				id: currentView.id,
				data: {
					...passedData,
				},
				overrideAccess: true,
			}).then(r => r).catch(e => {
				payload.logger.error('Error updating user view:', e)
				return null
			})
			if (!res) throw new Error('Failed to update user view')
			return {
				id: res.id,
				user: res.user as string,
				target: res.target as { relationTo: TrackedTargetType, value: string },
				version: res.version,
				viewed: res.viewed,
				progress: res.progress,
				lastViewed: res.lastViewed,
			}
		} else {
			// Create new view record
			const res = await payload.create({
				collection: 'userViews',
				data: {
					...viewData,
				},
				overrideAccess: true,
			}).catch(e => {
				payload.logger.error('Error creating user view:', e)
				throw new Error('Failed to create user view. Error: ' + e.message, {cause: e})
			})

			return {
				id: res.id,
				user: res.user as string,
				target: res.target as { relationTo: TrackedTargetType, value: string },
				version: res.version,
				viewed: res.viewed,
				progress: res.progress,
				lastViewed: res.lastViewed,
			}
		}
	} catch (error) {
		payload.logger.error('Error tracking user view:',  )
		if (error instanceof Error) {
			return error
		}
		return new Error('Failed to track user view', {cause: error})
	}
})