import type {Block} from "payload";
import {uuidv7} from "uuidv7";

export const ImageBlock: Block = {
	slug: "image",
	labels: {
		singular: "Image",
		plural: "Images"
	},
	interfaceName: "Image",
	admin: {
		disableBlockName: true,
		components: {
			Block: {
				path: "@/blocks/ImageBlock/Comp/client/component/index.tsx#RP_ImageBlock",

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
			name: "media",
			type: "upload",
			relationTo: ["media", "userMedia"],
			filterOptions: ({data, id, relationTo, req, user}) => {
				return {
					mimeType: {
						like: "image/%"
					}
				}
			},
			maxDepth: 2,
			hasMany: false,
			admin: {
				// hidden: true,
			},
		}, {
			type: "number",
			name: "span",
			min: 144,
			max: 1440,
			admin: {
				hidden: true,
			},
			defaultValue: 600,
		}
	]
};
