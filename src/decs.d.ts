import type {
	ClientUser as OriginalClientUser,
	RequestContext as OriginalRequestContext
} from "payload";
import type {User} from "@/payload-types";
import type {DefaultNodeTypes} from "@payloadcms/richtext-lexical";

declare module "payload" {
  export interface ClientUser extends OriginalClientUser {
    role: User["role"];
	  id: User["id"]
	  name: User["name"]
  }

  // Create a new interface that merges your additional fields with the original one
  export interface RequestContext extends OriginalRequestContext {
    user: {
      role: User["role"] | "guest";
    };
    sourceId?: string;
    overrideAccess?: boolean;
    // For collections with slug field, determines whether hashID should be regenerated
    rehashRequired?: boolean;
    internal?: {
      richText?: {
        [key: string]: {
          [a: string]: any;
          originalNodeIDMap?: Record<string, DefaultNodeTypes>;
        };
      };
    };
  }
}
