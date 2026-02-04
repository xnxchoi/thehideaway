import {IndexedCollectionSlug} from "@/payload/plugins/plugin-search/types";
import {Search} from "@payload-types";

export type SearchOverview =
	Pick<Search, "title" | "slug" | "author" | "tags" | "authority" | "category">
	& {
	doc: {
		relationTo: IndexedCollectionSlug;
		value: string;
	}
}
const searchOverviewSelector = {
	doc: true,
	slug: true,
	author: true,
	allowList: true,
	authority: true,
	updatedAt: true,
	locked: true,
	category: true,
	id: true, title: true,
	tags: true
} as const
export type SearchOverviewSelector = Record<keyof typeof searchOverviewSelector, true>
export const searchOverviewSelect = (): SearchOverviewSelector => ({
	doc: true,
	slug: true,
	author: true, title: true,
	allowList: true,
	authority: true,
	updatedAt: true,
	locked: true,
	category: true,
	id: true,
	tags: true
})