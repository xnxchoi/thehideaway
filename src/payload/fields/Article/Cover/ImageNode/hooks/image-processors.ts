// 1. Process Payload Doc
import {FetchedUnsplashImage} from "@/payload/collections/Media/hooks/types";
import {RPFetchError} from "@/payload/fields/Article/Cover/ImageNode/utils/errors";
import {
	RP_InternalImageNodeData
} from "@/payload/fields/Article/Cover/rp-image/server/node/RP_ImageNode";
import {
	FetchedImageDoc,
	ProcessedImageDoc,
	RenderImageFields
} from "@/types/collections/imageCollections";

export const processImageForNode = (doc: FetchedImageDoc): RP_InternalImageNodeData => {
	// 1. Unify src/url logic
	const safeUrl = doc.url || doc.src;

	// 2. The "Gatekeeper" Check
	// If this fails, the UI never sees the bad object.
	if (!safeUrl) {
		throw new RPFetchError(`Image ${doc.id} exists but has no URL.`);
	}
	const base: RP_InternalImageNodeData = {
		src: safeUrl,
		darkmode: doc.darkmode,
		alt: doc.alt,
		span: 100,
		showCaption: false
	}
	const {height, width, caption} = doc;
	if (!!height) {
		base.height = height;
	}
	if (!!width) {
		base.width = width;
	}
	if (!!caption) {
		base.caption = caption;
		base.showCaption = true;
	}
	return base;
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