import {idField} from "@/payload/fields/IDField";
import {Field} from "payload";
import {uuidv7} from "uuidv7";

export const searchFields: Field[] = [
	idField(),

	{
		name: "slug",
		type: "text",
		index: true,
		admin: {
			readOnly: true
		},
		required: true
	},
	{
		admin: {
			readOnly: true
		},
		name: "author",
		type: "array",
		fields: [
			idField(),
			{
				name: "key",
				type: "text",
				required: true
			}, {
				name: "name",
				type: "text",
				required: true
			},
			{
				name: "image",
				type: "text",

			}, {
				name: "slug",
				type: "text",
				required: true
			}
		], required: true, defaultValue: [
			{
				key: uuidv7(),
				name: "The Hideaway",
				slug: "the-hideaway",
				image: ""
			}
		],
		index: true,

	},
	{
		admin: {
			readOnly: true
		},
		name: "allowList",
		type: "array",
		fields: [
			idField(),
			{
				type: "text", required: true,
				name: "key"
			}
		],
		index: true
	},
	{
		admin: {
			readOnly: true
		},
		name: "locked",
		type: "checkbox",
		required: true, index: true,
		defaultValue: false
	},
	{
		admin: {
			readOnly: true
		},
		name: "authority",
		type: "number",
		index: true,
		max: 4,
		defaultValue: 0
	},
	{
		name: "tags",
		type: "array",
		maxRows: 5,
		index: true,
		admin: {
			readOnly: true
		},
		fields: [
			idField(),
			{
				name: "key",
				type: "text",
				required: true,
				index: true
			},
			{
				required: true,

				name: "title",
				type: "text"
			},
			{
				required: true,
				name: "slug",
				type: "text"
			}
		]
	},
	{
		label: "Category",
		name: "category",
		type: "array",
		maxRows: 1,
		index: true,
		admin: {
			readOnly: true
		}, required: true,
		defaultValue: async ({req}) => {
			const payload = req.payload;
			const categiry = await payload.find({
				collection: "categories",
				where: {
					slug: {
						like: "uncategorized"
					}
				},
				select: {
					slug: true,
					title: true,
				}, limit: 1, pagination: false, overrideAccess: true
			}).then(r => r.docs[0]);
			if (!categiry) {
				payload.logger.error("No default category found");
				return [{
					id: uuidv7(),
					title: "Uncategorized",
					key: uuidv7(),
					slug: "uncategorized"
				}]
			}
			return [{
				id: uuidv7(),
				title: categiry.title,
				key: categiry.id,
				slug: categiry.slug
			}];
		},
		fields: [
			idField(),
			{
				name: "key",
				type: "text",
				required: true,
				index: true
			},
			{
				required: true,

				name: "title",
				type: "text"
			},
			{
				required: true,
				name: "slug",
				type: "text"
			}
		]
	},
	{
		name: "meta",
		label: "Meta",
		type: "group",
		index: true,
		admin: {
			readOnly: true
		},
		fields: [
			{
				type: "text",
				name: "title",
				label: "Title"
			},
			{
				type: "text",
				name: "description",
				label: "Description"
			},
			{
				name: "image",
				label: "Image",
				type: "upload",
				relationTo: "media",
				admin: {
					allowCreate: false
				},
				hasMany: false
			}
		]
	}
];
