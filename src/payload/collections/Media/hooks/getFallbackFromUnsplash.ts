"use server";
import {cache} from "react";
import {
	UnsplashCollectionDoc,
	UnsplashFetchResult,
	UnsplashImageDoc
} from "@/payload/collections/Media/hooks/types";
import {blurhashToDataURI} from "@/payload/collections/Media/hooks/blurHashToDataUrl";
import {stringify} from "qs-esm";
import {RenderImageFields} from "@/types/collections/imageCollections";
import {ImageMetadata} from "@/payload/fields/Article/Cover/ImageNode/Forms/schema";
import {formatUnsplashData} from "@/payload/collections/Media/hooks/unsplashData";

export const getUnsplashCollectionsList = cache(async () => {
	try {
		const response = await fetch("https://api.unsplash.com/users/in_xcess/collections", {
			method: "GET",
			headers: {
				Authorization: "Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA"
			},
			next: {
				//24 hours
				revalidate: 3600 * 24
			}, cache: "force-cache"
		});
		if (!response.ok) {
			console.error("Error fetching unsplash collections:", response.status);
			return null;
		}
		const data = await response.json() as UnsplashCollectionDoc[];
		data.sort((a, b) => b.total_photos - a.total_photos);

		return data.flatMap(r => {
			const {id, title, total_photos, last_collected_at, links, description, updated_at} = r;
			if (total_photos < 5 || total_photos > 40) return [];
			/**
			 * {
			 *                 id,
			 *                 total_photos,
			 *                 title,
			 *                 last_collected_at,
			 *                 url: links.photos,
			 *                 relatedCollections: links.related,
			 *                 description,
			 *                 updatedAt: updated_at
			 *             }
			 */
			return r
		})

	} catch (error) {
		return null;
	}
})
type SavedMetadata = Omit<ImageMetadata, "id" | "author" | "blurDataUrl" | "darkmode" | "width" | "height" | "alt" | "caption">
export const getUnsplashCollection = cache(async (id: number, params: {
	page?: number;
	perPage?: number;
} = {page: 1, perPage: 5}): Promise<{
	image: RenderImageFields;
	form: SavedMetadata & { url: string }
}[]> => {
	const {page, perPage} = params;
	const queryString = stringify({
		page,
		per_page: perPage
	}, {addQueryPrefix: true})
	try {
		const response = await fetch(`https://api.unsplash.com/collections/${id}${queryString}`, {
			method: "GET",
			headers: {
				Authorization: "Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA"
			},
			next: {
				revalidate: 3600 * 24,
			}, cache: "force-cache"
		});
		if (response.ok) {
			const data = await response.json() as UnsplashImageDoc[];
			const rr = data.map(async r => {
				const {blur_hash, width, height} = r;
				let blurDataUrl: string = "";
				if (!!blur_hash) {
					blurDataUrl = await blurhashToDataURI({hash: blur_hash, width, height});
				}
				const vv = formatUnsplashData(r)
				return {
					...vv, image: {
						...vv.image,
						blurDataUrl
					}

				}
			})
			const d = await Promise.allSettled(rr);
			return d.flatMap(r => r.status === "fulfilled" ? r.value : [])
		}
		throw new Error("Error fetching unsplash collection: " + response.status)
	} catch (error) {
		console.log(error);
		throw new Error("Error fetching unsplash collection: " + error + " " + queryString + " " + id + " " + stringify(params, {addQueryPrefix: true}) + "")
	}
})
export const getFallbackFromUnsplash = cache(async (): Promise<UnsplashFetchResult> => {
	try {
		// 1. OPTIMIZATION: Use 'random' endpoint with 'collections' parameter.
		// This strictly limits the random pick to your curated collection (ID: ss4mf7XDnBo).
		const response = await fetch(
			`https://api.unsplash.com/photos/random?collections=ss4mf7XDnBo&count=1`,
			{
				method: "GET",
				headers: {
					Authorization: `Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA`
				},
				// 2. CACHING STRATEGY:
				// - revalidate: 3600 (1 hour).
				// This prevents "bill shock". Even if you have 10,000 visitors,
				// your server only hits Unsplash ONCE per hour.
				// You get a new "random" image every hour, keeping it fresh but safe.
				next: {revalidate: 3600}
				, cache: "force-cache"
			},
		);

		if (!response.ok) {
			console.error("Unsplash fallback failed:", response.status);
			return null;
		}

		const data = (await response.json()) as UnsplashImageDoc[];
		const pic = data[0];

		if (!pic) return null;
		const {width, height, blur_hash} = pic;
		let blurDataUrl: string = "";
		if (!!blur_hash) {
			blurDataUrl = await blurhashToDataURI({hash: blur_hash, width, height});
		}
		const ee = formatUnsplashData(pic)
		return {
			fallback: {
				src: pic.urls.regular,
				height: pic.height,
				width: pic.width,
				url: pic.urls.regular,
				// Note: blur_hash needs decoding to be used as a valid blurDataUrl (base64)
				// For now, passing it as is since your type allows string.
				blurDataUrl,
				alt:
					pic.description || `Picture from @${pic.user.name} on Unsplash`,
				darkmode:
					false,
			},
			form: {
				...ee.form,
				url: pic.urls.raw,
				alt:
					pic.description || "Curated Unsplash Image",
				caption: ee.image.caption
			}
		}
			;
	} catch (error) {
		console.error("Error fetching fallback image:", error);
		return null;
	}
});