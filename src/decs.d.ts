import type {
	ClientUser as OriginalClientUser,
	RequestContext as OriginalRequestContext,
} from "payload";
import type {User} from "@/payload-types";

declare module "payload" {
	export interface ClientUser extends OriginalClientUser {
		role: User["role"];
	}

	// Create a new interface that merges your additional fields with the original one
	export interface RequestContext extends OriginalRequestContext {
		user: {
			role: User["role"] | "guest";
		};
		overrideAccess?: boolean;
	}
}
