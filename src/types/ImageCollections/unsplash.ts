export type UnsplashUserOverview = {
	id: string;
	username: string;
	name: string;
	portfolio_url: string;
	bio: string;
	location: string;
	total_likes: number;
	total_photos: number;
	total_collections: number;
	instagram_username: string;
	twitter_username: string;
	profile_image: {
		small: string; medium: string; large: string;
	};
	links: {
		self: string; html: string; photos: string; likes: string; portfolio: string;
	};
}
export type UnsplashImage = {
	id: string;
	created_at: string;
	updated_at: string;
	width: number;
	height: number;
	color: string;
	blur_hash: string;
	description: string;
	user: UnsplashUserOverview;
	urls: {
		raw: string; full: string; regular: string; small: string; thumb: string;
	};
	links: {
		self: string; html: string; download: string; download_location: string;
	};
}
export type UnsplashCollection = {
	id: number;
	title: string;
	published_at: string;
	last_collected_at: string;
	updated_at: string;
	cover_photo: UnsplashImage | null;
	user: UnsplashUserOverview | null;

}
export type UnsplashCollectionDoc = UnsplashCollection & {
	private: boolean;
	share_key: string;
	total_photos: number;
	featured: boolean;
	links: {
		self: string; html: string; photos: string; related: string;
	};

	description: string;
}
export type UnsplashImageDoc = UnsplashImage & {

	likes: number;
	liked_by_user: boolean;
	current_user_collections?: UnsplashCollection[];

};
export type FetchedUnsplashImage = {
	fallback: {
		height: number;
		width: number;
		url: string;
		blurDataUrl: string;
		darkmode: boolean;
		alt: string;
		src: string;
	}; form: {
		url: string;
		caption: string;
		alt: string;

	};
};
type UnsplashObjectMap = {
	image: UnsplashImageDoc;
	collection: UnsplashCollectionDoc;
	user: UnsplashUserOverview;
}
export type FetchedUnsplash<T extends keyof UnsplashObjectMap = keyof UnsplashObjectMap> = {
	[X in T]: {}
}[T]
export type SavedMetadataUnsplash = { url: string }

export type UnsplashFetchResult = FetchedUnsplashImage | null;