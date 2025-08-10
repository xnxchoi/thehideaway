import {CollectionAfterDeleteHook, Payload, PayloadRequest} from "payload";

export const afterDelete: CollectionAfterDeleteHook = async ({
	doc,
	req: {payload},
}) => {
	try {
		await payload.delete({
			collection: "bookmarks",
			where: {
				and: [
					{
						"target.value": {
							equals: doc.id,
						},
					},
					{
						"target.relationTo": {
							equals: "posts",
						},
					},
				],
			},
			overrideAccess: true,
		});
	} catch (error) {
		console.error(error);
	}
};
