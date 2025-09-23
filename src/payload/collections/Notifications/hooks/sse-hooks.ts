import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { Notification } from "@/payload-types";
import { SyncedNotification } from "./types";
import { convertToSyncedNotification } from "./convertToSyncedNotification";

// Import the SSE broadcast functions
// Note: We need to use dynamic import to avoid issues with server-side rendering
async function broadcastNotificationUpdate(
  userId: string,
  notification: SyncedNotification,
  action: "created" | "updated" | "deleted"
) {
  try {
    // Dynamic import to avoid SSR issues
    const { broadcastNotificationUpdate: broadcast } = await import(
      "@/app/api/notifications/stream/route"
    );
    broadcast(userId, notification, action);
  } catch (error) {
    console.error("Error broadcasting notification update:", error);
  }
}

// Hook for after notification creation
export const afterNotificationCreate: CollectionAfterChangeHook<
  Notification
> = async ({ doc, operation }) => {
  // Only trigger on create operations
  if (operation !== "create") return;

  try {
    const recipientId =
      typeof doc.recipient === "string" ? doc.recipient : doc.recipient?.id;

    if (recipientId) {
      const syncedNotification = convertToSyncedNotification(doc);
      await broadcastNotificationUpdate(
        recipientId,
        syncedNotification,
        "created"
      );
      console.log(
        `SSE: Broadcasted notification creation to user ${recipientId}`
      );
    }
  } catch (error) {
    console.error("Error in afterNotificationCreate hook:", error);
  }
};

// Hook for after notification update
export const afterNotificationUpdate: CollectionAfterChangeHook<
  Notification
> = async ({ doc, operation }) => {
  // Only trigger on update operations
  if (operation !== "update") return;

  try {
    const recipientId =
      typeof doc.recipient === "string" ? doc.recipient : doc.recipient?.id;

    if (recipientId) {
      const syncedNotification = convertToSyncedNotification(doc);
      await broadcastNotificationUpdate(
        recipientId,
        syncedNotification,
        "updated"
      );
      console.log(
        `SSE: Broadcasted notification update to user ${recipientId}`
      );
    }
  } catch (error) {
    console.error("Error in afterNotificationUpdate hook:", error);
  }
};

// Hook for after notification deletion
export const afterNotificationDelete: CollectionAfterDeleteHook<
  Notification
> = async ({ doc }) => {
  try {
    const recipientId =
      typeof doc.recipient === "string" ? doc.recipient : doc.recipient?.id;

    if (recipientId) {
      const syncedNotification = convertToSyncedNotification(doc);
      await broadcastNotificationUpdate(
        recipientId,
        syncedNotification,
        "deleted"
      );
      console.log(
        `SSE: Broadcasted notification deletion to user ${recipientId}`
      );
    }
  } catch (error) {
    console.error("Error in afterNotificationDelete hook:", error);
  }
};

// Combined hook that handles both create and update
export const afterNotificationChange: CollectionAfterChangeHook<
  Notification
> = async ({ doc, operation }) => {
  try {
    const recipientId =
      typeof doc.recipient === "string" ? doc.recipient : doc.recipient?.id;

    if (recipientId) {
      const syncedNotification = convertToSyncedNotification(doc);
      const action = operation === "create" ? "created" : "updated";
      await broadcastNotificationUpdate(
        recipientId,
        syncedNotification,
        action
      );
      console.log(
        `SSE: Broadcasted notification ${action} to user ${recipientId}`
      );
    }
  } catch (error) {
    console.error("Error in afterNotificationChange hook:", error);
  }
};
