import type {CheckboxField, FieldHookArgs, GroupField, TextField} from "payload"
import {uuidv7} from "zod"
import type {ImageCollection} from "@/types/payload-api-helpers"

const altField: TextField = {
	name: "alt",
	type: "text",
	defaultValue: "an image", required: true,
}
const captionField: TextField = {
	name: "caption",
	type: "text"
}
const darkmodeField: CheckboxField = {
	name: "darkmode",
	type: "checkbox",
	required: true,

	defaultValue: false,
	index: true
}
const afterReadFieldSrc = ({siblingData}: FieldHookArgs<ImageCollection, string, ImageCollection>) => {
	return siblingData.url || "";
}

const srcField: TextField = {
	name: "src",
	type: "text",
	virtual: true,
	hooks: {
		afterRead: [afterReadFieldSrc]
	}

}

const attributionField: GroupField = {
	type: "group",
	name: "attribution",
	admin: {
		components: {
			Field: {
				path: "@/AccessControlled/Group/index.tsx",
				serverProps: {
					allowedRoles: ["admin", "editor"],
					allowAuthor: true
				}
			}
		}
	},
	access: {
		read: () => true,
		update: ({req}) => {
			if (req.context.overrideAccess === true) return true
			if (req.user?.role === "admin") return true
			return false
		}
	},
	fields: [
		{
			name: "name",
			type: "text"
		},
		{
			name: "link",
			type: "text"
		}
	]
}
const sourceField: GroupField = {
	name: "source", type: "group", admin: {
		hidden: true
	}, access: {
		read: () => true,
		update: ({req, id, doc,}) => {
			if (req.context.overrideAccess) return true
			if (req.user) {
				if (req.user.role === "admin" || req.user.role === "editor") {
					return true
				}
			}
			return false
		}
	}, fields: [{
		name: "identifier", type: "text", defaultValue: () => uuidv7(), access: {
			update: () => false
		}
	}, {
		name: "link", type: "text", admin: {
			hidden: true
		}
	}, {
		name: "provider",
		type: "select",
		options: ["local", "unsplash", "pexels"],
		required: true,
		defaultValue: "local"
	}]
}
const fundFields = [altField, darkmodeField,]
const baseFields = [
	srcField, captionField
]
const groupFields = [attributionField, sourceField]
export {fundFields, baseFields, groupFields,}