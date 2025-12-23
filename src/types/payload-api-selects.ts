import {BaseImageSelect} from "@/types/collections/imageCollections";

export const imageSelect = (): BaseImageSelect => ({
	url: true, source: true,
	darkmode: true,
	alt: true,
	caption: true,
	filename: true, sizes: true,
	mimeType: true,
	width: true, src: true,
	height: true,
	blurDataUrl: true,
	thumbnailURL: true,
	id: true
})