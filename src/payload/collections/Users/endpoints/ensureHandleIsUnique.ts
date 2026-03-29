"use server";
import { getSession } from "@/lib/actions/auth";
import { getPayload } from "@/lib/payload";
import { HANDLE_TEST_REGEX } from "@/payload/fields/handle/formatUserHandle";
import { RP_Roles } from "@/stores/Notification/NotificationStore";

export async function ensureHandleIsUnique(props: {
  handle: string;
  user?: string;
  overrides?: boolean;
}): Promise<
  {
    message: string;
  } & (
    | {
        valid: false;
        handle?: string;
      }
    | { valid: true; handle: string }
  )
> {
  const { overrides, handle, user: userId } = props;

  const { user } = await getSession();
  if (!overrides && (!user || user.id !== userId)) {
    throw new Error("User is not authorized");
  }
  const { banned } = user;
  if (banned) {
    throw new Error("User is banned");
  }
  if (!HANDLE_TEST_REGEX.test(handle)) {
    throw new Error("Invalid handle format");
  }
  const payload = await getPayload();

  return await payload
    .count({
      collection: "users",
      overrideAccess: true,
      context: {
        user: { role: user.role as unknown as RP_Roles },
        overrideAccess: true
      },
      where: {
        and: [
          {
            or: [
              {
                slug: {
                  equals: handle
                }
              },
              {
                username: {
                  equals: handle
                }
              }
            ]
          },
          {
            id: {
              not_in: [userId]
            }
          }
        ]
      }
    })
    .then((r) => {
      const valid = r.totalDocs < 1;
      return {
        message: valid ? "ok" : "Handle already exists",
        valid,
        handle
      };
    })
    .catch((e) => ({
      message: e instanceof Error ? e.message : "Unknown error",
      valid: false
    }));
}
/**
 *   const newHandles = generateSmartSlugCandidates({
            base: handle,
            username: user.name,
            email: user.email,
            maxAttempts: 3,
        });
        const handles = await Promise.all(
            newHandles.flatMap(async (hd) => {
                const exists = await payload.find({
                    collection: "users",
                    draft: draft.isEnabled,
                    limit: 1,
                    overrideAccess: true,
                    depth: 0,
                    where: {
                        id: {
                            not_equals: user.id,
                        },
                        slug: {
                            equals: hd,
                        },
                    },
                });
                const adminExists = await payload.find({
                    collection: "admins",
                    draft: draft.isEnabled,
                    limit: 1,
                    overrideAccess: true,
                    depth: 0,
                    where: {
                        id: {
                            not_equals: user.id,
                        },
                        slug: {
                            equals: hd,
                        },
                    },
                });
                if (adminExists.totalDocs > 0 || exists.totalDocs > 0) return;
                return hd;
            }),
        );
        if (handles.length > 0) {
            return Response.json(
                { error: "handle_exists", suggestions: handles },
                { status: 409 },
            );
        }
 */
