import {SyncedNotification} from "@/payload/collections/Notifications/hooks/types";
import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {Bookmark, User} from "@payload-types";

export type UserRPSelectBare = Pick<User,
	| "firstName"
	| "lastName"
	| "displayUsername"
	| "portrait"
	| "slug"
	| "username"
	| "name"
	| "onboarded"
	| "role"
	| "bio"
	| "following"
	| "followers"
	| "bookmarks"
	| "notifications"
>;
export type UserRPSelect = Record<UserRPSelectKeys, true>
export const userSelectRP = (): UserRPSelect =>
	({
		firstName: true,
		lastName: true,
		displayUsername: true,
		portrait: true,
		slug: true,
		username: true,
		name: true,
		bookmarks: true,
		onboarded: true,
		role: true,
		bio: true,
		following: true,
		followers: true,
		notifications: true
	});
export type UserRPSelectKeys = keyof UserRPSelectBare;
export type GotUser = {
	portrait: null | string;
	bio: string;
	id: string;
	username: string;
	role: RP_Roles;
	slug: string;
	firstName: string;
	lastName: string;
	name: string;
	onboarded: boolean;
	collection: "users";
	notifications: SyncedNotification[];
	bookmarks?: User["bookmarks"]
	displayUsername: string;
	following: { count: number; docs: string[] };
	followers: { count: number; docs: string[] };
};
export type BookmarkedCollectionSlug = Bookmark["target"]["relationTo"];
export type RP_Bookmark = {
	[x in BookmarkedCollectionSlug]?: string[];
};