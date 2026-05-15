import { type PayloadHandler } from "payload";
import { userRateLimit } from "@/lib/rate-limit/userRateLimit";

/**
 * Mark every unread notification for the current user as read.
 *
 * Rate-limited per-user because the underlying operation is a bulk
 * UPDATE with no document-count ceiling — easy to abuse in a tight
 * loop. The 3-second window covers the legitimate UI burst (double-
 * click on "Mark all read") while still rejecting scripted floods.
 */
const READ_ALL_BUCKET = "notifications:read-all";
const READ_ALL_INTERVAL_MS = 3_000;

export const ReadAllNotifications: PayloadHandler = async (request) => {
  const payload = request.payload;
  const user = request.user;
  try {
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const limit = userRateLimit(READ_ALL_BUCKET, user.id, READ_ALL_INTERVAL_MS);
    if (!limit.allowed) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000))
        }
      });
    }

    const result = await payload.update({
      collection: "notifications",
      where: {
        and: [
          { recipient: { equals: user.id } },
          { read: { not_equals: true } }
        ]
      },
      data: {
        read: true,
        readAt: new Date().toISOString()
      }
    });

    return Response.json({
      success: true,
      updatedCount: result.docs.length,
      docs: result.docs,
      message: `Marked ${result.docs.length} notifications as read`
    });
  } catch (error) {
    payload.logger.error?.(
      `[notifications/read-all] failed for user ${user?.id ?? "?"}: ${(error as Error).message}`
    );
    return new Response("Internal Server Error", { status: 500 });
  }
};
