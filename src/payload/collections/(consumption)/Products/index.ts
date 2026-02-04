import {authorFields} from "@/payload/fields/AuthorField/AuthorField";
import {lexicalEditor} from "@payloadcms/richtext-lexical";

import {CollectionConfig} from "payload";

export const Products: CollectionConfig = {
	slug: "products",
	labels: {
		singular: "Product",
		plural: "Products",
	},
	defaultPopulate: {
		id: true,
		name: true,
		active: true,
	},
	admin: {
		useAsTitle: "name",
		description: "Products",
		defaultColumns: ["name", "active"],
		hidden: ({user}) =>
			!["admin", "editor"].some((role) => user?.role === role),
	},
	access: {
		read: ({req: {user}}) => {
			if (["admin", "editor"].some((role) => user?.role === role)) {
				return true;
			}
			return {
				_status: {
					equals: "published",
				},
			};
		},
		create: ({req: {user}}) => {
			if (user?.role === "admin") {
				return true;
			}
			return false;
		},
		update: ({req: {user}}) => {
			if (["admin", "editor"].some((role) => user?.role === role)) {
				return true;
			}
			return false;
		},
		delete: ({req: {user}}) => {
			if (user?.role === "admin") {
				return true;
			}
			return false;
		},
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		{
			name: "active",
			type: "checkbox",
			defaultValue: true,
			required: true,
			index: true,
		},
		{
			name: "description",
			type: "richText",
			editor: lexicalEditor({}),
		},
		{
			name: "unit",
			type: "number",
			required: true,
			index: true,
			defaultValue: 1,
			min: 1,
		},
		{
			name: "price",
			type: "array",
			minRows: 1,
			required: true,
			fields: [
				{
					name: "currency",
					type: "select",
					required: true,
					index: true,
					defaultValue: "KRW",
					hasMany: false,
					options: ["KRW", "USD"],
				},
				{
					name: "amount",
					type: "number",
					required: true,
					index: true,
					min: 0,
					defaultValue: 0,
				},
				{
					name: "display_value",
					type: "text",
					index: true,
					defaultValue: "0",
				},
			],
		},
		{
			name: "stock_state",
			type: "select",
			options: ["in_stock", "out_of_stock", "pre_order", "on_request"],
			required: true,
			index: true,
			defaultValue: "on_request",
			hasMany: false,
		},
		{
			name: "inventory",
			type: "number",
			index: true,
			min: 0,
			defaultValue: 0,
		},
		{
			name: "max_order_quantity",
			type: "number",
			required: true,
			index: true,
			min: 1,
			defaultValue: 1,
		},
		{
			name: "min_order_quantity",
			type: "number",
			required: true,
			index: true,
			min: 1,
			defaultValue: 1,
		},
		{
			name: "image",
			type: "upload",
			relationTo: "media",
			hasMany: true,
			maxRows: 5,
			index: true,
		},
		...authorFields(false),
	],

	versions: {
		drafts: true,
		maxPerDoc: 10,
	},
};
