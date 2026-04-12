import config from "@/payload.config";
import { Bookmark } from "@payload-types";
import { getPayload } from "payload";

/**
 * Internal helper — caller MUST authorize the request before calling.
 *
 * Intentionally NOT a `"use server"` action: exporting this as a server action
 * would make it POST-invokable by any authenticated user against any target
 * userId, and this helper does not verify the viewer itself. The sole caller
 * is the `/bookmarks/exists` endpoint in `Bookmarks/index.ts`, which enforces
 * (tgUser === currentUser.id || viewer is post author || viewer is admin)
 * before delegating here.
 */
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
      overrideAccess: true
    })
    .then(({ totalDocs }) => totalDocs > 0)
    .catch((err) => {
      payload.logger.error(
        `Error in querying for ${target.relationTo} ${target.value} bookmark, for user ${userId} :` +
          err.message
      );
      throw err;
    });
}
