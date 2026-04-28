import type { CollectionAfterChangeHook } from "payload";
import {
  roleToAuthority,
  type Role
} from "@/payload/plugins/locker/fields/authority/utils";

const APPROVED_POSTS_THRESHOLD = 3;

// Auto-promotion only applies to `member`. A Patron contributor must be
// promoted manually by an editor — auto-promoting Patron → Author would
// silently strip their Patron tier label (single-role enum) and leave them
// stuck as Author after they cancel their Patron subscription, since the
// syncRole demotion path only fires when currentRole === canceled-tier.
// Editors retain full control over Patron → Author transitions in /vault.
const eligibleBaseRoles: Role[] = ["member"];

export const maybePromoteToAuthor = async ({
  userId,
  req
}: {
  userId: string;
  req: Parameters<CollectionAfterChangeHook>[0]["req"];
}): Promise<void> => {
  const user = await req.payload.findByID({
    collection: "users",
    id: userId,
    depth: 0,
    overrideAccess: true
  });
  if (!user) return;

  const role = (user.role || "user") as Role;
  if (!eligibleBaseRoles.includes(role)) return;
  if (roleToAuthority(role) >= roleToAuthority("author")) return;

  const approved = await req.payload.count({
    collection: "posts",
    overrideAccess: true,
    where: {
      and: [
        { author: { equals: userId } },
        { _status: { equals: "published" } },
        { approved_by_editor: { equals: true } }
      ]
    }
  });

  if ((approved.totalDocs ?? 0) >= APPROVED_POSTS_THRESHOLD) {
    await req.payload.update({
      collection: "users",
      id: userId,
      data: { role: "author" as const },
      overrideAccess: true
    });
    req.payload.logger.info?.(
      `[promoteToAuthor] user=${userId} promoted to author (${approved.totalDocs} approved posts)`
    );
  }
};

export const promoteAuthorAfterPostChange: CollectionAfterChangeHook = async ({
  doc,
  req
}) => {
  const author = doc?.author;
  const authorId =
    typeof author === "string"
      ? author
      : author && typeof author === "object"
        ? (author as { id: string }).id
        : null;
  if (!authorId) return doc;
  if (doc?.approved_by_editor !== true) return doc;
  if (doc?._status !== "published") return doc;
  await maybePromoteToAuthor({ userId: authorId, req });
  return doc;
};
