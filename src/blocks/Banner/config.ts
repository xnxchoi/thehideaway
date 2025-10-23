import {
	FixedToolbarFeature,
	InlineToolbarFeature,
	lexicalEditor,
} from "@payloadcms/richtext-lexical"
import type {Block} from "payload"
import {uuidv7} from "uuidv7";

export const Banner: Block = {
	slug: "banner",
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
			name: "style",
			type: "select",
			defaultValue: "info",
			options: [
				{label: "Info", value: "info"},
				{label: "Warning", value: "warning"},
				{label: "Error", value: "error"},
				{label: "Success", value: "success"},
			],
			required: true,
		},
		{
			name: "content",
			type: "richText",
			editor: lexicalEditor({
				features: ({rootFeatures}) => {
					return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
				},
			}),
			label: false,
			required: true,
		},
	],
	interfaceName: "BannerBlock",
}
