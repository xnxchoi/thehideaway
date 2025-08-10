import {CollectionAfterDeleteHook} from "payload";
import {Profile} from "@/payload-types";

export const revalidateDeleteProfile: CollectionAfterDeleteHook<
	Profile
> = async ({doc, req}) => {
	const payload = req.payload;
	const context = req.context;
	try {
		await payload.delete({
			collection: "bookmarks",
			overrideAccess: true,
			where: {
				and: [
					{
						"target.id": {
							equals: doc.id,
						},
					},
					{
						"target.relationTo": {
							equals: "profile",
						},
					},
				],
			},
			req,
			context: {
				...context,
				overrideAccess: true,
			},
		});
	} catch (e) {
		req.payload.logger.error(e);
	}
	return doc;
};
