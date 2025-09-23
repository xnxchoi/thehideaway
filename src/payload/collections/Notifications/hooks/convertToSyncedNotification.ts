import type { Notification } from "@/payload-types";
import type { SyncedNotification } from "./types";

// Helper function to convert Notification to SyncedNotification

export function convertToSyncedNotification(
  doc: Notification
): SyncedNotification {
  console.log("convertToSyncedNotification", doc);
  return {
    ...doc,
    recipient:
      typeof doc?.recipient === "string"
        ? doc?.recipient
        : doc?.recipient?.id || "",
    trigger: doc?.trigger
      ? {
          relationTo: doc.trigger.relationTo,
          value:
            typeof doc.trigger.value === "string"
              ? doc.trigger.value
              : doc.trigger.value?.id || ""
        }
      : null,
    thumbnail: doc.thumbnail
      ? {
          id:
            typeof doc.thumbnail === "string"
              ? doc.thumbnail
              : doc.thumbnail.id,
          alt: typeof doc.thumbnail === "string" ? "" : doc.thumbnail.alt || "",
          mimeType:
            typeof doc.thumbnail === "string"
              ? ""
              : doc.thumbnail.mimeType || "",
          url: typeof doc.thumbnail === "string" ? "" : doc.thumbnail.url || "",
          thumbnailURL:
            typeof doc.thumbnail === "string"
              ? ""
              : doc.thumbnail.thumbnailURL || null,
          darkmode:
            typeof doc.thumbnail === "string"
              ? null
              : doc.thumbnail.darkmode || null
        }
      : null
  } as SyncedNotification;
}
