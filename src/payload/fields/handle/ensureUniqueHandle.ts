"use server";
import { getSession } from "@/lib/actions/auth";
import { getPayload } from "@/lib/payload";
import { ensureHandleIsUnique } from "@/payload/collections/Users/endpoints/ensureHandleIsUnique";
import { HandleError } from "@/payload/fields/handle/index";
import { generateSmartSlugCandidates } from "@/payload/fields/handle/smartGenerateHandles";

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
  const { user: currentUser } = await getSession();

  if (!override && (!currentUser || (currentUser.id !== userId && currentUser.role !== "admin"))) {
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

  const isAvailable = await ensureHandleIsUnique({
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

  if (!isAvailable) {
    // Generate more candidates so we can reliably surface 3–5 valid alternatives
    const candidates = generateSmartSlugCandidates({
      base: handle,
      displayUsername: user.displayUsername ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      email: user.email ?? undefined,
      maxAttempts: 12
    });

    const alts: string[] = [];
    for (const candidate of candidates) {
      if (alts.length >= 5) break;
      const valid = await ensureHandleIsUnique({
        handle: candidate,
        user: userId
      })
        .then((r) => r.valid)
        .catch((e) => {
          payload.logger.error({
            message: `Error while checking if handle ${candidate} exists`,
            error: e
          });
          return false;
        });

      if (valid) {
        alts.push(candidate);
      }
    }

    throw new HandleError("handle_exists", { alts });
  }

  return { message: "ok", handle };
}
