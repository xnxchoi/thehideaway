const postSelector = {
	title: true,
	subtitle: true,
	content: true,
	slug: true,
	id: true,
	relatedPosts: true,
	category: true,
	allowList: true,
	authority: true,
	author: true,
	publishedAt: true,
	locked: true,
	updatedAt: true,
	tags: true,
	createdAt: true,
	image: true,
} as const;
export type SinglePostKeys = keyof typeof postSelector;
export type SinglePostSelector = Record<SinglePostKeys, true>
export const singlePostSelect:SinglePostSelector=postSelector
const postOverviewSelector = {title: true,
	publishedAt: true,
	image: true,
	subtitle: true,
	slug: true,
	author: true,	allowList: true,
	authority: true,
	locked: true,
	category: true,
	id: true,
	tags: true,
} as const;
export type PostOverviewKeys = keyof typeof postOverviewSelector;
export type PostOverviewSelector = Record<PostOverviewKeys, true>
export const postOverviewSelect:PostOverviewSelector=postOverviewSelector