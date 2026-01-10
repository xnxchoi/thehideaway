import type {
	PostOverviewSelector,
	SinglePostSelector
} from "@/payload/collections/Posts/api/queryBase";
import type {
	FetchedImageDoc,
	ImageCollectionSlug,
	ProcessedImageDoc,
	RalueAsDataWithRelation
} from "@/types/collections/image-collections";
import {Post} from "@payload-types";
import type {BasePayload, Where} from "payload";
import {cache} from "react";

type SelectChoice = PostOverviewSelector | SinglePostSelector

export async function getImageMedia<T extends SelectChoice>({post, payload}: {
	post: Pick<Post, "image"> & {
		[x in keyof Omit<Post, "image">]?: Post[x] | unknown
	}
	payload: BasePayload
}) {
	const pImage = post.image;
	let image: RalueAsDataWithRelation | null = null;
	let imageId: null | string = null;
	try {

		if (!!pImage) {
			switch (typeof pImage.value) {
				case "string": {
					imageId = pImage.value;
				}
					break;
				case "object": {
					imageId = pImage.value.id;
				}
					break;
			}
			if (typeof imageId === "string") {
				const i = await getImageOverview({
					payload,
					collection: pImage.relationTo,
					id: imageId
				});
				if (i) {
					image = i;
				}

			}
		}
	} catch (e) {
		console.error(`Error in getImageMedia for post: ${post.id},
\n\tpost data:
	`, post,
			!!image ? `\n\timage:\n\t\tcollection :\t${image.relationTo}\n\t\tid :\t${image.value.id}` : `\n\timage:\t\tnull`,
			`\n\terror:`, e
		)
	}
	return image;
}

export const getImageOverview = cache(async <T extends ImageCollectionSlug>({
	                                                                            collection,
	                                                                            payload,
	                                                                            ...props
                                                                            }: {
	                                                                            collection: T;
	                                                                            payload: BasePayload;
                                                                            } & ({
	                                                                            id: string;
                                                                            } | {
	                                                                            where: Where;
                                                                            })
) => {
	if ("id" in props) {
		const {id} = props;
		return await getImageOverviewByID({payload, id, collection})
	} else {
		const {where} = props;
		return await getImageOverviewByQuery({payload, collection, where})
	}
})

export const getImageOverviewByQuery = cache(async <T extends ImageCollectionSlug>({
	                                                                                   payload,
	                                                                                   collection,
	                                                                                   where
                                                                                   }: {
	payload: BasePayload;
	collection: T;
	where: Where
}): Promise<RalueAsDataWithRelation<T> | null> => {
	const imageItem = await payload.find({
		collection: collection as "assets" | "userMedia" | "media",
		where,
		limit: 1,
		pagination: false,
		select: {
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
		},
		overrideAccess: true
	}).then(r => {
		const doc = r.docs[0];
		if (!doc) {
			return null;
		}
		if (!("id" in doc)) return null;
		const {url, ...rest} = doc;
		if (typeof url === "string") {
			return {
				...rest,
				url,
				src: url,
			} satisfies ProcessedImageDoc
		}
		return null;

	});
	if (!!imageItem) {
		return {
			relationTo: collection,
			value: {
				...imageItem,
			}
		}
	}
	return null;
})
export const getImageOverviewByID = cache(async <T extends ImageCollectionSlug>({
	                                                                                payload,
	                                                                                id,
	                                                                                collection
                                                                                }: {
	payload: BasePayload;
	id: string;
	collection: T
}): Promise<RalueAsDataWithRelation<T> | null> => {
	const imageItem = await payload.findByID({
		collection,
		id,
		select: {
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
		},
		overrideAccess: true
	}) as FetchedImageDoc
	if (imageItem) {
		const {url, ...rest} = imageItem;
		if (url) {
			const value = {
				...rest,
				src: url, url,
			}satisfies ProcessedImageDoc
			return {
				relationTo: collection,
				value
			}
		}
	}
	return null;
})