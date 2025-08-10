"use server";
import {PayloadRequest} from "payload";
import {Notification} from "@/payload-types";
import {buildNotification} from "@collections/Notifications/hooks/helpers/buildNotificationData";
import {LinkFieldParams} from "@collections/Notifications/hooks/types";
import {RequireKeysAndRestOptional} from "@/utilities/typeUtilities";

export type NotificationProps = Omit<
	Notification,
	| "createdAt"
	| "id"
	| "updatedAt"
	| "status"
	| "dismissed"
	| "read"
	| "readAt"
	| "actionLink"
> &
	Pick<Notification, "recipient" | "title"> & {
	actionLink: LinkFieldParams;
};
export type NotificationParams = Omit<
	Notification,
	"createdAt" | "id" | "updatedAt"
>;
export const createNotification = async (
	options: NotificationProps,
	req: RequireKeysAndRestOptional<PayloadRequest, "payload" | "context">,
) => {
	const payload = req.payload;
	// Set default values
	const notificationData = buildNotification(options);

	// Create the notification
	await payload.create({
		req,
		collection: "notifications",
		overrideAccess: true,
		data: notificationData as Notification,
		context: {
			overrideAccess: true,
			user: {
				role: req.user?.role || "guest",
			},
		},
	});
};
export const createNote = async ({
	req,
	data,
}: {
	req: PayloadRequest;
	data: NotificationParams;
}) => {
	const payload = req.payload;
	try {
		await payload.create({
			req,
			overrideAccess: true,
			context: {
				...req.context,
				overrideAccess: true,
			},
			collection: "notifications",
			data,
		});
	} catch (error) {
		console.error(error, "Error creating notification");
		payload.logger.error(error, "Error creating notification");
		throw error;
	}
};
