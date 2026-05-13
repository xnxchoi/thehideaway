import {
  anyone,
  authenticated,
  isAdmin,
  onlySelfOrAdmin,
  standardCreateAccess,
  standardReadAccess,
  standardUpdateAccess
} from "@/payload/plugins/locker/access/accessCheckers";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { CollectionConfig, CollectionSlug, Where } from "payload";
import { roleToAuthority } from "../fields/authority/utils";

export const pagesAccess: CollectionConfig["access"] = {
  create: isAdmin,
  delete: isAdmin,
  update: isAdmin,
  read: anyone
};
export const postsAccess: CollectionConfig["access"] = {
  create: standardCreateAccess,
  delete: standardUpdateAccess,
  read: standardReadAccess,
  update: standardUpdateAccess
};
export const deltasAccess: CollectionConfig["access"] = {
  create: standardCreateAccess,
  delete: standardUpdateAccess,
  read: standardReadAccess,
  update: standardUpdateAccess
};
export const surfAccess: CollectionConfig["access"] = {
  create: standardCreateAccess,
  delete: standardUpdateAccess,
  read: standardReadAccess,
  update: standardUpdateAccess
};
export const mediaAccess: CollectionConfig["access"] = {
  create: authenticated,
  delete: standardUpdateAccess,
  read: ({ req: { user } }) => {
    if (user?.role === "admin") return true;
    return {
      or: [
        {
          and: [
            { _status: { equals: "published" } },
            {
              or: [
                {
                  locked: {
                    not_equals: "true"
                  }
                },
                {
                  and: [
                    {
                      locked: {
                        equals: true
                      }
                    },
                    {
                      or: [
                        {
                          allowList: {
                            contains: user?.id
                          }
                        },
                        {
                          authority: {
                            less_than:
                              ((user &&
                                user.role &&
                                roleToAuthority(user.role as RP_Roles)) ||
                                0) + 1
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          author: {
            equals: user?.id
          }
        }
      ]
    } as Where;
  },
  update: standardUpdateAccess
};
export const categoriesAccess: CollectionConfig["access"] = {
  create: standardCreateAccess,
  delete: standardUpdateAccess,
  read: anyone,
  update: standardUpdateAccess
};
export const membersAccess: CollectionConfig["access"] = {
  read: standardReadAccess,
  update: onlySelfOrAdmin,
  create: isAdmin,
  delete: onlySelfOrAdmin
};
export type LockedAccessCollection = Extract<
  CollectionSlug,
  | "pages"
  | "posts"
  | "surf"
  | "media"
  | "userMedia"
  | "profile"
  | "assets"
  | "tracks"
>;
export type CollectionAccessMap<T extends LockedAccessCollection> = {
  [key in T]: CollectionConfig<T>["access"];
};
