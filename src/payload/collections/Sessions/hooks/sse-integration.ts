import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { Session } from "@/payload-types";
import { onSignOut, onSessionExpired } from "@/lib/auth/hooks/sse-integration";

// Hook for when a session is deleted (sign out)
export const afterSessionDelete: CollectionAfterDeleteHook<Session> = async ({
  doc
}) => {
  try {
    if (doc.user) {
      const userId = typeof doc.user === "string" ? doc.user : doc.user.id;
      console.log(
        `Session ${doc.id} deleted for user ${userId}, removing SSE connections`
      );
      await onSignOut(userId, doc.id);
    }
  } catch (error) {
    console.error("Error in afterSessionDelete SSE hook:", error);
  }
};

// Hook for when a session is updated (e.g., expiration)
export const afterSessionChange: CollectionAfterChangeHook<Session> = async ({
  doc,
  previousDoc,
  operation
}) => {
  try {
    if (operation === "update" && doc.user) {
      const userId = typeof doc.user === "string" ? doc.user : doc.user.id;
      const now = new Date();
      const expiresAt = new Date(doc.expiresAt);

      // If session has expired, remove connections
      if (expiresAt <= now) {
        console.log(
          `Session ${doc.id} expired for user ${userId}, removing SSE connections`
        );
        await onSessionExpired(userId, doc.id);
      }
    }
  } catch (error) {
    console.error("Error in afterSessionChange SSE hook:", error);
  }
};
