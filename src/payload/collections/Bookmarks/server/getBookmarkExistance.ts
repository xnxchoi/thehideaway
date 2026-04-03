import { authClient } from "@/lib/auth/client";
import config from "@/payload.config";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { Bookmark } from "@payload-types";
import { getPayload } from "payload";

export async function getBookmarkExistance({
  target,
  userId
}: {
  target: {
    relationTo: Bookmark["target"]["relationTo"];
    value: string;
  };
  userId: string;
}) {
  const payload = await getPayload({ config });
  const { data } = await authClient.getSession();
  const user = data?.user;
  const userRole = (user?.role || "user") as RP_Roles;
  if (!user) throw new Error("User not found");
  const postAuthor =
    target.relationTo === "users"
      ? [target.value]
      : await payload
          .findByID({
            collection: target.relationTo,
            id: target.value,
            select: {
              author: true
            },
            overrideAccess: true
          })
          .then((r) => (Array.isArray(r.author) ? r.author : [r.author]))
          .then((r) => r.map((x) => (typeof x === "string" ? x : x.id)));
  if (
    user.id !== userId &&
    !postAuthor.some((p) => p === user.id) &&
    user.role !== "admin"
  ) {
    throw new Error("User is not authorized to perform this action");
  }
  return await payload
    .count({
      collection: "bookmarks",
      where: {
        and: [
          {
            "target.value": {
              equals: target.value
            }
          },
          {
            "target.relationTo": {
              equals: target.relationTo
            }
          },
          {
            user: {
              equals: userId
            }
          }
        ]
      },
      overrideAccess: true,
      context: {
        user: { role: userRole },
        overrideAccess: true
      }
    })
    .then(({ totalDocs }) => totalDocs > 0)
    .catch((err) => {
      payload.logger.error(
        `Error in querying for ${target.relationTo} ${target.value} bookmark, for user ${user.id} :` +
          err.message
      );
      throw err;
    });
}
