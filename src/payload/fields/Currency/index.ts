import {Field, GroupField} from "payload";

export const currencyField: Field = {
	name: "currency",
	type: "select",
	options: ["usd", "eur", "cny", "krw"],
	hasMany: false,
	defaultValue: "krw",
	required: true,
};
export const currencyOptionsField: Field[] = [
	{
		name: "custom_unit_amount",
		type: "group",
		fields: [
			{
				name: "maximum",
				type: "number",
			},
			{
				name: "minimum",
				type: "number",
			},
			{
				name: "preset",
				type: "number",
			},
		],
	},

	{
		name: "tiers",
		type: "array",
		fields: [
			{
				name: "flat_amount",
				type: "number",
			},
			{
				name: "flat_amount_decimal",
				type: "text",
			},
			{
				name: "unit_amount",
				type: "number",
			},
			{
				name: "unit_amount_decimal",
				type: "text",
			},
			{
				name: "up_to",
				type: "number",
			},
		],
	},
	{
		name: "unit_amount",
		type: "number",
		defaultValue: 1,
	},
	{
		name: "unit_amount_decimal",
		type: "text",
		defaultValue: "1",
	},
];

export const tiersField = (
	{tiers, currencies}: { tiers: number; currencies: string[] } = {
		tiers: 1,
		currencies: ["krw", "usd", "eur"],
	},
): Field[] => {
	return [
		{
			name: "flat_amount",
			type: "number",
		},
	];
};
