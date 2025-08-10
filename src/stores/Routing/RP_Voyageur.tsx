"use client";
import {usePathname} from "next/navigation";

import {createStore} from "zustand/vanilla";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from "react";
import {useStore} from "zustand/index";
import {getMenuPagePreviewKey} from "@/utilities/Helpers";
import type {CollectionSlug} from "payload";
import {playlists} from "../../payload-generated-schema";

/**
 *
 * Type to extract Collections that have explicitly visible pages(archives, pagination,single pages, etc.)
 * Should be updated as site structure changes.
 * @todo confirm the collections are exhaustive & security vulnerabilities don't exist
 *
 */
type ContentCollections<T extends CollectionSlug> = Extract<CollectionSlug, T>;
export type FrontEndCollections = ContentCollections<
	| "pages"
	| "posts"
	| "delta"
	| "users"
	| "categories"
	| "albums"
	| "playlists"
	| "search"
	| "tags"
>;

/**
 *  Type containing all possible **valid** page type information.
 *  null value has been omitted; subject to future modifications.
 *  Intended to be similar to the return value of usePathname().slice('/')[1], but without the complexities of considering rewrites, etc.
 *
 * Collection slugs + Additional Types
 *
 *
 * **Account**
 *
 * Pages with auth-related scope. Every page of this type is accessible to a single authentication state, i.e. loggedin? can't access checkin page : can't access my account settings page.
 *
 *
 * **404**
 *
 * 404 page.
 *
 *
 * **Private**
 *
 * User-specific scope for authenticated users. Locked if not authenticated.
 *
 *
 * **Archives**
 * A monorepo of all content format (delta/playlist/album/track/posts/profile).
 *
 *
 *
 */
export type PageType =
	| FrontEndCollections
	| "account"
	| "404"
	| "private"
	| "archives"
	| "search";
/**
 *
 * archive: Sort of like the "Front Page" for a certain type of content.
 *
 * An independent type because these cannot be programmatically generated; while the page data may be dynamically fetched, the layout-and some stuff here and there- require manual handling.
 *
 * For example, each category will have a pseudo-unique layout with different color schemes and descriptions (and maybe even layout).
 *
 * single: just a single page content
 * paginated: a pagination of uniformly formatted content
 * dynamic: the page layout will shift dynamically without navigation
 *
 *
 *
 * Dynamic paths with numbers - i.e. /posts/archived/[pageNumber] - are to be typed as paginated
 *
 *
 */
export type LayoutType =
	| "archive"
	| "single"
	| "paginated"
	| "page"
	| "dynamic";
export type RP_Voyage = {
	url: string;
	pathName: string;
	slug: string[];
	showScrollIndicator: boolean | null;
	pageType: PageType;
	layoutType: LayoutType;
	is404: boolean;
	isHome: boolean;

	pageKey: string | -1;
};

export type PageSlug = string[];
export type PageURL = {
	pageType: PageType;
	slug: PageSlug;
};

export type RP_Voyaget = {
	reset: () => void;
	setSlug: (l: string[]) => void;
	setPageType: (l: PageType) => void;
	setPage: (l: {
		pageType: PageType;
		slug: string[];
		layoutType?: LayoutType;
	}) => void;
	setIs404: (l: boolean) => void;
	setIsHome: (l: boolean) => void;

	setUrl: (l: string) => void;
	setPageKey: (l: string | -1) => void;
	setPathName: (l: string) => void;
	setShowScrollIndicator: (l: boolean | null) => void;
};
export type RP_Voyages = RP_Voyage & RP_Voyaget;

const initialState: RP_Voyage = {
	pageKey: -1,
	pageType: "pages",
	layoutType: "page",
	slug: [],

	is404: false,
	isHome: false,
	url: "/",
	pathName: "/",
	showScrollIndicator: null,
};

const setHome = (pathName: string) => pathName === "/" || pathName === "/home";
const setPageK = (slug: string[]) =>
	slug.length > 0 ? getMenuPagePreviewKey("pages", slug[0]!) : "default";
export const createVoyageur = (initState: RP_Voyage = initialState) => {
	return createStore<RP_Voyages>()((set) => ({
		...initState,
		setIs404: (l: boolean) => set((state) => ({is404: l})),

		setPageType: (l: PageType) => set((state) => ({pageType: l})),
		setSlug: (l: string[]) => set((state) => ({slug: l})),
		setIsHome: (l: boolean) => set((state) => ({isHome: l})),
		setPageKey: (l: string | -1) => set((state) => ({pageKey: l})),
		setUrl: (l: string) => set((state) => ({url: l})),
		setPathName: (l: string) => set((state) => ({pathName: l})),
		setPage: (l: {
			pageType: PageType;
			slug: string[];
			layoutType?: LayoutType;
		}) =>
			set((state) => ({
				...state,
				pageType: l.pageType,
				slug: l.slug,
				pageKey: setPageK(l.slug),
				layoutType: l.layoutType || "page",
			})),
		setShowScrollIndicator: (l: boolean | null) =>
			set((state) => ({showScrollIndicator: l})),
		reset: () =>
			set(
				(state) => ({
					...state,
					showScrollIndicator: null,
					is404: false,

					isHome: false,
					pageKey: -1,
					slug: [],
				}),
				true,
			),
	}));
};
export type VoyageAPI = ReturnType<typeof createVoyageur>;
export const archiveRegex = new RegExp(
	`^\/(posts|delta|albums|playlists|categories|tags)?\/archives(\/d+)?$`,
);
export const isArchive = (pn: string) =>
	archiveRegex.test(pn) ? "archive" : "single";
export const VoyageContext = createContext<VoyageAPI | undefined>(undefined);
export const VoyageurProvider = (l: { children: ReactNode }) => {
	const {children} = l;
	const vy = useRef<VoyageAPI>(undefined!);
	const pathName = usePathname();
	const frontSlu: { [x in PageType]: boolean } = {
		pages: true,
		posts: true,
		delta: true,
		search: true,
		users: true,

		account: true,
		"404": true,
		categories: true,
		albums: true,
		playlists: true,
		tags: true,
		private: true,
		archives: true,
	};
	const pageAndPathToLayoutType = useCallback(
		({pn, pageType}: { pn: string; pageType: PageType }) => {
			switch (pageType) {
				case "pages":
				case "account":
					return "page";
				case "posts":
				case "delta":
				case "albums":
				case "playlists":
				case "categories":

				case "tags":
					return isArchive(pn);
				default:
					return "page";
			}
		},
		[isArchive],
	);
	const frontSlugs = Object.keys(frontSlu).filter(
		(k) => frontSlu[k as PageType],
	) as PageType[];
	if (!vy.current) {
		const pathnames = pathName.split("/").slice(1);
		const pathToType =
			(pathnames.length > 0 &&
				frontSlugs.some((s) => s === pathnames[0]) &&
				(pathnames[0] as PageType)) ||
			"pages";
		vy.current = createVoyageur({
			...initialState,
			pathName: pathName,
			isHome: setHome(pathName),
			pageType: pathToType,
			layoutType: pageAndPathToLayoutType({
				pn: pathName,
				pageType: pathToType,
			}),
		});
	}

	return (
		<VoyageContext.Provider value={vy.current}>
			{children}
		</VoyageContext.Provider>
	);
};
export const useVoyageur = <T, >(selector: (store: RP_Voyages) => T): T => {
	const context = useContext(VoyageContext);
	if (context === undefined) {
		throw new Error("useVoyageur must be used within a VoyageurProvider");
	}

	return useStore(context, selector);
};
const VB = ({children}: { children: ReactNode }) => {
	const setPathName = useVoyageur((l) => l.setPathName);
	const pathName = useVoyageur((l) => l.pathName);
	const setIsHome = useVoyageur((l) => l.setIsHome);
	const pathname = usePathname();
	useEffect(() => {
		setPathName(pathname);
	}, []);
	useEffect(() => {
		setPathName(pathname);
	}, [pathname]);
	useEffect(() => {
		setIsHome(pathName === "/" || pathName.startsWith("/home"));
	}, [pathName]);
	return <>{children}</>;
};
export const Voyageur = ({children}: { children: ReactNode }) => {
	return (
		<VoyageurProvider>
			<VB>{children}</VB>
		</VoyageurProvider>
	);
};
