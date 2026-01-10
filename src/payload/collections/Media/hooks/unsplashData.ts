import {RenderImageFields} from "@/types/collections/image-collections";
import {SavedMetadataUnsplash, UnsplashImageDoc} from "@/types/ImageCollections/unsplash";
import {hexToRgb} from "@/utilities/rp_utils";

export const formatUnsplashData = (image: UnsplashImageDoc): {
	image: Omit<RenderImageFields, "caption"> & { caption: string };
	form: Omit<SavedMetadataUnsplash, "source"> & {
		url: string;
	}
} => {
	const {links, description, width, height, blur_hash, user, urls, color} = image
	const rgb = hexToRgb(color)
	const darkmode = rgb.reduce((previousValue, currentValue,) => previousValue || (currentValue < 0.5), false)
	const alt =
		description || "Curated Unsplash Image"
	const caption =
		`Photo by ${user.name} on Unsplash`;
	return {
		image: {
			width, height: height * (1080 / width), darkmode, alt, caption, src: urls.regular
		}, form: {

			url: urls.full
		}
	}
}