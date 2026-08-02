import type { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import type { GotUser } from "@/payload/collections/Users/endpoints/userFieldSelect";
import type { RP_Roles } from "@/stores/Notification/NotificationStore";
import type { PayloadHandler } from "payload";

export const getUserDetails: PayloadHandler = async (req) => {
  const actor = req.user;
  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ("banned" in actor && actor.banned === true) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = req.routeParams?.id;
  if (!id || typeof id !== "string") {
    return Response.json(
      { error: "Invalid param provided" },
      { status: 404 }
    );
  }

  if (actor.role !== "admin" && actor.id !== id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await req.payload
    .findByID({
      collection: "users",
      id,
      overrideAccess: false,
      req,
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
    .catch((error) => {
      req.payload.logger.error({ err: error, userId: id }, "getUserDetails failed");
      return null;
    });

  if (!result) {
    return Response.json({ error: `User ${id} not found` }, { status: 404 });
  }

  const { portrait, ...rest } = result;
  const user: GotUser = {
    ...rest,
    following: {
      count: rest.following?.totalDocs ?? 0,
      docs: (rest.following?.docs || ([] as string[])).map((follow) =>
        typeof follow === "string"
          ? follow
          : typeof follow.target === "string"
            ? follow.target
            : follow.target.id
      )
    },
    followers: {
      count: rest.followers?.totalDocs ?? 0,
      docs: (rest.followers?.docs || ([] as string[])).map((follow) =>
        typeof follow === "string"
          ? follow
          : typeof follow.user === "string"
            ? follow.user
            : follow.user.id
      )
    },
    portrait: portrait ?? null,
    id: `${rest.id}`,
    role: rest.role as RP_Roles,
    onboarded: rest.onboarded ?? false,
    slug: rest.slug ?? rest.username,
    username: rest.username ?? rest.slug ?? rest.name,
    displayUsername:
      rest.displayUsername ?? `@${rest.username ?? rest.slug ?? rest.name}`,
    collection: "users",
    notifications: (rest.notifications?.docs as SyncedNotification[]) ?? [],
    bio: rest.bio ?? ""
  };

  return Response.json({ user }, { status: 200 });
};
