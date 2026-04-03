import {HighlightsCollectionSlug} from "@/components/UX/Highlightr/types";
import {queryCitations} from "@/payload/collections/Citations/query";
import {PayloadHandler} from "payload";

export const citationHandler: PayloadHandler = async (req) => {
	const user = req?.user;
	const params = req.query;
	const id = params?.id;
	const collection = params?.collection;
	if (
		!id ||
		!collection ||
		typeof id !== "string" ||
		typeof collection !== "string" ||
		(collection !== "posts" && collection !== "surf")
	) {
		return Response.json(
			{
				error: "Unauthorized",
				message: "Invalid route - id is required"
			},
			{
				status: 401
			}
		);
	}
	if (!user) {
		return Response.json(
			{
				error: "Unauthorized",
				message: "You must be logged in to access this endpoint"
			},
			{
				status: 401
			}
		);
	}
	const isgood = user.collection === "admins" || !user.banned;
	if (!isgood) {
		return Response.json(
			{
				error: "Forbidden",
				message: "You have been banned from using this endpoint"
			},
			{
				status: 403
			}
		);
	}
	const payload = req.payload;
	try {
		const citations = await queryCitations({
			userId: user.id,
			collection: collection as HighlightsCollectionSlug,
			id
		});
		return Response.json(
			{
				docs: citations,
				user: user.id,
				target: {
					value: id,
					relationTo: collection
				}
			},
			{
				status: 200
			}
		);
	} catch (e) {
		payload.logger.error(
			e,
			`Error fetching citations for ${collection} id: ${id} with user ${user.id}`
		);
		return Response.json(
			{
				error: "Internal Server Error",
				message: "An error occurred while fetching citations"
			},
			{
				status: 500
			}
		);
	}
};
