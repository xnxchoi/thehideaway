import {DateTime} from "luxon";
import {TagOverview} from "@collections/Deltas/delta-types";

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
		tags:[] as TagOverview[],
			bookmarksCount: 0,
			title: "All Essays & Articles",
			subtitle: "More of where this came from.",
			slug: "/posts",
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
			tags:[] as TagOverview[],
			title: "Deltas",
			subtitle: "Explore tangential thoughts and discourse",
			slug: "/deltas",
			author: {
				name: "The Hideaway",
				id: "1-1",
				displayUsername: "The Hideaway",
				slug: "/",
			},
		};
