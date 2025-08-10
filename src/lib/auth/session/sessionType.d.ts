import {authClient} from "@/lib/auth/client";
import {GotUser} from "@/payload/collections/Users/endpoints/getUser";
import type {Session} from "../types";
import type {User} from "@/payload-types";

export type RP_SessionData = {
	user: Omit<
		User,
		| "id"
		| "createdAt"
		| "updatedAt"
		| "banExpires"
		| "bio"
		| "notifications"
		| "favorites"
		| "bookmarks"
		| "username"
		| "collections"
		| "displayUsername"
		| "following"
		| "followers"
		| "meta"
	> &
		Session["user"];
	session: Session["session"];
	error: ReturnType<typeof authClient.useSession>["error"];
	isPending: ReturnType<typeof authClient.useSession>["isPending"];
	refetch: ReturnType<typeof authClient.useSession>["refetch"];
};

export type SessionType = Omit<RP_SessionData, "user"> & {
	user: Omit<RP_SessionData["user"], "portrait"> & GotUser;
};
