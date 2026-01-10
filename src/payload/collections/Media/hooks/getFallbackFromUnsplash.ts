"use server";
import {blurhashToDataURI} from "@/payload/collections/Media/hooks/blurHashToDataUrl";
import {formatUnsplashData} from "@/payload/collections/Media/hooks/unsplashData";
import {RenderImageFields} from "@/types/collections/image-collections";
import {
	SavedMetadataUnsplash,
	UnsplashCollectionDoc,
	UnsplashFetchResult,
	UnsplashImageDoc,
	UnsplashUserOverview
} from "@/types/ImageCollections/unsplash";
import {stringify} from "qs-esm";
import {cache} from "react";

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
export const getUnsplashCollection = cache(async (id: number, params: {
	page?: number;
	perPage?: number;
} = {page: 1, perPage: 5}): Promise<{
	image: RenderImageFields;
	form: SavedMetadataUnsplash
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
			const data = await response.json() as {
				id: string;
				title: string;
				description: null | string;
				published_at: string;
				last_collected_at: string;
				updated_at: string;
				featured: boolean;
				total_photos: number;
				private: boolean;
				share_key: string;
				links: {
					self: string;
					html: string;
					photos: string;
					related: string;
				},
				user: UnsplashUserOverview;
				cover_photo: null | {
					id: string;
					created_at: string;
					updated_at: string;
					promoted_at: string | null;
					width: number;
					height: number;
					color: string;
					blur_hash: string;
					description: null | string;
					alt_description: string;
					breadcrumbs: string;
					user: UnsplashUserOverview;
					urls: {
						raw: string;
						full: string;
						regular: string;
						small: string;
						thumb: string;
					};
					links: {
						self: string;
						html: string;
						download: string;
						download_location: string
					};
					slug: string;
					alternative_slugs: {
						[key: string]: string
					}
				};
				preview_photos: {
					id: string;
					slug: string;
					asset_type: "photo" | string;
					created_at: string;
					updated_at: string;
					blur_hash: string;
					urls: {
						raw: string;
						full: string;
						regular: string;
						small: string;
						thumb: string;
					};
				}[];
				meta: {
					title: string | null;
					description: string | null;
					index: boolean;
				};
			}
			const photolinks = data.links.photos;
			const response2 = await fetch(photolinks, {
				method: "GET",
				headers: {
					Authorization: "Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA"
				},
				next: {
					revalidate: 3600 * 24,
				}, cache: "force-cache"
			})
			if (response2.ok) {
				const nd = await response2.json() as UnsplashImageDoc[];
				console.log("unsplash!!!!!!:", nd);
				const vv = nd.map(r => formatUnsplashData(r))
				console.log("!!!!!!!!unsplash!!!!!!:", vv);
				return vv;
			}
			// const rr = data.preview_photos.map(async r => {
			// 	const {blur_hash,} = r;
			// 	let blurDataUrl: string = "";
			// 	if (!!blur_hash) {
			// 		blurDataUrl = await blurhashToDataURI({hash: blur_hash, width, height});
			// 	}
			// 	const vv = formatUnsplashData(r)
			// 	return {
			// 		...vv, image: {
			// 			...vv.image,
			// 			blurDataUrl
			// 		}
			//
			// 	}
			// })
			// const d = await Promise.allSettled(rr);
			// return d.flatMap(r => r.status === "fulfilled" ? r.value : [])
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