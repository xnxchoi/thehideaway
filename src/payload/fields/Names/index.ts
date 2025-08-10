import type {TextField} from "payload"
import {getServerSideURL} from "@/utilities/getURL"

export const firstNameField: TextField = {
	name: "firstName",
	required: true,
	type: "text",
	index: true,
	label: "First Name",
	defaultValue: "",
	access: {
		update: ({req, id}) => {
			if (!req.user) return false
			const user = req.user
			if (user.id === id) return true
			if (user?.role === "admin") return true
			return false
		},
	},

	admin: {

		description: "Your first name",
		components: {
			Field: {
				path: "@/payload/fields/Names/NameComponent#NameComponent",
				clientProps: {
					path: "firstName",
				},
			},
		},
	},
}

export const lastNameField: TextField = {
	name: "lastName",
	required: true,
	type: "text",
	index: true,
	label: "Last Name",
	defaultValue: "",
	admin: {

		description: "Your last name",
		components: {
			Field: {
				path: "@/payload/fields/Names/NameComponent#NameComponent",
				clientProps: {
					path: "lastName",
				},
			},
		},
	},
}
