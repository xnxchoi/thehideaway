import type {CollectionConfig} from "payload"
import {
	authenticated, isAdmin, standardCreateAccess, standardUpdateAccess,
} from "@/payload/plugins/locker/access/accessCheckers"

export const Occupations: CollectionConfig = {
	slug: "occupations",
	access: {
		create: standardCreateAccess,
		delete: isAdmin,
		read: authenticated,
		update: standardUpdateAccess,
	},
	admin: {
		useAsTitle: "title",

	},
	defaultPopulate: {
		title: true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			unique: true,
			index: true,
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			admin: {readOnly: true},
			index: true,
			hooks: {
				beforeChange: [
					({req, data, siblingData, operation, value, originalDoc}) => {
						if (!req.user) throw new Error("Not logged in")
						if (!req.user.id) throw new Error("No user id")
						if (operation === "create") return req.user.id
						return originalDoc.author
					},
				],
			},
		},
		{
			name: "users",
			type: "relationship",
			relationTo: "users",
			hasMany: true,
			admin: {},
			virtual: true,
			index: true,
		},
	],
}
