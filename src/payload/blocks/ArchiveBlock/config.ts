import {
	FixedToolbarFeature,
	HeadingFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type {Block} from 'payload'

export const Archive: Block = {
	slug: "archive",
	interfaceName: "ArchiveBlock",
	fields: [
		{
			name: "introContent",
			type: "richText",
			editor: lexicalEditor({
				features: ({rootFeatures}) => {
					return [
						...rootFeatures,
						HeadingFeature({enabledHeadingSizes: ["h1", "h2", "h3", "h4"]}),
						FixedToolbarFeature(),
						InlineToolbarFeature(),
					];
				},
			}),
			label: "Intro Content",
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
			],
		},
		{
			name: "categories",
			type: "relationship",
			admin: {
				condition: (_, siblingData) => siblingData.populateBy === "collection",
				allowCreate: false,
				allowEdit: false,
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
			max: 8,
			min: 1,
			defaultValue: 8,
			label: "Limit",
		},
		{
			name: "selectedDocs",
			type: "relationship",
			admin: {
				condition: (_, siblingData) => siblingData.populateBy === "selection",
				allowCreate: false,
				allowEdit: false,
			},
			hasMany: true,
			label: "Selection",
			relationTo: ["posts"],
		},
	],
	labels: {
		plural: "Archives",
		singular: "Archive",
	},
};
