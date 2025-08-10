import {DateTime} from "luxon";

export const fallback = ({direction}: { direction: "prev" | "next" }) =>
	direction === "prev"
		? {
			id: "1",
			category: {
				title: "Uncategorized",
				id: "",
				slug: "/archive/uncategorized",
			},
			publishedAt: DateTime.now().set({year: 2022, month: 1, day: 22}).toISODate(),
			bookmarks: [],
			bookmarksCount: 0,
			title: "Back to Reception",
			subtitle: "We can always go for more tea",
			slug: "/",
			author: {
				name: "The Hideaway",
				id: "1-1",
				displayUsername: "The Hideaway",
				slug: "/",
			},
		}
		: {
			id: "1",
			category: {
				title: "Uncategorized",
				id: "",
				slug: "/archive/uncategorized",
			},
			publishedAt: DateTime.now().set({year: 2022, month: 1, day: 22}).toISODate(),
			bookmarks: [],
			bookmarksCount: 0,
			title: "Back to Reception",
			subtitle: "We can always go for more tea",
			slug: "/",
			author: {
				name: "The Hideaway",
				id: "1-1",
				displayUsername: "The Hideaway",
				slug: "/",
			},
		};
