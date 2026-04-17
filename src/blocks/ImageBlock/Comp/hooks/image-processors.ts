// 1. Process Payload Doc
import {RPFetchError} from "@/payload/fields/Article/Cover/ImageNode/utils/errors";
import {
	RP_InternalImageNodeData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {
	FetchedImageDoc,
	ProcessedImageDoc,
	RalueWithRelation,
	RenderImageFields
} from "@/types/collections/image-collections";
import {FetchedUnsplashImage} from "@/types/ImageCollections/unsplash";

export const processImageForNode = ({doc, relationTo, value}: {
	doc: FetchedImageDoc;
} & RalueWithRelation): {
	image: RP_InternalImageNodeData & { src: string };
	doc: ProcessedImageDoc
} & RalueWithRelation => {
	// 1. Unify src/url logic
	const safeUrl = doc.url || doc.src;

	// 2. The "Gatekeeper" Check
	// If this fails, the UI never sees the bad object.
	if (!safeUrl) {
		throw new RPFetchError(`Image ${doc.id} exists but has no URL.`);
	}
	const image: RP_InternalImageNodeData & { src: string } = {
		src: safeUrl!,
		darkmode: doc.darkmode,
		alt: doc.alt,
		span: 600,
		showCaption: false
	}
	const {height, width, caption} = doc;
	if (!!height) {
		image.height = height;
	}
	if (!!width) {
		image.width = width;
	}
	if (!!caption) {
		image.caption = caption;
		image.showCaption = true;
	}
	return {
		image, doc: {
			...doc,
			src: safeUrl,
			url: safeUrl,
		}, relationTo, value
	};
}
export const processFetchedImage = (doc: FetchedImageDoc): ProcessedImageDoc => {
	// 1. Unify src/url logic
	const safeUrl = doc.url || doc.src;

	// 2. The "Gatekeeper" Check
	// If this fails, the UI never sees the bad object.
	if (!safeUrl) {
		throw new RPFetchError(`Image ${doc.id} exists but has no URL.`);
	}

	// 3. Return the strict type
	return {
		...doc,
		url: safeUrl,
		src: safeUrl, // Ensure both are populated for convenience
		// Fallbacks for optional display fields
		alt: doc.alt || "Untitled Image",
		darkmode: doc.darkmode ?? false,
	};
};

// 2. Process Unsplash Fallback
export const processUnsplashFallback = (data: FetchedUnsplashImage): RenderImageFields => {
	const {fallback} = data;
	return {
		src: fallback.src,
		width: fallback.width,
		height: fallback.height,
		darkmode: fallback.darkmode,
		alt: fallback.alt,
		caption: data.form.caption,
		blurDataUrl: fallback.blurDataUrl,
		sizes: undefined, // Unsplash doesn't provide the Payload 'sizes' map
	};
};