"use server"
import {CollectionSlug, PayloadHandler, PayloadRequest} from "payload"
import {cache} from "react"
import {getPostBookMarks} from "./getPostBookmarks"
import {createBookmark, deleteBookmark} from "../../Bookmarks/createBookmark"


export const postBookmarkSaveHandler: PayloadHandler = cache(async (req: PayloadRequest) => {

	const postId = req?.routeParams?.id
	const id = postId
	const query = req.query
	const curUser = req.user
	if (!curUser) {
		return Response.json({error: "Unauthorized"}, {status: 401})
	}
	if (!id) return Response.json({error: "Provide a post to query for; a post id"}, {status: 400})
	if ((typeof id !== 'string')) return Response.json({error: "Provide a valid post id"},
		{status: 400})
	const targetUser = query.user
	if (!targetUser) {
		return Response.json({error: "Provide a user id"}, {status: 400})
	}
	if (typeof targetUser !== 'string') {
		return Response.json({error: "Provide a valid user"}, {status: 400})
	}
	if (targetUser !== curUser.id) {
		if (curUser.role !== 'admin') {
			return Response.json({error: "Unauthorized"}, {status: 401})
		}
	}
	const data = await createBookmark(
		{payload: req.payload, user: targetUser, target: {relationTo: "posts", value: id}}).
		catch(error => error)
	if (data instanceof Error) {
		req.payload.logger.error(data.message)
		return Response.json({error: data.message}, {status: 500})
	}
	return Response.json({message: "Bookmark saved", data}, {status: 200})
})
export const unBookmarkPostHandler: PayloadHandler = cache(async (req: PayloadRequest) => {
	const postId = req?.routeParams?.id
	const id = postId
	const query = req.query
	const curUser = req.user
	if (!curUser) {
		return Response.json({error: "Unauthorized"}, {status: 401})
	}
	if (!id) return Response.json({error: "Provide a post to query for; a post id"}, {status: 400})
	if ((typeof id !== 'string')) return Response.json({error: "Provide a valid post id"},
		{status: 400})
	const targetUser = query.user
	if (!targetUser) {
		return Response.json({error: "Provide a user id"}, {status: 400})
	}
	if (typeof targetUser !== 'string') {
		return Response.json({error: "Provide a valid user"}, {status: 400})
	}
	if (targetUser !== curUser.id) {
		if (curUser.role !== 'admin') {
			return Response.json({error: "Unauthorized"}, {status: 401})
		}
	}
	const data = await deleteBookmark(
		{payload: req.payload, user: targetUser, target: {relationTo: "posts", value: id}})
	if (data.errors.length > 0) {
		req.payload.logger.error({message: data.errors})
		return Response.json({error: data.errors}, {status: 500})
	}
	return Response.json({message: "Bookmark deleted", data: data.docs}, {status: 200})
})