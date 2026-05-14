import {slugField} from "@/payload/fields"
import {CollectionConfig} from "payload"

export const FXRate: CollectionConfig = {
	slug: "exchange-rate",
	labels: {
		singular: "FXRate",
		plural: "FXRates",
	},
	access: {
		read: ({req}) => Boolean(req.user),
		create: ({req}) => req.user?.role === "admin",
		update: ({req}) => req.user?.role === "admin",
		delete: ({req}) => req.user?.role === "admin",
	},
	fields: [
		{
			name: "date",
			type: "date",
			required: true,
			unique: true,
			index: true,
		},
		{
			name: "rates",
			type: "array",
			fields: [
				{
					name: "currency",
					type: "relationship",
					relationTo: "currency",
					hasMany: false,
					required: true,
				},
				{name: "rate", type: "number", required: true, min: 0, index: true},
			],
			required: true,
			index: true,
		},
	],
}
export const Currency: CollectionConfig = {
	slug: "currency",
	admin: {
		useAsTitle: "name",
	},
	defaultPopulate: {
		name: true,
	},
	access: {
		read: ({req}) => Boolean(req.user),
		create: ({req}) => req.user?.role === "admin",
		update: ({req}) => req.user?.role === "admin",
		delete: ({req}) => req.user?.role === "admin",
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
			index: true,
			unique: true,
		},


		...slugField("name"),
		{name: "kr_nm", type: "text", required: true, index: true, unique: true},
	],
}
