import {cache} from "react";

export const getUnsplashCollection = cache(async () => {
	const collection = await fetch(`https://api.unsplash.com/collections/ss4mf7XDnBo`, {
		headers: {
			Authorization: `Client-ID PmprbTtYGRK6RvmubJroUAF0SWqJjvgs0UuTaeFoHiA`
		}
	});
	if (collection.ok) {
		const res = (await collection.json()) as {
			id: number;
			title: string;
			description: string;
			published_at: string;
			last_collected_at: string;
			updated_at: string;
			featured: boolean;
			total_photos: number;
			private: boolean;
			share_key: string;
			cover_photo: null;
			user: null;
			links: {
				self: string; html: string; photos: string;
			};
		};
		return res;
	}
	throw new Error("No collection found");
});
