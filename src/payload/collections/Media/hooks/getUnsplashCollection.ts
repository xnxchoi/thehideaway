import {cache} from "react";

type CurationName = "featured" | "naturale" | "tropic" | "bokeh" | "lights&neons"
export const getUnsplashCollection = cache(async (curationName?: CurationName) => {
	const curation = curationName || "featured"
	const curationNameMap: Record<CurationName, string> = {
		featured: "ss4mf7XDnBo",
		naturale: "",
		"lights&neons": "",
		bokeh: "",
		tropic: ""
	}
	try {
		const collection = await fetch(`https://api.unsplash.com/collections/${curationNameMap[curation]}`, {
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
	} catch (e) {
		console.error("Error while fetching unsplash collection:", e);
		throw new Error("No collection found");
	}
});
