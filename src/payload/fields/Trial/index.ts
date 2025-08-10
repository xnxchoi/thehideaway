import {Field} from "payload";

export const TrialFields: Field[] = [
	{
		name: "trial_period_days",
		type: "number",
		min: 0,
		index: true,
	},
	{
		name: "trial_settings",
		type: "group",
		fields: [
			{
				name: "end_behavior",
				type: "group",
				fields: [
					{
						name: "missing_payment_method",
						type: "select",
						options: ["cancel", "create_invoice", "pause"],
						defaultValue: "cancel",
						index: true,
					},
				],
			},
			{
				name: "trial_start",
				type: "date",
				index: true,
				required: true,
				access: {
					update: () => false,
				},
			},
			{
				name: "trial_end",
				type: "date",
				index: true,
			},
		],
	},
];
