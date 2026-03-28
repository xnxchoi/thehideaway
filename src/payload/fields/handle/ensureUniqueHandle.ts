"use server";
import { authClient } from "@/lib/auth/client";
import { getPayload } from "@/lib/payload";
import { ensureHandleIsUnique } from "@/payload/collections/Users/endpoints/ensureHandleIsUnique";
import { HandleError } from "@/payload/fields/handle/index";
import { generateSmartSlugCandidates } from "@/payload/fields/handle/smartGenerateHandles";
import { User } from "@payload-types";

export async function ensureUniqueHandle({
  override,
  handle,
  userId
}: {
  userId: string;
  override?: boolean;
  handle: string;
}) {
  const payload = await getPayload();
  const { data } = await authClient.useSession();
  const { user: d } = data || { user: null as null | User };
  if (!override && (!d || (d.id !== userId && d.role !== "admin"))) {
    throw new HandleError("Unauthorized");
  }
  const user = await payload.findByID({
    collection: "users",
    id: userId,
    select: {
      displayUsername: true,
      firstName: true,
      lastName: true,
      email: true
    }
  });
  const exists = await ensureHandleIsUnique({
    handle,
    user: userId
  })
    .then((r) => r.valid)
    .catch((e) => {
      payload.logger.error({
        message: `Error while checking if handle ${handle} exists`,
        error: e
      });
      return false;
    });

  if (!exists) {
    const newHandles = generateSmartSlugCandidates({
      base: handle,
      displayUsername: user.displayUsername ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email ?? undefined,
      maxAttempts: 5
    });
    const handles: string[] = [];
    for (const hd of newHandles) {
      const valid = await ensureHandleIsUnique({
        handle: hd,
        user: userId
      })
        .then((r) => r.valid)
        .catch((e) => {
          payload.logger.error({
            message: `Error while checking if handle ${hd} exists`,
            error: e
          });
          return false;
        });

      if (valid) {
        handles.push(hd);
      }

      if (handles.length > 2) {
        throw new HandleError("handle_exists", { alts: handles });
      }
    }
    if (handles.length > 0) {
      throw new HandleError("handle_exists", { alts: handles });
    }
    throw new HandleError("no_alt_handle_exists");
  }
  return { message: "ok", handle: handle };
}
