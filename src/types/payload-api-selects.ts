import {ImageCollectionOverviewSelect} from "@/types/collections/image-collections";

export const imageSelect = (): ImageCollectionOverviewSelect => ({
	url: true,  
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