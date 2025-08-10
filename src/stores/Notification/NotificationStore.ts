"use client";
import type {User, UserMedia} from "@/payload-types";
import {createStore} from "zustand/vanilla";
import {authClient} from "@/lib/auth/client";
import {DateTime} from "luxon";
import {SyncedNotification} from "@collections/Notifications/hooks/types";

export type RP_Roles = "user" | "admin" | "author" | "editor" | "patron";

export type SortByDateProps = { order?: "ASC" | "DESC" };
export const sortByDate =
	({order = "ASC"}: SortByDateProps) =>
		(a: string, b: string) => {
			const aDate = DateTime.fromISO(a).toUnixInteger();
			const bDate = DateTime.fromISO(b).toUnixInteger();
			if (order === "ASC") {
				return aDate - bDate;
			}
			return bDate - aDate;
		};
export type SessionResponse = ReturnType<typeof authClient.useSession>;
export type SuccessSessionData = NonNullable<SessionResponse["data"]>;
/**
 *     {
 *     banExpires?: Date | null | undefined;
 *     banReason?: string | null | undefined;
 *     banned: false | true | null | undefined;
 *     createdAt: Date;
 *     email: string;
 *     emailVerified: boolean;
 *     id: string;
 *     image?: string | null | undefined;
 *     name: string;
 *     updatedAt: Date;
 *     role: RP_Roles;
 * }
 */
export type BetterAuth_User = SuccessSessionData["user"];

/**
 *  {
 *     activeOrganizationId?: string | null | undefined;
 *     createdAt: Date;
 *     expiresAt: Date;
 *     id: string;
 *     impersonatedBy?: string | null | undefined;
 *     ipAddress?: string | null | undefined;
 *     token: string;
 *     updatedAt: Date;
 *     userAgent?: string | null | undefined;
 *     userId: string;
 *   };
 */
export type BetterAuth_Session = SuccessSessionData["session"];
export type RP_User = BetterAuth_User &
	Omit<
		User,
		| "favorites"
		| "role"
		| "portrait"
		| "createdAt"
		| "updatedAt"
		| "id"
		| "banExpires"
	> & {
	role: RP_Roles;
	collection: "users";
	bio: string;
	email: string;
	firstName: string;
	lastName: string;
	name: string;
	id: string;
	image: string | null;
	portrait: UserMedia | null;
	slug: string;
	onboarded: boolean;
	link: string;
	displayUsername: string;
	createdAt: Date;
	updatedAt: Date;
	banExpires?: Date | null;
	notifications: SyncedNotification[];
} & favoritestore;

export type HA_MEMBER = RP_User;

export interface RP_Session {
	user: HA_MEMBER;
	session: BetterAuth_Session;
}

/**
 *
 * Type for the Polymorphic relationship item in the favorites array.
 * We take this and divvy it up into each collection type.
 * @todo: slice this into separate objects per collection to modularize queries/data
 *
 * **/
export type FavouriteItem = { value: string; relationTo: "posts" | "delta" };
export type FavouriteActions = {
	setfavorites: (l: FavouriteItem[]) => void;
	addFavourite: (l: FavouriteItem | FavouriteItem[]) => void;
	removeFavorite: (l: Partial<{ [x in "delta" | "posts"]: string[] }>) => void;
};
/**
 * Store for the favorites array.
 * This should have a field for each favorites-enabled collection.
 * @todo: Slice this down to separate types/stores per collection, and perhaps create a mapped type to help with the process.
 *
 */
export type favoritestore = {
	favorites: {
		posts: string[];
		delta: string[];
	};
};

export type NotificationItems = {
	lastFetched: number;
	totalCount: number;
	user: string;
	notifications: SyncedNotification[];
};
export type NotificationActions = {
	updateNotification: (item: NotificationItems["notifications"]) => void;
	updateUser: (item: NotificationItems["user"]) => void;
};
export type NotificationStore = NotificationItems & NotificationActions;

export const createNotificationStore = (
	initState: NotificationItems = {
		lastFetched: 0,
		totalCount: 0,
		user: null!,
		notifications: [],
	},
) => {
	return createStore<NotificationStore>()((set, get) => ({
		...initState,
		updateNotification: (nextState) =>
			set((state) => {
				const notific = state.notifications;
				notific.unshift(...nextState);
				return {
					...state,
					notifications: notific,
					totalCount: notific.length,
					lastFetched: performance.now(),
				};
			}),
		updateUser: (nextState) =>
			set(
				(state) => ({
					...state,
					totalCount: 0,
					notifications: [],
					lastFetched: 0,
					user: nextState,
				}),
				true,
			),
	}));
};
