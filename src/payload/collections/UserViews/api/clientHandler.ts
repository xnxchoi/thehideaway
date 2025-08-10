'use client'

import {stringify} from "qs-esm"
import type {TrackedTargetType} from "./trackUserView"
import type {Where} from "payload"
import {getBookmarks} from '../../Bookmarks/createBookmark'
import type {Bookmark} from "@/payload-types"

type UpdateHistoryParams = {
	userId: string
	targetValue: string
	progress: number
	viewed: boolean
	collection: TrackedTargetType
}
type GetHistoryParams = {
	userId: string
	targetValue: string
	collection: TrackedTargetType
}
type GetQueueHistoryParams = {
	userId: string
	targetValues: string[]
	collection: TrackedTargetType
}
type GetPolymorphicHistoryParams = {
	userId: string
	targets: {
		relationTo: TrackedTargetType
		value: string
	}[]
}
type SyncedUserView = {
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
}
type GetBookmarkParams = {
	userId: string
	targetValue: string
	collection: TrackedTargetType
}

interface UserViewAPI {
	updateView: (data: UpdateHistoryParams) => Promise<SyncedUserView | Error>
	getView: (data: GetHistoryParams) => Promise<SyncedUserView | Error>
	getBookmark: (data: GetBookmarkParams) => Promise<Bookmark | Error>
}

export const UserViewClient: UserViewAPI = {
	updateView: async (data: UpdateHistoryParams) => {

		const res = await fetch('/api/userViews/updateHistory', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify({
				user: data.userId,
				target: data.targetValue,
				progress: data.progress,
				viewed: data.viewed,
				targetType: data.collection as string,
			}),
		})
		if (!res.ok) {
			throw new Error('Failed to update history')
		}
		return res.json() as Promise<SyncedUserView>
	},
	/**
	 * Fetches the user view history for a specific article and user.
	 *
	 * @param {GetHistoryParams} data - The parameters for fetching history.
	 * @param {string} data.userId - The ID of the user.
	 * @param {string} data.articleId - The ID of the article.
	 * @param {TrackedTargetType} data.collection - The collection of the article.
	 * @returns {Promise<SyncedUserView | Error>} A promise that resolves when the user view history is fetched.
	 */
	getView: async (data: GetHistoryParams): Promise<SyncedUserView | Error> => {
		const {userId, targetValue, collection} = data
		const where: Where = {
			and: [
				{
					user: {
						equals: userId
					},
					'target.value': {
						equals: targetValue
					},
					'target.relationTo': {
						equals: collection
					}
				}
			]
		}
		const query = stringify({where}, {addQueryPrefix: true})
		const res = await fetch(`/api/userViews${query}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',

		})
		if (!res.ok) {
			throw new Error('Failed to get history')
		}
		return res.json() as Promise<SyncedUserView>
	}

} 