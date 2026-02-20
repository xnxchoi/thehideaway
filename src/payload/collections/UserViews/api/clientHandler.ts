"use client"

import type {Bookmark} from "@/payload-types"
import type {TrackedTargetType} from "./trackUserView"

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
 