"use server";
import {randomNumber} from "@/utilities/randomNumber";
import {getUnsplashCollection} from "./getUnsplashCollection";
import {cache} from "react";

type UnsplashImage = {
	id: string;
	created_at: string;
	updated_at: string;
	width: number;
	height: number;
	color: string;
	blur_hash: string;
	likes: number;
	liked_by_user: boolean;
	description: string;
	user: {
		id: string;
		username: string;
		name: string;
		portfolio_url: string;
		bio: string;
		location: string;
		total_likes: number;
		total_photos: number;
		total_collections: number;
		instagram_username: string;
		twitter_username: string;
		profile_image: {
			small: string; medium: string; large: string;
		};
		links: {
			self: string; html: string; photos: string; likes: string; portfolio: string;
		};
	};
	current_user_collections: [// The *current user's* collections that this photo belongs to.
		{
			id: number;
			title: string;
			published_at: string;
			last_collected_at: string;
			updated_at: string;
			cover_photo: null;
			user: null;
		}
		// ... more collections
	];
	urls: {
		raw: string; full: string; regular: string; small: string; thumb: string;
	};
	links: {
		self: string; html: string; download: string; download_location: string;
	};
};
export type FetchedUnsplash = {
	fallback: {
		height: number; width: number; sourceUrl: string; blurDataUrl: string;
	}; form: {
		source: { identifier: string; provider: "unsplash" }; url: string; caption: string; alt: string;
	};
};
export type UnsplashFetchResult = FetchedUnsplash | null;
export const getFallbackFromUnsplash = cache(async (): Promise<UnsplashFetchResult> => {
	const count = await getUnsplashCollection().then((r) => {
		return r.total_photos || 0;
	}).catch((e) => 0);

	if (count === 0) {
		throw new Error("No photos found");
	}

	const targetIndex = randomNumber(0, count - 1);

	const targetPage = targetIndex + 1;

	const photoFetchRes = await fetch(
		`https://api.unsplash.com/collections/ss4mf7XDnBo/photos?page=${targetPage}&per_page=1`, {
			method: "GET", headers: {
				Authorization: `Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA`
			}
		});
	if (photoFetchRes.ok) {
		console.log("pic fetched!");
		const photoRes = (await photoFetchRes.json()) as Array<UnsplashImage>;
		console.log("fetched pic:", photoRes);
      const pic = photoRes[0];
      if (!pic) {
	      throw new Error("No photos found");
      }
		return {
			fallback: {
				height: pic.height, width: pic.width, sourceUrl: pic.urls.full, blurDataUrl: pic.blur_hash
			}, form: {
				source: {
					identifier: pic.id, provider: "unsplash"
				}, url: pic.urls.full, alt: pic.description, caption: `From ${pic.user.name} on Unsplash`
			}
		};
	}
	return null;
});
