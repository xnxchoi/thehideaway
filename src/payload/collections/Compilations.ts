import {ACField} from "@/AccessControlled/plugin"
import {isAuthorOrEditor} from "@/payload/plugins/locker/access/accessCheckers"
import type {CollectionConfig} from "payload"
import {uuidv7} from "uuidv7";
import {hideIfNotAdmin} from "./helpers"

export const Compilations: CollectionConfig = {
	slug: "compilations",

	access: {
		create: isAuthorOrEditor,
		delete: isAuthorOrEditor,
		read: () => true,
		update: isAuthorOrEditor
	},
	admin: {
		useAsTitle: "title",
		hidden: hideIfNotAdmin
	},
	forceSelect: {
		title: true,
		items: true,
	},
	fields: [{
		name: "id",
		type: "text",
		defaultValue: uuidv7,
		access: {
			update: () => false
		},
		required: true,
		admin: {
			hidden: true
		}
	},
		{
			name: "title",
			type: "text",
			required: true,
			index: true,
			admin: {
				components: ACField("text")
			}
		},
		{
			name: "items",
			type: "relationship",
			relationTo: ["assets", "media"],
			required: true,
			maxDepth: 2,
			hasMany: true,
			admin: {
				components: ACField("relationship",)
			}
		}, {
			name: "imagePicker",
			type: "checkbox",
			required: true,
			defaultValue: true,
			admin: {
				components: ACField("checkbox")
			}
		}
		// {
		//   name: "relatedCompilations",
		//   type: "relationship",
		//   relationTo: "compilations",
		//   hasMany: true,
		//   defaultValue: [],
		//   maxDepth: 0,
		//   index: true
		// },

	],
	hooks: {
		afterRead: []
	}
};
 