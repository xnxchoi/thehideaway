import type {UploadConfig} from "payload"

const
	imageSizes: NonNullable<UploadConfig["imageSizes"]> = [
		// 1. Tiny thumbnails for search results or dense sidebar lists
		{
			name: "thumb",
			width: 320,

			formatOptions: {
				format: "webp",

				options: {
					quality: 75,
					effort: 6, // Maximize compression (0-6)
				},
			},
		},
		// 2. The Workhorse: Covers Mobile (100% width) and Desktop Cards (33% width)
		// This is the most frequently used size on your site.
		{
			name: "card",
			width: 768,
			formatOptions: {
				format: "webp",
				options: {
					quality: 80,
					effort: 6,
				},
			},
		},
		// 3. Article Body: For images embedded inside the text of Regular articles.
		// Standard reading width is usually ~700-800px. This size ensures they look crisp.
		{
			name: "content",
			width: 1024,
			formatOptions: {
				format: "webp",
				options: {
					quality: 80,
					effort: 6,
				},
			},
		},
		// 4. Tablet Hero / Desktop Split: Good for 50/50 layouts or "wide" images in text
		{
			name: "content_wide",
			width: 1400,
			height: undefined,
			formatOptions: {
				format: "webp",
				options: {
					quality: 80,
					effort: 6,
				},
			},
		},
		// 5. Feature Hero: The full-bleed cover for Feature pieces.
		// We bump quality slightly to 85 because artifacts are visible in dark themes.
		{
			name: "hero",
			width: 1920,
			height: undefined,
			withoutEnlargement: true,
			formatOptions: {
				format: "webp",
				options: {
					quality: 85,
					effort: 6,
				},
			},
		},
		// 6. Social Sharing (Open Graph) - Strict dimensions required
		{
			name: "og",
			width: 1200,
			height: 630,
			crop: "center", // Force correct ratio
			formatOptions: {
				format: "webp",
				options: {
					quality: 80,
				},
			},
		},
	]
const adminThumbnail: NonNullable<UploadConfig["adminThumbnail"]> = "thumb";
const focalPoint: NonNullable<UploadConfig["focalPoint"]> = true;
const filenameCompoundIndex: NonNullable<UploadConfig["filenameCompoundIndex"]> = ["filename", "createdAt"];
const formatOptions: NonNullable<UploadConfig["formatOptions"]> = {
	format: "webp",
	options: {quality: 85}
};
const mimeTypes: NonNullable<UploadConfig["mimeTypes"]> = ["image/jpeg", "image/png", "image/webp"]
export const configureUpload = (config: UploadConfig): UploadConfig => {
	const mimeSet = new Set(...[...(config.mimeTypes || [])]);
	if (mimeSet.has("image/*")) {
		mimeSet.delete("image/*");
	}

	mimeTypes.forEach(m => mimeSet.add(m));
	return {
		...config,
		mimeTypes: [...mimeSet],
		adminThumbnail,
		focalPoint,
		filenameCompoundIndex,
		formatOptions,
		imageSizes: [...imageSizes]
	}

}