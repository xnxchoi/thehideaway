import {IndexedCollection, IndexedCollectionSlug} from "@/payload/plugins/plugin-search/types";
import {getFallbackImage} from "@/utilities/getFallbackImage";
import {CollectionAfterChangeHook, DataFromCollectionSlug} from "payload";

export const populateMeta: CollectionAfterChangeHook<IndexedCollection> = async ({
	                                                                                 collection,
	                                                                                 data,
	                                                                                 doc: d,
                                                                                 }) => {
	const collectionSlug = collection.slug as IndexedCollectionSlug
	switch (collectionSlug) {
		case "surf": {
			const doc = d as DataFromCollectionSlug<"surf">
			return {
				...doc, meta: {
					...doc.meta,
					image: doc.meta?.image || await getFallbackImage(),
					slug: doc.slug
				}
			}
		}
	}
}