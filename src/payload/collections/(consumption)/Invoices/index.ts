import {CollectionConfig} from "payload"

export const Invoices: CollectionConfig = {
	slug: "invoices",
	admin: {useAsTitle: "id"},
	defaultPopulate: {
		client: true,
		subscription: true,
		payment_method: true,
		paid: true,
		paid_at: true,
		status: true,
		last_due_check: true,
		invoice_number: true,
		currency: true,
		cycle_start: true,
		cycle_end: true,
		amount: true,
		createdAt: true,
		updatedAt: true,
	},
	access: {
		read: ({req}) => {
			if (req.user?.role === "admin") return true
			return {
				user: {equals: req.user?.id},
			}
		},
		update: ({req}) => {
			return req.user?.role === "admin"
		},
		create: ({req}) => {
			return req.user?.role === "admin"
		},
		delete: ({req}) => {
			return req.user?.role === "admin"
		},
	},
	fields: [
		{
			name: "invoice_number",
			type: "number",

			unique: true,
			index: true,
			access: {
				create: () => true,
				update: () => false,
			},
		},
		{
			name: "client",
			type: "relationship",
			relationTo: "users",
			required: true,
			maxDepth: 0,
			hasMany: false,
			index: true,
			access: {
				create: () => true,
				update: () => false,
			},
		},
	],
}
