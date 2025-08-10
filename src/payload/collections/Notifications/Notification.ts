import {CollectionConfig} from "payload";
import {link} from "@/payload/fields/link";
import {DateTime} from "luxon";
import {fetchMyNotifications} from "@collections/Users/endpoints/fetchMyNotifications";

/**
 * Notifications Collection Configuration
 *
 * This collection handles all types of user notifications in a social networking context.
 * It includes relations to users, content types, and various metadata to support
 * a robust notification system similar to major platforms.
 */
export const Notifications: CollectionConfig = {
	slug: "notifications",
	admin: {
		useAsTitle: "title",
		hidden: ({user}) => {
			if (!user) return true;
			if (user?.role === "admin") return false;
			return true;
		},
		defaultColumns: ["recipient", "type", "status", "createdAt"],
		description: "User notifications for system events and social interactions",
		/*
	   components: {
		   views: {
			 edit: {
			   default: {
				 Component: "@/payload/views/Edit/index.tsx#DefaultEditView",
			   },
			 },
		   },
		 },
	 */
	},
	defaultPopulate: {
		recipient: true,
		status: true,
		read: true,
		sticky: true,
		trigger: true,
		type: true,
		importance: true,
		title: true,
		actionLink: true,
		thumbnail: true,
		content: true,
		readAt: true,
		createdAt: true,
		updatedAt: true,
		id: true,
	},
	access: {
		read: ({req: {user}}) => {
			if (!user) return false;
			if (user?.role === "admin") return true;
			return {
				recipient: {
					equals: user?.id,
				},
			};
		},
		create: ({req: {user}}) => {
			if (!user) return false;
			return !!(user?.role === "admin");
		},
	},
	fields: [
		// Target user (recipient)
		{
			name: "recipient",
			type: "relationship",
			relationTo: "users",
			required: true,
			index: true,
			access: {
				create: () => true,
				update: () => false,
			},
			admin: {
				hidden: true,
			},
			hasMany: false,
			maxDepth: 0,
		},

		// Actor (the trigger of the notification, if applicable)
		{
			name: "trigger",
			type: "relationship",
			relationTo: [
				"posts",
				"delta",
				"users",
				"profile",
				"bookmarks",
				"follows",
			],
			hasMany: false,

			maxDepth: 0,
		},
		{
			name: "thumbnail",
			type: "relationship",
			relationTo: "assets",
			maxDepth: 1,
			defaultValue: async (args) => {
				const {req} = args;
				const {payload} = req;
				const thumb = await payload.find({
					collection: "assets",
					where: {
						mimeType: {
							like: "image",
						},
					},
					limit: 1,
					sort: "createdAt",
				});
				return thumb?.docs?.[0]?.id ?? null;
			},
		},

		// Notification type
		{
			name: "type",
			type: "select",
			required: true,
			hasMany: false,
			index: true,
			defaultValue: "system",
			access: {
				create: () => true,
				update: () => false,
			},
			options: [
				{label: "Comment", value: "comment"},
				{label: "Follow", value: "follow"},

				{
					label: "Mention",
					value: "mention",
				},
				{label: "System", value: "system"},
				{label: "Access", value: "access"},
				{label: "Bookmark", value: "bookmark"},
				{label: "Profile", value: "profile"},
				{label: "Post", value: "post"},
				{label: "Delta", value: "delta"},
				{label: "Notification", value: "notification"},
			],
			admin: {},
		},

		/**
		 * Importance level
		 * 0 is default
		 * 1 is moderate; notifications that have a trigger fall under this level
		 * 2 is high; notifications that require a timely response / sticky=true fall under here (user interactions like mentions, likes; announcements; new features...)
		 * 3 is critical; notifications that require immediate action fall under here (account related, billings)
		 */
		{
			name: "importance",
			type: "number",
			required: true,
			defaultValue: 0,
			max: 3,
			min: 0,
			access: {
				create: () => true,
				update: () => false,
			},
		},

		// Status
		{
			name: "status",
			type: "select",
			required: true,
			defaultValue: "unread",
			access: {
				create: () => false,
				update: () => true,
			},
			options: [
				{label: "Unread", value: "unread"},
				{label: "Read", value: "read"},
				{
					label: "Dismissed",
					value: "dismissed",
				},
			],
			admin: {},
		},
		{
			name: "read",
			type: "checkbox",
			required: true,
			defaultValue: false,
			index: true,
			access: {
				create: () => false,
				update: () => true,
			},
		},
		{
			name: "dismissed",
			type: "checkbox",
			required: true,
			defaultValue: false,
			index: true,
			access: {
				create: () => false,
				update: () => true,
			},
		},
		// Date read
		{
			name: "readAt",
			type: "date",
			access: {
				create: () => false,
				update: () => true,
			},
			index: true,
		},

		// Sticky notification
		{
			name: "sticky",
			type: "checkbox",
			defaultValue: false,
			label: "Pin to top",
			index: true,
			required: true,
		},

		// Notification summary (for admin display)
		{
			name: "title",
			type: "text",
			required: true,
		},

		// Detailed content
		{
			name: "content",
			type: "text",
			required: true,
			defaultValue: (args) => {
				return `New notification at ${DateTime.now().
					toLocaleString(DateTime.DATETIME_SHORT)}`;
			},
			access: {
				create: () => true,
				update: () => false,
			},
		},
		link({
			overrides: {
				name: "actionLink",
			},
		}), // Group identifier (for grouping similar notifications)
	],
	timestamps: true, // Automatically adds createdAt and updatedAt
	hooks: {
		beforeChange: [
			({data, operation, originalDoc}) => {
				// Set readAt timestamp when status changes to 'read'
				if (operation === "update") {
					if (data.read || data.dismissed) {
						data.read = true;
						if (data.dismissed || originalDoc?.dismissed) {
							data.status = "dismissed";
							data.dismissed = true;
						} else {
							if (!originalDoc?.read) {
								data.readAt = data.readAt || DateTime.now().toISO();
								data.status = "read";
							} else {
								delete data.readAt;
							}
						}
					}
				}
				if (operation === "create") {
					if (data.trigger) {
						data.importance = Math.max(data.importance, data.sticky ? 2 : 1);
					}
					data.readAt = null;
					data.status = "unread";
					data.dismissed = false;
					data.read = false;
				}
			},
		],
	},
	endpoints: [
		{
			path: "/me",
			method: "get",
			handler: fetchMyNotifications,
		},
	],
};
