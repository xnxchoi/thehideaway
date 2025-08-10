"use client";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import {authClient} from "../client";
import type {RP_SessionData, SessionType} from "./sessionType";
import {useStore} from "zustand";
import {createStore} from "zustand/vanilla";
import {GotUser} from "@/payload/collections/Users/endpoints/getUser";
import {Bookmark} from "@/payload-types";
import type {RP_Roles} from "@/stores/Notification/NotificationStore";
import {SyncedNotification} from "@collections/Notifications/hooks/types";

interface Props {
	/**
	 * The session from the server
	 *
	 * @default null
	 */
	session: RP_SessionData | null;
	/**
	 * The children to render
	 */
	children: ReactNode;
}

export type RP_Bookmark = {
	[x in Bookmark["target"]["relationTo"]]: Bookmark["target"]["value"][];
};
export type RP_SessionUser = SessionType["user"] & { bookmarks: RP_Bookmark };
export type RP_SessionActions = {
	setBookmarks: ({
		bookmarks,
	}: {
		bookmarks: {
			collection: Bookmark["target"]["relationTo"];
			ids: Bookmark["target"]["value"] | Bookmark["target"]["value"][];
		};
	}) => void;
	addBookmark: ({
		collection,
		id,
	}: {
		collection: Bookmark["target"]["relationTo"];
		id: Bookmark["target"]["value"];
	}) => void;
	deleteBookmark: ({
		collection,
		id,
	}: {
		collection: Bookmark["target"]["relationTo"];
		id: Bookmark["target"]["value"];
	}) => void;
	getBookmarks: ({
		collection,
	}: {
		collection: Bookmark["target"]["relationTo"];
	}) => Bookmark["target"]["value"][];
	isBookmarked: ({
		collection,
		id,
	}: {
		collection: Bookmark["target"]["relationTo"];
		id: Bookmark["target"]["value"];
	}) => boolean;
	getUser: (id: string) => Promise<RP_SessionUser | null>;
	setUser: (user: Partial<RP_SessionUser>) => void;
	setOnboarded: (onboarded: boolean) => void;
	setNotifications: (
		notifications: SyncedNotification[] | SyncedNotification,
	) => void;
	setPortrait: (portrait: string | null) => void;
	setUsername: (username: string) => void;
	setSlug: (slug: string) => void;
	setDisplayUsername: (displayUsername: string) => void;
	setBanned: (banned: boolean) => void;
	setEmailVerified: (emailVerified: boolean) => void;
	setImage: (image: string) => void;
	setName: (name: string) => void;
	setFirstName: (firstName: string) => void;
	setLastName: (lastName: string) => void;

	setEmail: (email: string) => void;

	setUpdatedAt: (updatedAt: Date) => void;
};
export type RP_LocalSession = RP_SessionUser & RP_SessionActions;
const createSessionStore = (
	init: RP_SessionUser = {
		id: null!,
		email: null!,
		name: null!,
		role: null!,
		twoFactorEnabled: false,
		bookmarks: {
			posts: [],
			userMedia: [],
			delta: [],
			profile: [],
			albums: [],
			tracks: [],
			playlists: [],
			users: [],
		},
		banned: false,
		displayUsername: null!,
		emailVerified: false,
		image: null!,
		firstName: "",
		lastName: "",
		onboarded: false,
		collection: null!,
		notifications: [],
		following: {count: 0, docs: []},
		followers: {count: 0, docs: []},
		portrait: null!,
		bio: "",
		username: null!,
		slug: null!,
	},
) => {
	return createStore<RP_LocalSession>()((set, get) => ({
		...init,
		setBookmarks: (bookmarks) =>
			set((state) => {
				const collections = Object.keys(
					bookmarks,
				) as Bookmark["target"]["relationTo"][];
				const bk = state.bookmarks;
				collections.forEach((collection) => {
					bk[collection] = bookmarks[collection];
				});
				return {...state, bookmarks: bk};
			}),
		addBookmark: ({collection, id}) => {
			set((state) => ({
				...state,
				bookmarks: {
					...state.bookmarks,
					[collection]: [...state.bookmarks[collection], id],
				},
			}));
		},
		deleteBookmark: ({collection, id}) => {
			set((state) => ({
				...state,
				bookmarks: {
					...state.bookmarks,
					[collection]: state.bookmarks[collection].filter((i) => i !== id),
				},
			}));
		},
		getBookmarks: ({collection}) => {
			return get().bookmarks[collection];
		},
		isBookmarked: ({collection, id}) => {
			return get().bookmarks[collection].includes(id);
		},
		getUser: async (id: string) => {
			const res = await fetch(`/api/users/${id}/details`, {
				method: "POST",
				credentials: "include",
			});
			if (!res.ok) {
				return null;
			} else {
				const resJson = await res.json();
				set((state) => resJson.user, true);
				return get();
			}
		},
		setUser: (user) => {
			set((state) => ({
				...state,
				...user,
			}));
		},
		setOnboarded: (onboarded) => {
			set((state) => ({
				...state,
				onboarded,
			}));
		},
		setNotifications: (notifications) => {
			set((state) => {
				const n = Array.isArray(notifications)
					? notifications
					: [notifications];
				return {
					...state,
					notifications: n,
				};
			});
		},
		setPortrait: (portrait) => {
			set((state) => ({
				...state,
				portrait: portrait!,
			}));
		},
		setUsername: (username) => {
			set((state) => ({
				...state,
				username,
			}));
		},
		setSlug: (slug) => {
			set((state) => ({
				...state,
				slug,
			}));
		},
		setDisplayUsername: (displayUsername) => {
			set((state) => ({
				...state,
				displayUsername,
			}));
		},
		setBanned: (banned) => {
			set((state) => ({
				...state,
				banned,
			}));
		},
		setEmailVerified: (emailVerified) => {
			set((state) => ({
				...state,
				emailVerified,
			}));
		},
		setImage: (image) => {
			set((state) => ({
				...state,
				image,
			}));
		},
		setName: (name) => {
			set((state) => ({
				...state,
				name,
			}));
		},
		setFirstName: (firstName) => {
			set((state) => ({
				...state,
				firstName,
			}));
		},
		setLastName: (lastName) => {
			set((state) => ({
				...state,
				lastName,
			}));
		},
		setEmail: (email) => {
			set((state) => ({
				...state,
				email,
			}));
		},

		setUpdatedAt: (updatedAt) => {
			set((state) => ({
				...state,
				updatedAt,
			}));
		},
	}));
};
type SessionAPI = ReturnType<typeof createSessionStore>;
export const SessionContext = createContext<SessionAPI | undefined>(undefined);
/**
 * RP_SessionProvider that provides the session to the context provider
 */
export const RP_SessionProvider = ({children}: { children: ReactNode }) => {
	const sessionRef = useRef<SessionAPI>(null!);
	const [isLoading, setIsLoading] = useState(false);

	const [localSession, setLocalSession] = useState<RP_SessionData | null>(null);
	if (!sessionRef.current) {
		sessionRef.current = createSessionStore();
	}
	const {data, isPending, error, refetch} = authClient.useSession();

	const getUser = useCallback(async (id: string): Promise<GotUser | null> => {
		const res = await fetch(`/api/users/${encodeURIComponent(id)}/details`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		if (!res.ok) {
			return null;
		} else {
			const resJson = await res.json();
			return resJson.user as GotUser;
		}
	}, []);
	const setUserDetails = useCallback(
		async (
			data: Pick<RP_SessionData, "user" | "session">,
			isPending: RP_SessionData["isPending"],
			refetch: RP_SessionData["refetch"],
			error: RP_SessionData["error"],
		): Promise<void> => {
			const user = await getUser(data.user.id);
			if (user) {
				setLocalSession({
					...data,
					user: {
						name: data.user.name,
						twoFactorEnabled: data.user?.twoFactorEnabled,
						banned: data.user?.banned,
						emailVerified: data.user.emailVerified,
						email: data.user.email,

						...user,
						portrait: user.portrait!,
					},
					isPending,
					refetch,
					error,
				});
			}
		},
		[getUser, setLocalSession],
	);
	useEffect(() => {
		if (data) {
			setUserDetails(
				{...data, user: {...data.user, role: data.user.role as RP_Roles}},
				isPending,
				refetch,
				error,
			);
		} else {
			setLocalSession(null);
		}
	}, [data, refetch, isPending, error, setUserDetails]);
	useEffect(() => {
		if (!sessionRef.current) {
			return;
		}
		if (localSession) {
			sessionRef.current.setState((state) => ({
				...state,

				...localSession.user,
				bio: localSession.user.bio || "",
				location: localSession.user.location || "",
				link: localSession.user.link || "",
				onboarded: localSession.user.onboarded || false,
			}));
			console.log("state set:", localSession);
			console.log("current sessionRef:", sessionRef.current);
		} else {
		}
	}, [localSession]);

	/**
	 * Function to refresh the session
	 */

	return (
		<SessionContext.Provider value={sessionRef.current}>
			{children}
		</SessionContext.Provider>
	);
};
export const useRPSession = <T, >(
	selector: (store: RP_LocalSession) => T,
): T => {
	const ctx = useContext(SessionContext);
	if (!ctx) {
		throw new Error("useRPSession must be used within SessionContext Provider");
	}
	return useStore(ctx, selector);
};
