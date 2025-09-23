import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { User } from "@/payload-types";
import { onUserDeleted } from "@/lib/auth/hooks/sse-integration";

// Hook for when a user is updated (e.g., banned status changes)
export const afterUserChange: CollectionAfterChangeHook<User> = async ({
  doc,
  previousDoc,
  operation,
  req
}) => {
  try {
    // If user was banned, remove their SSE connections
    if (operation === "update" && doc.banned && !previousDoc?.banned) {
      req.payload.logger.info(
        `User ${doc.id} was banned, removing SSE connections`
      );
      await onUserDeleted(doc.id);
    }
  } catch (error) {
    req.payload.logger.error("Error in afterUserChange SSE hook:", error);
  }
};

// Hook for when a user is deleted
export const afterUserDelete: CollectionAfterDeleteHook<User> = async ({
  doc,
  req
}) => {
  try {
    req.payload.logger.info(
      `User ${doc.id} was deleted, removing SSE connections`
    );
    await onUserDeleted(doc.id);
  } catch (error) {
    req.payload.logger.error("Error in afterUserDelete SSE hook:", error);
  }
};
