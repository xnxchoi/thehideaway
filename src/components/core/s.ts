// 1) Allowlist the collections that are eligible for gated access.
import {LockedCollections} from "@/payload/plugins";
import {CollectionSlug, DataFromCollectionSlug} from "payload";
import {FieldUseSelect} from "@/payload/plugins/locker/types";
import {Album, Playlist, Profile, Track} from "@/payload-types";

export const ALLOWED: ReadonlySet<CollectionSlug> = new Set(
	["posts", "media", "delta", "albums", "playlists", "tracks", "userMedia", "assets", "profile",])
export type LockedMediaSlugs = "assets" | "media" | "userMedia"
export type ArticleSlugs = "posts" | "delta"
const uploadLockedFieldSelector = {
	url: true, mimeType: true, thumbnailURL: true, darkmode: true, blurDataUrl: true,
} as const;
export type UploadLockTargetKeys = keyof typeof uploadLockedFieldSelector
export type UploadCollectionSelect = Record<UploadLockTargetKeys, true>
// 2) Per-collection response shapers (avoid dumping whole docs)
export type Shaped<K extends LockedCollections> = K extends LockedMediaSlugs ? {
	url?: string | null | undefined;
	mimeType?: string | null;
	thumbnailURL?: string | null;
	darkmode?: boolean | null | undefined;
	blurDataUrl?: string | null | undefined;
} : K extends ArticleSlugs ? {
	content: DataFromCollectionSlug<ArticleSlugs>['content']
} : K extends "tracks" ? Pick<Track, "mimeType" | "url"> : K extends 'profile' ? Pick<Profile, 'slides' | "hero"> : K extends "playlists" ? Pick<Playlist, 'tracks' | 'description'> : K extends 'albums' ? Pick<Album, 'description' | 'title'> : never;
type CSXZ<K extends LockedCollections> = Pick<DataFromCollectionSlug<K>, Extract<keyof DataFromCollectionSlug<K>, keyof FieldUseSelect[K]>>
type SCV<T extends LockedCollections> = { [K in T]: (doc: CSXZ<K>) => Shaped<K> }
type ShapeMap = SCV<LockedCollections>;
const shape: ShapeMap = {
	posts: (doc) => ({
		content: doc.content,
	}), delta: (doc) => ({
		content: doc.content,
	}), albums: (doc) => ({
		description: doc.description, title: doc.title,
	}), tracks: ({url, mimeType}) => ({
		url, mimeType
	}), playlists: ({tracks, description}) => ({
		tracks, description
	}), profile: (doc) => ({
		slides: doc.slides, hero: doc.hero
	}), media: ({url, thumbnailURL, mimeType, darkmode, blurDataUrl,}) => ({
		url, thumbnailURL, blurDataUrl, darkmode, mimeType
	}), userMedia: ({url, thumbnailURL, mimeType, darkmode, blurDataUrl,}) => ({
		url, thumbnailURL, blurDataUrl, darkmode, mimeType
	}), assets: ({url, thumbnailURL, mimeType, darkmode,}) => ({
		url, thumbnailURL, darkmode, mimeType
	}),
}
export const projectt = <T extends LockedCollections, >(collection: T, doc: CSXZ<T>) => {
	return {data: shape[collection](doc), collection}
}