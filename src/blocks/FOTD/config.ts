import {
	FixedToolbarFeature,
	InlineToolbarFeature,
	lexicalEditor
} from "@payloadcms/richtext-lexical"
import type {Block} from "payload"
import {uuidv7} from "uuidv7";

export const FOTD: Block = {
	slug: "fotd",
	interfaceName: "FOTDBlock",
	fields: [{
		name:"id",
		type:"text",
		defaultValue:()=>uuidv7(),
		access:{
			update:()=>false,
		},
		required:true,
		admin:{
			hidden:true,
		}
	},
		{
			name: "headline",
			type: "text",
			label: "Headline",
			required: true,
			defaultValue: "ONE-STOP ARCHIVE FOR YOUR LIFE.",
		},
		{
			name: "subheading",
			type: "richText",
			required: true,
			editor: lexicalEditor({
				features: ({rootFeatures}) => {
					return [
						...rootFeatures,
						FixedToolbarFeature(),
						InlineToolbarFeature(),
					];
				},
			}),
			label: "Subheading",
		},
		{
			name: "populateBy",
			type: "select",
			defaultValue: "collection",
			options: [
				{
					label: "Collection",
					value: "collection",
				},
				{
					label: "Individual Selection",
					value: "selection",
				},
			],
		},
		{
			name: "relationTo",
			type: "select",
			admin: {
				condition: (_, siblingData) => siblingData.populateBy === "collection",
			},
			defaultValue: "posts",
			label: "Collections To Show",
			options: [
				{
					label: "Posts",
					value: "posts",
				},
				{
					label: "Surf",
					value: "surf",
				},
			],
			hasMany: true,
		},
		{
			name: "categories",
			type: "relationship",
			admin: {
				allowCreate: false,
				allowEdit: false,
				condition: (_, siblingData) => siblingData.populateBy === "collection",
			},
			hasMany: true,
			label: "Categories To Show",
			relationTo: "categories",
		},
		{
			name: "limit",
			type: "number",
			admin: {
				condition: (_, siblingData) => siblingData.populateBy === "collection",
				step: 1,
			},
			defaultValue: 3,
			max: 5,
			min: 1,
			label: "Limit",
		},
		{
			name: "selectedDocs",
			type: "relationship",
			admin: {
				condition: (_, siblingData) => siblingData.populateBy === "selection",
			},
			hasMany: true,
			maxRows: 5,
			minRows: 1,
			label: "Selection",
			relationTo: ["posts", "pages"],
		},
	],
	labels: {
		plural: "FOTDs",
		singular: "FOTD",
	},
};
