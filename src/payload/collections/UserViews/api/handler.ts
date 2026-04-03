import {clamp} from "@/utilities/mathUtilities"
import {addDataAndFileToRequest, PayloadHandler} from "payload"
import {type TrackedTargetType, trackUserView} from "./trackUserView"

export const userViewHandler: PayloadHandler = async (req) => {
	await addDataAndFileToRequest(req)
	const validCollections: TrackedTargetType[] = ['posts', 'surf', 'playlists', 'profile',
		'albums', 'tracks']

	const curUser = req.user
	if (!curUser) {
		return Response.json({
			error: 'Unauthorized',
			data: null
		}, {status: 401})
	}
	if (!req.data) {
		return Response.json({
			error: 'No data found in request body; if this is a request to update a user view, ensure that the request body contains the following fields: user, target, progress, viewed, targetType. Refer to the UserView schema for the expected types for each field.',
			data: null
		}, {status: 400})
	}

	const query = req.data
	const {
		user,
		target,
		progress,
		viewed,
		targetType,
		...rest
	} = query

	const tester = [user, target, progress, viewed, targetType]
	const testerString = ['user', 'target', 'progress', 'viewed', 'targetType']
	if (tester.some(item => item === undefined)) {
		const toreturn = tester.reduce((acc, item, index) => {
			if (item === undefined) {
				acc += ', ' + testerString[index]
			}
			return acc
		}, "")
		return Response.json({
			error: 'The following required fields are missing: ' + toreturn + '. Please ensure that all required fields are provided and try again.',
			data: null
		}, {status: 400})
	}
	let toreturn = ""
	if (typeof user !== 'string') {
		toreturn += 'user: expected string, got ' + typeof user + ' '
	}
	if (typeof target !== 'string') {
		toreturn += 'target: expected string, got ' + typeof target + ' '
	}
	if (typeof progress !== 'number') {
		toreturn += 'progress: expected number, got ' + typeof progress + ' '
	}

	if (typeof targetType !== 'string') {
		toreturn += 'targetType: expected string, got ' + typeof targetType + ' '
	}
	if (curUser.id !== user) {
		if (curUser.role !== 'admin') {
			return Response.json({
				error: 'Unauthorized. You can only update your own view history.',
				data: null
			}, {status: 401})
		}
	}
	if (toreturn.length > 0) {
		return Response.json({
			error: 'The following fields\' values are not of the correct type: ' + toreturn + '. Please try again.',
			data: null
		}, {status: 400})
	}
	if (!validCollections.some(collection => (collection as string) === targetType)) {
		return Response.json({
			error: 'Invalid target type, ' + targetType + ' is not a valid collection. Target type must be one of the following collection slugs: ' + validCollections.join(
				' | '),
			data: null
		}, {status: 400})
	}

	const payload = req.payload

	const targetCollection = targetType as TrackedTargetType
	const progressNumber = clamp(progress, 0.00, 1.00)
  const viewedBoolean = typeof viewed === 'boolean' ? viewed : progressNumber > 0
	const res: {
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
	} | Error = await trackUserView({
		payload,
		user,
		target,
		targetType: targetCollection,
		progress: progressNumber,
		viewed: viewedBoolean
	}).catch(e => {
		payload.logger.error('Error updating user view:', e)
		return e
	})
	if (res instanceof Error) {
		return Response.json({
			error: 'Failed to update user view. Error: ' + res.message,
			data: null
		}, {status: 500})
	}
	return Response.json({
		message: 'User view updated successfully',
		data: res,

	}, {status: 200})
}