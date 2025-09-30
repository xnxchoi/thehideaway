import { DateTime } from "luxon";
import { TagOverview } from "@/types/collections/delta";

export const fallback = ({ direction }: { direction: "prev" | "next" }) =>
  direction === "prev"
    ? {
        id: "1",
        category: {
          title: "Uncategorized",
          id: "",
          slug: "/archived/uncategorized"
        },
        publishedAt: DateTime.now()
          .set({ year: 2022, month: 1, day: 22 })
          .toISODate(),
        bookmarks: [],
        tags: [] as TagOverview[],
        bookmarksCount: 0,
        title: "All Essays & Articles",
        subtitle: "More of where this came from.",
        slug: "/essays",
        author: {
          name: "The Hideaway",
          id: "1-1",
          displayUsername: "The Hideaway",
          slug: "/"
        }
      }
    : {
        id: "1",
        category: {
          title: "Uncategorized",
          id: "",
          slug: "/archived/uncategorized"
        },
        publishedAt: DateTime.now()
          .set({ year: 2022, month: 1, day: 22 })
          .toISODate(),
        bookmarks: [],
        bookmarksCount: 0,
        tags: [] as TagOverview[],
        title: "Deltas",
        subtitle: "Explore tangential thoughts and discourse",
        slug: "/delta",
        author: {
          name: "The Hideaway",
          id: "1-1",
          displayUsername: "The Hideaway",
          slug: "/"
        }
      };
