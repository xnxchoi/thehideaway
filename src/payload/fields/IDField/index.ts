import {TextField} from "payload";
import {uuidv7} from "uuidv7";

export const idField = (props?: {
	adminOverrides?: Partial<Omit<NonNullable<TextField["admin"]>, "condition">>
	accessOverrides?: Partial<TextField["access"]>
}): TextField => {
	const adminOverrides = props?.adminOverrides || {},
		accessOverrides = props?.accessOverrides || {};
	return {
		name: "id",
		type: "text",
		defaultValue: uuidv7,
		access: {
			update: () => false,
			...accessOverrides
		},
		required: true,
		admin: {
			hidden: true,
			...adminOverrides
		},
		index: true,
		unique: true,
	}
}