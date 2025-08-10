import {slugField} from "@/payload/fields"
import {CollectionConfig} from "payload"

export const ProductCategory: CollectionConfig = {
	slug: "product-category",
	labels: {
		singular: "Product Category",
		plural: "Product Categories",
	},
	defaultPopulate: {
		id: true,
		name: true,
		slug: true,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		...slugField("name"),
	],
}
export const ProductSubCategory: CollectionConfig = {
	slug: "product-sub",
	labels: {
		singular: "Product Sub Category",
		plural: "Product Sub Categories",
	},
	defaultPopulate: {
		id: true,
		name: true,
		slug: true,
	},
	fields: [
		{
			name: "name",
			type: "text",
			required: true,
		},
		...slugField("name"),
	],
}
