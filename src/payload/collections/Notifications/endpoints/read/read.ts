import { Notification } from "@payload-types";
import { type PayloadHandler } from "payload";
import { convertToSyncedNotification } from "../../hooks/convertToSyncedNotification";

export const ReadNotification: PayloadHandler = async (request) => {
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
    // Ownership-filtered read: previously this handler used findByID (no
    // ownership check) and only filtered on the subsequent update, leaking
    // other users' notification bodies in the GET response.
    const found = await payload
      .find({
        collection: "notifications",
        where: {
          and: [{ id: { equals: id } }, { recipient: { equals: user.id } }]
        },
        limit: 1,
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
      .catch((e) => {
        console.error("Error reading notification:", e);
        return null;
      });

    const notification = found?.docs?.[0]
      ? convertToSyncedNotification(found.docs[0])
      : null;

    if (!notification) {
      return new Response("Not Found", { status: 404 });
    }
    const r: Omit<Notification, "thumbnail"> & {
      thumbnail: null | string;
    } = {
      ...notification,
      thumbnail:
        (notification.thumbnail &&
          (typeof notification.thumbnail.value === "string"
            ? notification.thumbnail.value
            : notification.thumbnail.value.id)) ||
        null,
      read: true,
      readAt: new Date().toISOString(),
      actionLink: {
        ...notification.actionLink,
        newTab: false,
        label: notification.actionLink?.label || "Link"
      }
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
        payload.logger.error("Error reading notification:", e);
        return null;
      });
    if (!result) {
      return new Response("Internal Server Error", { status: 500 });
    }
    return Response.json({ success: true, notification: result });
  } catch (error) {
    console.error("Error reading notification:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
