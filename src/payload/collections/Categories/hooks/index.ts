// Helper to update a specific category
import {CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest} from "payload";

const updateCount = async (req: PayloadRequest, categoryId: string | number) => {
	if (!categoryId) return;
	const payload = req.payload;
	// 1. Count references in 'posts'
	const postsCount = await payload.count({
		collection: "posts",
		where: {category: {equals: categoryId}},
	});

	// 2. Count references in 'deltas'
	const deltasCount = await payload.count({
		collection: "delta",
		where: {category: {equals: categoryId}},
	});

	const total = postsCount.totalDocs + deltasCount.totalDocs;

	// 3. Update the category
	await payload.update({
		collection: "categories",
		id: categoryId,
		data: {
			popularity: total,
		}, overrideAccess: true,
		context: {
			...req.context,
			overrideAccess: true
		}
	});
};
export const updateCategoryAfterChange: CollectionAfterChangeHook = async ({
	                                                                           doc,
	                                                                           previousDoc,
	                                                                           operation,
	                                                                           req
                                                                           }) => {
	// If creation, or if the category field changed
	if (operation === "create" || (operation === "update" && doc.category !== previousDoc.category)) {
		// Update the NEW category
		if (doc.category) await updateCount(req, doc.category);

		// If the doc moved FROM an old category, update that one too
		if (previousDoc?.category && previousDoc.category !== doc.category) {
			await updateCount(req, previousDoc.category);
		}
	}
	return doc;
};

export const updateCategoryAfterDelete: CollectionAfterDeleteHook = async ({doc, req}) => {
	if (doc.category) {
		await updateCount(req, doc.category);
	}
	return doc;
};