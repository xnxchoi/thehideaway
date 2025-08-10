import type {CollectionConfig} from "payload"

import {
	isAdmin,
	anyone,
	authenticated,
	isEditor,
} from "@/payload/plugins/locker/access/accessCheckers"

export const Occupations: CollectionConfig = {
	slug: "occupations",
	access: {
		create: authenticated,
		delete: isEditor || isAdmin,
		read: anyone,
		update: isAdmin || isEditor,
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
			name: "users",
			type: "relationship",
			relationTo: "users",
			hasMany: true,
			admin: {
				position: "sidebar",
			},
			virtual: true,
			index: true,
		},
	],
}
