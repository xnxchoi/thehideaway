import {
	FixedToolbarFeature,
	HeadingFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type {Field} from 'payload'

import {linkGroup} from '@/payload/fields/linkGroup'
import {uuidv7} from "uuidv7";

export const hero: Field = {
	name: 'hero',
	type: 'group',
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
			name: 'type',
			type: 'select',
			defaultValue: 'lowImpact',
			label: 'Type',
			options: [
				{
					label: 'None',
					value: 'none',
				},
				{
					label: 'High Impact',
					value: 'highImpact',
				},
				{
					label: 'Medium Impact',
					value: 'mediumImpact',
				},
				{
					label: 'Low Impact',
					value: 'lowImpact',
				},
			],
			required: true,
		},
		{
			name: 'richText',
			type: 'richText',
			editor: lexicalEditor({
				features: ({rootFeatures}) => {
					return [
						...rootFeatures,
						HeadingFeature({enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4']}),
						FixedToolbarFeature(),
						InlineToolbarFeature(),
					]
				},
			}),
			label: false,
		},
		linkGroup({
			overrides: {
				maxRows: 2,
			},
		}),
		{
			name: 'media',
			type: 'upload',
			admin: {
				condition: (_, {type} = {}) => ['highImpact', 'mediumImpact'].includes(type),
			},
			relationTo: 'media',
			required: true,
		},
	],
	label: false,
}
