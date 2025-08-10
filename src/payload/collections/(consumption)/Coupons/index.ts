import {
	isAdmin,
	isAdminOrEditor,
} from "@/payload/plugins/locker/access/accessCheckers";
import {currencyField} from "@/payload/fields/Currency";
import {CollectionConfig, FieldHookArgs} from "payload";

export const Coupons: CollectionConfig = {
	slug: "coupons",
	labels: {
		singular: "Coupon",
		plural: "Coupons",
	},
	admin: {
		useAsTitle: "name",
		hidden: ({user}) => user?.role !== "admin",
	},
	access: {
		create: isAdmin,
		read: isAdminOrEditor,
		update: isAdmin,
		delete: isAdmin,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		currencyField,
		{
			name: "amount_off",
			type: "number",
			required: true,
		},
		{
			name: "duration",
			type: "select",
			options: ["once", "repeating", "forever"],
			required: true,
			defaultValue: "once",
			access: {
				create: () => true,
				update: () => false,
			},
		},
		{
			name: "duration_in_months",
			type: "number",
			required: true,
			defaultValue: 1,
			min: 1,
		},
		{
			name: "percent_off",
			type: "number",
			required: true,
			defaultValue: 0,
			max: 100,
			min: 0,
			access: {
				create: () => true,
				update: () => false,
			},
		},
		{
			name: "times_redeemed",
			type: "number",
			required: true,
			defaultValue: 0,
		},
		{
			name: "max_redemptions",
			type: "number",
			required: true,
			defaultValue: 0,
		},
		{
			name: "redeem_by",
			type: "date",
			required: true,
		},
		{
			name: "valid",
			type: "checkbox",

			defaultValue: true,
		},
	],
	timestamps: true,
	versions: {
		drafts: true,
		maxPerDoc: 2,
	},
};
