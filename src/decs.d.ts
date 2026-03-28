import type { User as OGUser } from "@/payload-types";
import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type {
  ClientUser as OriginalClientUser,
  RequestContext as OriginalRequestContext
} from "payload";

declare module "payload" {
  export interface ClientUser extends OriginalClientUser {
    role: OGUser["role"];
    id: OGUser["id"];
    name: OGUser["name"];
  }

  // Create a new interface that merges your additional fields with the original one
  export interface RequestContext extends OriginalRequestContext {
    user: {
      role: OGUser["role"] | "guest";
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
