import type {CollectionConfig} from "payload"
import {slugField} from "@/payload/fields/slug"
import {
	isAdmin,
	authenticated,
	standardUpdateAccess,
} from "@/payload/plugins/locker/access/accessCheckers"
import {createCuid} from "@/utilities/stringUtilities"

export const Categories: CollectionConfig = {
	slug: "categories",
	access: {
		create: standardUpdateAccess,
		delete: async ({req: {user}}) => {
			if (!user) return false
			if (user.role === "admin") {
				return {
					title: {
						not_equals: "uncategorized",
					},
				}
			}
			return false
		},
		read: () => true,
		update: ({req: {user}}) => {
			if (!user) return false
			if (user.role === "admin" || user.role === "editor") {
				return {
					title: {
						not_equals: "uncategorized",
					},
				}
			}
			return false
		},
	},
	admin: {
		useAsTitle: "title",
		hidden: ({user}) => {
			if (!user) return true
			if (user?.role === "admin") return false
			return true
		},
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
		title: true,
		slug: true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			index: true,

		},
		{
			name: "relatedCategories",
			type: "relationship",
			relationTo: "categories",
			hasMany: true,
			defaultValue: [],
			maxDepth: 0,
			index: true,
		},
		{
			name: "description",
			type: "textarea",
			index: true,
		},
		...slugField("title", {
			checkboxOverrides: {
				admin: {
					readOnly: !isAdmin,
				},
			},
		}),
	],
	hooks: {
		afterRead: []
	}
}
