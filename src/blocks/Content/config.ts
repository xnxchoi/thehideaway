import {ImageBlock} from "@/blocks/ImageBlock/config";

import {link} from "@/payload/fields/link"
import {
	BlocksFeature,
	FixedToolbarFeature,
	HeadingFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from "@payloadcms/richtext-lexical"
import type {Block, Field} from "payload"
import {uuidv7} from "uuidv7";
import { AmbientAudioAnchorBlock } from "@/payload/Lexical/Features/AmbientAudio";

const columnFields: Field[] = [{
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
		name: 'size',
		type: 'select',
		defaultValue: 'oneThird',
		options: [
			{
				label: 'One Third',
				value: 'oneThird',
			},
			{
				label: 'Half',
				value: 'half',
			},
			{
				label: 'Two Thirds',
				value: 'twoThirds',
			},
			{
				label: 'Full',
				value: 'full',
			},
		],
	},
	{
		name: 'richText',
		type: 'richText',
		editor: lexicalEditor({
			features: ({rootFeatures}) => {
				return [
					...rootFeatures,
					HeadingFeature({enabledHeadingSizes: ['h2', 'h3', 'h4']}),
					FixedToolbarFeature(),
					InlineToolbarFeature(), BlocksFeature({
						blocks: [ImageBlock],inlineBlocks:[AmbientAudioAnchorBlock],
					})
				]
			},
		}),
		label: false,
	},
	{
		name: 'enableLink',
		type: 'checkbox',
	},
	link({
		overrides: {
			admin: {
				condition: (_data: any, siblingData: { enableLink: any; }) => {
					return Boolean(siblingData?.enableLink)
				},
			},
		},
	}),
]

export const Content: Block = {
	slug: 'content',
	interfaceName: 'ContentBlock',
	fields: [{
		name: "id",
		type: "text",
		defaultValue: () => uuidv7(),
		access: {
			update: () => false,
		},
		required: true,
		admin: {
			hidden: true,
		}
	},
		{
			name: 'columns',
			type: 'array',
			fields: columnFields,
			admin: {
				initCollapsed: true,
			},
		},
	],
}
