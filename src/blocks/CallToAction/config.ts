import {
	FixedToolbarFeature,
	HeadingFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type {Block} from 'payload'

import {linkGroup} from '@/payload/fields/linkGroup'
import {uuidv7} from "uuidv7";

export const CallToAction: Block = {
	slug: 'cta',
	interfaceName: 'CallToActionBlock',
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
			appearances: ['default', 'outline'],
			overrides: {
				maxRows: 2,
			},
		}),
	],
	labels: {
		plural: 'Calls to Action',
		singular: 'Call to Action',
	},
}
