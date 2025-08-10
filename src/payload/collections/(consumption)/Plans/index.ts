// import { Plan } from "@/payload-types";
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField"
import {CollectionConfig} from "payload"

const Plans: CollectionConfig = {
	slug: "plans", admin: {useAsTitle: "name"}, fields: [{
		name: "role", type: "select", required: true, options: ["patron", "author"],
	},

		{
			name: "payment_methods",
			type: "select",
			hasMany: true,
			required: true,
			options: ["bank_transfer", "cash", "crypto"], // you can add more here
		}, {
			name: "name", type: "text", required: true, unique: true,
		}, {
			name: "type", type: "select", required: true, options: ["one_time", "recurring"],
		}, {
			name: "price",
			type: "relationship",
			relationTo: "prices",
			hasMany: true,
			required: true,
			minRows: 1,
		}, {
			name: "recurring", type: "group", admin: {
				condition: (data, siblingData) => siblingData.type === "recurring",
			}, fields: [{
				name: "interval", type: "number", required: true, min: 1,
			}, {
				name: "unit",
				type: "select",
				required: true,
				options: ["month", "year", "week", "day"], // add more units here if needed
			}, {
				name: "trial_days", type: "number", required: true, min: 0,
			}, // Add more recurring-related fields if needed
			],
		}, {
			name: "state", type: "select", required: true, options: ["active", "ended"], // you can add 'paused' etc. later
		},],
}

export default Plans

// export type RecurringPlan = Plan & {
//   type: "recurring";
//   recurring: {
//     interval: number;
//     unit: "month" | "year" | "week" | "day";
//     trial_days: number;
//   };
// };
