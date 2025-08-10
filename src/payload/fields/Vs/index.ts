import {SelectField} from "payload"

export const VisibilityField = ({overrides}: { overrides: Partial<SelectField> }): SelectField => {
	const baseField = {
		name: "visibility",
		type: "select",
		hasMany: false,
		index: true,
		options: ["public", "private", "unlisted"],
		defaultValue: "public",
		admin: {

			condition: (siblingData) => {
				if (!siblingData || !siblingData._status) return false
				return siblingData._status === "published"
			},
		},
		hooks: {
			beforeValidate: [
				async ({req, data, siblingData, value, originalDoc}) => {
					if (!req.user) return data
					const res =
						(req.user &&
							(req.user?.role === "admin" ||
								req.user.id === siblingData.author.id)) ||
						false
					if (res) {
						if (siblingData._status === "published") {
							if (value !== "private" && value !== "public") {
								return "public"
							}
							return value
						} else if (siblingData._status === "draft") {
							return "private"
						}
						return "private"
					} else {
						return originalDoc.state
					}
				},
			],
		},
		...overrides
	} as SelectField
	return baseField
}