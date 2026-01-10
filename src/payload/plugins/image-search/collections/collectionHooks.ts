import {ImageCollection, ImageCollectionSlug} from "@/types/collections/image-collections";
import {getLuminance} from "@/utilities/extractImageInfo";
import type {CollectionAfterReadHook, CollectionBeforeChangeHook, CollectionConfig} from "payload"

const processImage: CollectionBeforeChangeHook<ImageCollection> = async ({
	                                                                         data,
	                                                                         collection,
	                                                                         operation,
	                                                                         req,
	                                                                         context
                                                                         }) => {
	if (operation === "create" || operation === "update") {
		// 1. Auto-generate Alt Text from Filename if missing
		if (!data.alt && data.filename) {
			// "my-cool-image.jpg" -> "My Cool Image"
			data.alt = data.filename
				.replace(/\.[^/.]+$/, "") // remove extension
				.replace(/[-_]/g, " ")    // replace separators
				.replace(/\b\w/g, l => l.toUpperCase()); // capitalize
		}
		// We only do this if a file was uploaded (req.files.file exists)
		if (req.file && req.file.data) {
			try {
				const buffer = req.file.data;
				const brightness = await getLuminance(buffer);

				// If brightness < 0.5, it's dark
				data.darkmode = brightness < 0.5;

				console.log(`Image processed: Brightness ${brightness.toFixed(2)} | Darkmode: ${data.darkmode}`);
			} catch (err) {
				console.error("Error calculating image brightness", err);
			}
		}
	}
	return data;
}
const populateImgFields: CollectionAfterReadHook<ImageCollection> = async ({
	                                                                           doc,
	                                                                           collection,
	                                                                           req
                                                                           }) => {
	let disabled = false;
	let src = "";
	let url =
		doc?.url;
	let tried = false;
	while (!url && !tried) {
		tried = true;
		const maybeurl = await req.payload.findByID({
			id: doc.id,
			collection: collection.slug as ImageCollectionSlug,
			select: {
				url: true,
				filename: true,
			}
		})
		if (typeof maybeurl.url === "string") {
			url = maybeurl.url;
		}
	}
	if (!url) {
		disabled = true;
	} else {

		src = url;
	}

	return {

		...doc
		, disabled,
		src, url,
	}
}
const beforeChangeHooks: CollectionBeforeChangeHook<ImageCollection>[] = [
	processImage
]
const afterReadHooks: CollectionAfterReadHook[] = [
	populateImgFields
]

const imageHooks: CollectionConfig["hooks"] = {
	beforeChange: beforeChangeHooks,
	afterRead: afterReadHooks
}
export {imageHooks}