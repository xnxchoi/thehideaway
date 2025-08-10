import {
	addDataAndFileToRequest,
	ArrayField,
	CollectionConfig,
	PayloadRequest,
	ValidateOptions,
} from "payload";
import {DateTime} from "luxon";
import {Holiday} from "../../payload-types";

export const Holidays: CollectionConfig = {
	slug: "holidays",
	labels: {
		singular: "Holiday",
		plural: "Holidays",
	},
	defaultPopulate: {
		date: true,
		period: true,
		name: true,
		country: true,
	},
	admin: {
		hidden: ({user}) => {
			if (!user) {
				return true;
			}
			return user.role !== "admin";
		},
	},
	access: {
		create: ({req}) => {
			const {user} = req;
			if (!user) {
				return false;
			}
			return user.role === "admin";
		},
		read: () => true,
		update: () => false,
		delete: () => false,
	},
	fields: [
		{
			name: "dates",
			type: "array",
			fields: [
				{
					name: "date",
					type: "date",
					required: true,
					index: true,
				},
				{
					name: "name",
					type: "text",
					required: true,
					index: true,
				},
			],
			required: true,
			index: true,
		},
		{
			name: "period",
			type: "number",
			required: true,
			unique: true,
			index: true,
			access: {
				create: () => true,
				update: () => false,
			},
			min: 201501,
		},

		{
			name: "country",
			type: "text",
			required: true,
			index: true,
			defaultValue: "kr",
		},
	],
	endpoints: [
		{
			path: "/getHolidays",
			method: "get",
			handler: async (req: PayloadRequest) => {
				await addDataAndFileToRequest(req);
				const {period} = req.query;

				if (!period) {
					return Response.json(
						{
							error: "Period is required",
						},
						{
							status: 400,
						},
					);
				}
				if (typeof period !== "string") {
					return Response.json(
						{
							error: "Period must be a string",
						},
						{
							status: 400,
						},
					);
				}
				if (period.length !== 6) {
					return Response.json(
						{
							error: "Period must be 6 digits",
						},
						{
							status: 400,
						},
					);
				}
				const numPeriod = parseInt(period as string, 10);
				if (!numPeriod) {
					return Response.json(
						{
							error: "Invalid period",
						},
						{
							status: 400,
						},
					);
				}
				if (numPeriod < 201501) {
					return Response.json(
						{
							error: "Period must be 201501 (Jan. 2015) or later",
						},
						{
							status: 400,
						},
					);
				}
				if (numPeriod > 205012) {
					return Response.json(
						{
							error: "Period must be no later than 205012 (Dec. 2050) ",
						},
						{
							status: 400,
						},
					);
				}
				const payload = req.payload;
				const holidays = await payload.find({
					collection: "holidays",
					where: {
						period: {
							equals: numPeriod,
						},
					},
				}).then((res) => res.docs).catch(() => {
					console.error("Error fetching holidays");
					throw Response.json(
						{
							error: "Error fetching holidays",
						},
						{
							status: 500,
						},
					);
				});

				return Response.json(holidays, {
					status: 200,
				});
			},
		},
	],
};
