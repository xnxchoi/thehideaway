const CASES = Object.freeze({
	DEV: 'https://ha.local', PRODUCTION: 'https://hideawayseoul.com',
})

// export const BASE_URL = process.env.NODE_ENV==='production'? CASES.PRODUCTION :CASES.DEV;
export const BASE_URL = CASES.PRODUCTION
export const HOME_URL = `${BASE_URL}/`
export const REST_BASE = `${BASE_URL}/wp-json/`

export const POSTS_API = Object.freeze({
	NOTES: 'RP_NOTIFY', DISMISSED: 'RP_DISMISS',
})
export const ARCHIVES_API = Object.freeze({
	FILTERS: {
		TAG: `${REST_BASE}wp/v2/tags/?_fields[]=id,name,count,description&per_page=25&hide_empty=true&orderby=count&order=desc`,
		CATEGORY: `${REST_BASE}wp/v2/categories/?_fields[]=id,name,count,description&per_page=25&hide_empty=true&orderby=count&order=desc`,
	}, PT: {
		CV: `${REST_BASE}wp/v2/curriculum-vitae/?_fields[]=id,title,author,excerpt,date,link&per_page=15&page=`,
		FT: `${REST_BASE}wp/v2/feature/?_fields[]=id,title,author,excerpt,date,link&per_page=15&page=`,
		CS: `${REST_BASE}wp/v2/curated-surfing/?_fields[]=id,title,author,excerpt,date,link&per_page=15&page=`,
	}, TERM: {
		TAG: `${REST_BASE}estt/v2/libera/?_fields[]=id,title,author,excerpt,date,link&`,
	},
})
export const UI_API = Object.freeze({
	SEARCH: `${REST_BASE}estt/v2/libera/?_embed&_fields=title,author,type,date,link&search=`,
	NOTES: `${REST_BASE}wp/v2/notes/?_fields[]=title&_fields[]=id&_fields[]=acf`,
})
export const USER_API = Object.freeze({
	CURRENT: `${REST_BASE}wp/v2/users/me`,
	ACF: `${REST_BASE}wp/v2/users/me`,
	CHECK: `${REST_BASE}rp/v1/members/?type=user`,
	AUTHOR: `${REST_BASE}rp/v1/getAuthor/`,
	CV: `${REST_BASE}rp/v1/cv/`,
	NAME: `${REST_BASE}rp/v1/name`,
})
export const AUTH_API = Object.freeze({})
export const TEMP_API = Object.freeze({
	SELECT: `${REST_BASE}rp/v1/tp/?selector=`,
})
export const RADIO_API = Object.freeze({
	PLAYLIST: `${REST_BASE}wp/v2/mixes/?per_page=1`,
})
export const ASSET_PATHS = Object.freeze({
	FONTS: '/assets/fonts/',
	ICONS: '/assets/icons/',
	IMAGES: '/assets/image/',
	VIDEOS: '/assets/video/',
})
export const FONTFACES = Object.freeze({
	INCONSOLATA: ASSET_PATHS.FONTS + '/Inconsolata/InconsolataRegular.json',
	COPPERPLATE: {
		BOLD: ASSET_PATHS.FONTS + '/Copperplate/Copperplate CC_Bold.json',
		HEAVY: ASSET_PATHS.FONTS + '/Copperplate/Copperplate CC_Regular.json',
	},
	PEIGNOT: {
		LIGHT: ASSET_PATHS.FONTS + '/Peignot/Peignot LT Std Light_Regular.json',
		MEDIUM: ASSET_PATHS.FONTS + '/Peignot/Peignot LT Std Demi_Regular.json',
		BOLD: ASSET_PATHS.FONTS + '/Peignot/Peignot LT Std Demi_Bold.json',
	},
	BRICOLAGE_GROTESQUE: {
		CONDENSED: ASSET_PATHS.FONTS + '/BricolageGrotesque/Bricolage Grotesque 24pt Condensed SemiBold_Regular.json'
	}
})
