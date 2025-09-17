'use server'
import {PayloadHandler} from "payload";
import {ProcessedRangy} from "@/components/UX/Highlightr/types";
import {queryCitations} from "@collections/Citations/query";
import {HighlightsCollection} from "@/components/UX/Highlightr/provider";

export const citationHandler:PayloadHandler=async (req) => {
	const user = req.user;
	const params = req.query;
	const id = params?.id;
	const collection = params?.collection;
	if (
		!id ||
		!collection ||
		typeof id !== "string" ||
		typeof collection !== "string" ||
		(collection !== "posts" && collection !== "delta")
	) {
		return Response.json(
			{
				error: "Unauthorized",
				message: "Invalid route - id is required",
			},
			{
				status: 401,
			},
		);
	}
	if (!user) {
		return Response.json(
			{
				error: "Unauthorized",
				message: "You must be logged in to access this endpoint",
			},
			{
				status: 401,
			},
		);
	}
	const isgood = user.collection === "admins" || !user.banned;
	if (!isgood) {
		return Response.json(
			{
				error: "Unauthorized",
				message: "You have been banned from using this endpoint",
			},
			{
				status: 401,
			},
		);
	}
	const payload = req.payload;
	try {
		const citations=await queryCitations({
			userId:user.id,
			collection:collection as HighlightsCollection,
			id,
		})
		return Response.json(
			{
				docs: citations,
				user: user.id,
				target: {
					value: id,
					relationTo: collection,
				},
			},
			{
				status: 200,
			},
		);
	} catch (e) {
		payload.logger.error(
			e,
			`Error fetching citations for ${collection} id: ${id} with user ${user.id}`,
		);
		return Response.json(
			{
				error: "Internal Server Error",
				message: "An error occurred while fetching citations",
			},
			{
				status: 500,
			},
		);
	}
}