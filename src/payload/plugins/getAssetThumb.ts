import {getPayload} from "payload";
import config from "@payload-config";
import {cache} from "react";

export const getAssetThumb = cache(async (): Promise<string> => {
	const payload = await getPayload({config});
	const asset = await payload.find({
		collection: "assets",
		where: {
			and: [
				{
					mimeType: {
						like: "image/%",
					},
				},
				{
					thumbnailURL: {
						exists: true,
					},
				},
			],
		},
		limit: 1,
		select: {
			thumbnailURL: true,
			url: true,
		},
	}).then((res) => res.docs[0]);
	return asset?.thumbnailURL || asset?.url || "";
});
