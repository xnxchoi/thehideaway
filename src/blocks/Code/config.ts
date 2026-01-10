import type {Block} from "payload";
import {uuidv7} from "uuidv7";

export const Code: Block = {
	slug: "code",
	interfaceName: "CodeBlock",
	admin: {
		components: {
			Block: {
				path: "@/blocks/Code/Component.client.tsx#Code"
			}
		}
	},
	fields: [
		{
			name: "id",
			type: "text",
			defaultValue: () => uuidv7(),
			access: {
				update: () => false
			},
			required: true,
			admin: {
				hidden: true
			}
		},
		{
			name: "language",
			type: "select",
			defaultValue: "typescript",
			options: [
				{
					label: "Typescript",
					value: "typescript"
				},
				{
					label: "Javascript",
					value: "javascript"
				},
				{
					label: "CSS",
					value: "css"
				}
			]
		},
		{
			name: "code",
			type: "code",
			label: false,
			required: true
		}
	]
};
