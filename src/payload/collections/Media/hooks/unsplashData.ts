import {SavedMetadataUnsplash, UnsplashImageDoc} from "@/payload/collections/Media/hooks/types";
import {RenderImageFields} from "@/types/collections/imageCollections";
import {hexToRgb} from "@/utilities/rp_utils";

export const formatUnsplashData = (image: UnsplashImageDoc): {
	image: Omit<RenderImageFields, "caption"> & { caption: string };
	form: Omit<SavedMetadataUnsplash, "source"> & {
		url: string;
		source: { provider: "unsplash", identifier: string, link: string }
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
			source: {
				provider: "unsplash" as const,
				identifier: image.id,
				link: urls.thumb
			},
			attribution: {
				name: user.name,
				link: user.links.html
			},
			url: urls.raw
		}
	}
}