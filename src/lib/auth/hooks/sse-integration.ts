import { sseConnectionManager } from "@/lib/sse/connection-manager";
import type { Session, User } from "@/payload-types";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook
} from "payload";

/**
 * Better-Auth integration hooks for SSE connection management
 * These hooks ensure SSE connections are properly managed based on auth events
 */

/**
 * Hook to be called after successful sign-in
 * This doesn't create connections but prepares for them
 */
export const onSignIn = async (userId: string, sessionId: string) => {
  try {
    console.log(`User ${userId} signed in with session ${sessionId}`);
    // No action needed here - connections will be created when SSE endpoint is accessed
  } catch (error) {
    console.error("Error in onSignIn SSE hook:", error);
  }
};

/**
 * Hook to be called when a user signs out
 * This removes all SSE connections for the user
 */
export const onSignOut = async (userId: string, sessionId?: string) => {
  try {
    console.log(`User ${userId} signing out, removing SSE connections`);
    await sseConnectionManager.removeUserConnections(userId, "user_signout");
  } catch (error) {
    console.error("Error in onSignOut SSE hook:", error);
  }
};

/**
 * Hook to be called when a session expires
 * This removes connections associated with the expired session
 */
export const onSessionExpired = async (userId: string, sessionId: string) => {
  try {
    console.log(`Session ${sessionId} expired for user ${userId}`);
    await sseConnectionManager.removeUserConnections(userId, "session_expired");
  } catch (error) {
    console.error("Error in onSessionExpired SSE hook:", error);
  }
};

/**
 * Hook to be called when a user is deleted/banned
 * This removes all connections for the user
 */
export const onUserDeleted = async (userId: string) => {
  try {
    console.log(`User ${userId} deleted, removing all SSE connections`);
    await sseConnectionManager.removeUserConnections(userId, "user_deleted");
  } catch (error) {
    console.error("Error in onUserDeleted SSE hook:", error);
  }
};

/**
 * Middleware to validate SSE connections against active sessions
 * This can be called periodically or on-demand
 */
export const validateAllConnections = async () => {
  try {
    const stats = sseConnectionManager.getStats();
    console.log(
      `Validating ${stats.totalConnections} SSE connections for ${stats.activeUsers} users`
    );

    // The connection manager's cleanup interval will handle this automatically
    // This function is here for manual validation if needed
  } catch (error) {
    console.error("Error validating SSE connections:", error);
  }
};

/**
 * Get SSE connection statistics
 */
export const getSSEStats = () => {
  return sseConnectionManager.getStats();
};

/**
 * PayloadCMS hook to integrate with user lifecycle events
 */
export const createUserSSEHooks = (): {
  afterChange: CollectionAfterChangeHook<User>[];
  afterDelete: CollectionAfterDeleteHook<User>[];
} => {
  return {
    // Hook for when a user is updated (e.g., banned status changes)
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        if (operation === "update" && doc.banned && !previousDoc?.banned) {
          // User was banned, remove their connections
          await onUserDeleted(doc.id);
        }
      }
    ],

    // Hook for when a user is deleted
    afterDelete: [
      async ({ doc }) => {
        await onUserDeleted(doc.id);
      }
    ]
  };
};

/**
 * PayloadCMS hook to integrate with session lifecycle events
 */
export const createSessionSSEHooks = (): {
  afterDelete: CollectionAfterDeleteHook<Session>[];
  afterChange: CollectionAfterChangeHook<Session>[];
} => {
  return {
    // Hook for when a session is deleted (sign out)
    afterDelete: [
      async ({ doc }) => {
        if (doc.user) {
          const userId = typeof doc.user === "string" ? doc.user : doc.user.id;
          await onSignOut(userId, doc.id);
        }
      }
    ],

    // Hook for when a session is updated (e.g., expiration)
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        if (operation === "update") {
          const now = new Date();
          const expiresAt = new Date(doc.expiresAt);

          // If session has expired, remove connections
          if (expiresAt <= now && doc.user) {
            const userId =
              typeof doc.user === "string" ? doc.user : doc.user.id;
            await onSessionExpired(userId, doc.id);
          }
        }
      }
    ]
  };
};
