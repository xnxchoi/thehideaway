"use server";

import { cache } from "react";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";

export type GotUser = {
  portrait: null | string;
  bio: string;
  id: string;
  username: string;
  role: RP_Roles;
  slug: string;
  firstName: string;
  lastName: string;
  onboarded: boolean;
  collection: "users";
  notifications: SyncedNotification[];
  displayUsername: string;
  following: { count: number; docs: string[] };
  followers: { count: number; docs: string[] };
};

export const getUser = cache(
  async ({ id }: { id: string }): Promise<GotUser | null> => {
    const payload = await getPayload({ config: configPromise });

    const res = await payload
      .findByID({
        collection: "users",
        overrideAccess: true,
        id,
        select: {
          firstName: true,
          lastName: true,
          displayUsername: true,
          portrait: true,
          slug: true,
          username: true,
          name: true,
          onboarded: true,
          role: true,
          bio: true,
          following: true,
          followers: true,
          notifications: true
        }
      })
      .catch((e) => {
        console.error(`Error fetching user ${id}`, e);
        return null;
      });
    if (!res) {
      console.error(`User ${id} not found`);
      return null;
    }
    const { portrait, ...rest } = res;
    const user: GotUser = {
      ...rest,
      following: {
        count: rest.following?.totalDocs ?? 0,
        docs: (rest.following?.docs || ([] as string[])).map((r) =>
          typeof r === "string"
            ? r
            : typeof r.target === "string"
              ? r.target
              : r.target.id
        )
      },
      followers: {
        count: rest.followers?.totalDocs ?? 0,
        docs: (rest.followers?.docs || ([] as string[])).map((r) =>
          typeof r === "string"
            ? r
            : typeof r.user === "string"
              ? r.user
              : r.user.id
        )
      },
      portrait: portrait ?? null,
      id: `${rest.id}`,
      role: rest.role ?? "user",
      onboarded: rest.onboarded ?? false,
      slug: rest.slug ?? rest.name,
      username: rest.username ?? rest.slug ?? rest.name,
      displayUsername:
        rest.displayUsername ?? `@${rest.username ?? rest.slug ?? rest.name}`,
      collection: "users",
      notifications: (rest.notifications?.docs as SyncedNotification[]) ?? [],
      bio: rest.bio ?? ""
    };

    // const notifications: SyncedNotification[] = await queryNotifications({
    //   id: user.id,
    //   payload,
    // }).catch((e) => {
    //   console.error(`Error fetching notifications for user ${user.id}`, e)
    //   return []
    // })
    // user.notifications = notifications
    console.log("user in getUser", user);
    return user;
  }
);
export type GetUserResponse = Awaited<ReturnType<typeof getUser>>;
