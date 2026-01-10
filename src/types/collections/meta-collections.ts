import type {Category, Tag} from "@payload-types";

/**
 * typing for meta collections
 * The types here are the accurate representation of what is returned as-is from the CMS,
 * due to how forceSelect is configured for these collections.
 *
 * Important: These types are, at best, static snapshots of how the API was once configured.
 * Accurate as of 2026-01-07.
 *
 * TODO: Tag and Category should be better typed to not require this surrogatory workaround.
 *
 */
export type ForcePopulatedMetaKeys = "title" | "id" | "slug";
export type TagOverviewSelect = Record<ForcePopulatedMetaKeys, true>
export type TagOverview = Pick<Tag, ForcePopulatedMetaKeys>;
export type CategoryOverviewSelect = Record<ForcePopulatedMetaKeys | "popularity", true>
export type CategoryOverview = Pick<Category, ForcePopulatedMetaKeys | "popularity">;
export const tagOverviewSelect = (): TagOverviewSelect => ({
	id: true,
	slug: true,
	title: true

})
export const categoryOverviewSelect = (): CategoryOverviewSelect => ({
	id: true,
	slug: true,
	title: true,
	popularity: true
})