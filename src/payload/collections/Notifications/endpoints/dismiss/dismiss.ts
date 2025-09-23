import { NextRequest } from "next/server";
import { getPayload, type PayloadHandler } from "payload";
import config from "@payload-config";
import type { SyncedNotification } from "../../hooks/types";
import { convertToSyncedNotification } from "../../hooks/convertToSyncedNotification";
import { Notification } from "@payload-types";

export const DismissNotification: PayloadHandler = async (request) => {
  const params = request.routeParams as { id: string };
  if (!params.id) {
    return new Response("Not Found", { status: 404 });
  }
  const id = params.id;
  const payload = request.payload;
  const user = request.user;
  try {
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const notification = await payload
      .findByID({
        collection: "notifications",
        id,
        select: {
          status: true,
          recipient: true,
          thumbnail: true,
          actionLink: true,
          content: true,
          read: true,
          readAt: true,
          dismissed: true,
          sticky: true,
          trigger: true,
          type: true,
          importance: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          id: true
        }
      })
      .then((r) => convertToSyncedNotification(r))
      .catch((e) => {
        console.error("Error dismissing notification:", e);
        return null;
      });

    if (!notification) {
      return new Response("Not Found", { status: 404 });
    }
    const r: Notification = {
      ...notification,
      thumbnail: notification.thumbnail?.id || null,
      dismissed: true
    };
    // Update the notification
    const result = await payload
      .update({
        collection: "notifications",
        data: r,
        where: {
          recipient: { equals: user.id },
          id: { equals: id }
        }
      })
      .catch((e) => {
        payload.logger.error("Error dismissing notification:", e);
        return null;
      });
    if (!result) {
      return new Response("Internal Server Error", { status: 500 });
    }
    return Response.json({ success: true, notification: result });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
