import {
	NotificationParams,
	NotificationProps,
} from "@collections/Notifications/hooks/createNotification";

export const buildNotification = (
	options: NotificationProps,
): NotificationParams => ({
	recipient: options.recipient,
	type: options.type || "system",
	title: options.title,
	content: options.content || "",
	read: false,
	readAt: undefined,
	actionLink: {
		newTab: false,
		label: "View",
		...(options.actionLink || {
			type: "custom",
			appearance: "default",
			url: "/dashboard",
		}),
	},
	status: "unread",
	importance: options.importance || 0,
	sticky: options.sticky || false,
	dismissed: false,
});
