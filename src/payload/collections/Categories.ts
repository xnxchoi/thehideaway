import {ACField} from "@/AccessControlled/plugin";
import {standardUpdateAccess} from "@/payload/plugins/locker/access/accessCheckers";
import type {CollectionConfig} from "payload";
import {uuidv7} from "uuidv7";
import {hideIfNotAdmin} from "./helpers";
import { idField } from "@/payload/fields/IDField";

export const Categories: CollectionConfig = {
	slug: "categories",
	access: {
		create: standardUpdateAccess,
		delete: async ({req: {user}}) => {
			if (!user) return false;
			if (user.role === "admin") {
				return {
					title: {
						not_equals: "uncategorized"
					}
				};
			}
			return false;
		},
		read: () => true,
		update: ({req,}) => {
			const user = req.user;
			const ctx = req.context;
			if (ctx.overrideAccess) return true;
			if (!user) return false;
			if (user.role === "admin" || user.role === "editor") {
				return {
					title: {
						not_equals: "uncategorized"
					}
				};
			}
			return false;
		}
	},
	admin: {
		useAsTitle: "title",
		hidden: hideIfNotAdmin
	},
	defaultPopulate: {
		title: true,
		slug: true
	},
	fields: [    idField(),

    {
			name: "title",
			type: "text",
			required: true,
			index: true
		},
		{
			name: "relatedCategories",
			type: "relationship",
			relationTo: "categories",
			hasMany: true,
			defaultValue: [],
			maxDepth: 0,
			index: true
		},
		{
			name: "description",
			type: "textarea",
			index: true,
			defaultValue: () => ""
		},
		{
			type: "text",
			name: "slug",
			required: true,
			hooks: {
				afterRead: [({value}) => decodeURIComponent(value)],
				beforeChange: [
					({value}) => {
						return encodeURIComponent(value);
					}
				]
			}
		},
		{
			type: "join",
			name: "categorized",
			collection: ["surf", "posts"],
			on: "category",
			maxDepth: 1
		}, {
			// The Denormalized Counter (Concrete - good for Sorting)
			name: "popularity",
			type: "number", required: true,
			defaultValue: 0,
			index: true, // <--- Crucial for performance sorting
			admin: {
				components: ACField("number", {
					allowAuthor: false,
					allowedRoles: ["admin"]
				})
			},
		},
	],
	hooks: {
		afterRead: []
	}
};
