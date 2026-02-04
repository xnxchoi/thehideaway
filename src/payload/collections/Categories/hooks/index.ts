// Helper to update a specific category
import {TaggedCollection, TaggedCollectionSlug} from "@/payload/collections/Tags";
import {arraysEqualContents} from "@/utilities/compareArrays";
import {Flatten} from "@/utilities/typeUtilities";
import {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
	CollectionConfig,
	CollectionSlug,
	PayloadRequest
} from "payload";

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
export type CollectionHookArgs<T extends keyof NonNullable<CollectionConfig["hooks"]>, F extends CollectionSlug = CollectionSlug> = Parameters<NonNullable<Flatten<NonNullable<CollectionConfig<F>["hooks"]>[T]>>>[0];
export const tagsDidChange = <T extends TaggedCollectionSlug>({
	                                                              operation,
	                                                              doc,
	                                                              previousDoc,
                                                              }: {
	collection: T
} & Pick<CollectionHookArgs<"afterChange", T>, "operation" | "doc" | "previousDoc"> & Partial<Omit<CollectionHookArgs<"afterChange", T>, "operation" | "doc" | "previousDoc" | "collection">>) => {
	if (operation === "create") return true;
	const currentIsArray = Array.isArray(doc.tagged),
		previousIsArray = Array.isArray(previousDoc.tagged);
	const areBothArraysOrNeither = currentIsArray === previousIsArray
	const verdict = (!areBothArraysOrNeither) ? true : currentIsArray && !arraysEqualContents((previousDoc.tagged as NonNullable<typeof previousDoc.tagged>), (doc.tagged as NonNullable<typeof doc.tagged>)) || false;
	return {currentIsArray, previousIsArray, verdict,}
}
export const updateTagsAfterChange: CollectionAfterChangeHook<TaggedCollection> = async ({
	                                                                                         doc,
	                                                                                         previousDoc,
	                                                                                         operation,
	                                                                                         req,
	                                                                                         collection
                                                                                         }) => {
	// If creation, or if the category field changed
	if (operation === "create" || operation === "update" && tagsDidChange({
		collection: collection.slug as TaggedCollectionSlug,
		doc,
		operation,
		previousDoc
	})) {
		let tagsToLookUp: string[] = []
		const tagsToUpdate: Array<{
			tagID: string;
			tagCount: number;
		}> = []
		// Update the NEW category
		if (doc.tagged && doc.tagged.length > 0) {
			tagsToLookUp.push(...doc.tagged.map(tag => typeof tag === "string" ? tag : tag.id))
		}
		if (operation === "update" && previousDoc.tagged && previousDoc.tagged.length > 0) {
			tagsToLookUp.push(...previousDoc.tagged.map(tag => typeof tag === "string" ? tag : tag.id))
		}
		tagsToLookUp = [...new Set(tagsToLookUp)];
		for (const tagID of tagsToLookUp) {
			const tagCount = await req.payload.findByID({
				collection: "tags",
				id: tagID,
				overrideAccess: true,
				select: {
					taggedItems: true
				},
				joins: {
					taggedItems: {
						count: true
					}
				},

				req
			}).then(r => r.taggedItems?.totalDocs || 0).catch(e => {
				req.payload.logger.error("Error while querying count for tag with ID : " + tagID + " : " + e.message);
				return null;
			})
			if (typeof tagCount === "number") {
				tagsToUpdate.push({tagID, tagCount})
			}
		}
		for (const {tagID, tagCount} of tagsToUpdate) {
			console.log("Updating tag count for tag with ID : " + tagID + " to " + tagCount)
			await req.payload.update({
				collection: "tags",
				id: tagID,
				data: {
					tagCount
				}, overrideAccess: true, req
			})
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