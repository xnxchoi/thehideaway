import { type PayloadHandler } from "payload";

export const ReadAllNotifications: PayloadHandler = async (request) => {
  const payload = request.payload;
  const user = request.user;
  try {
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Update the notification
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
    console.error("Error marking all notifications as read:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
