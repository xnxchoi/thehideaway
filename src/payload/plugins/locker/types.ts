import {DataFromCollectionSlug} from "payload";

const s = {
	url: true, thumbnailURL: true, blurDataUrl: true, darkmode: true, mimeType: true,
} as const;
const filteredFieldsKeyMap = {
	posts:{
		content: true, title: true,
	}, surf:{
		content: true, title: true,
	}, profile: {
		hero:true,
		slides: true
	}, media: s, userMedia: s, assets:s, tracks: {
		url: true, mimeType: true
	}, playlists: {
		tracks: true, description: true,
	}, albums: {
		title: true, description: true
	},

} as const;
type SS =typeof filteredFieldsKeyMap
type XX= keyof  SS
 type NaoI<BV extends XX,RR extends Extract<keyof DataFromCollectionSlug<BV>, keyof SS[BV]> >={
		 [K2 in RR]:true

 }
 type PostM =NaoI<'posts',keyof SS['posts']>

export type FieldUseSelect={
	[K in XX]:NaoI<K,Extract<keyof DataFromCollectionSlug<K>, keyof SS[K]>>
}
export const lockedFieldsSelect:FieldUseSelect=filteredFieldsKeyMap;