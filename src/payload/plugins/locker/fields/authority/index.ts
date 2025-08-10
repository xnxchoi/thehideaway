import {CollectionSlug, NumberField, RadioField} from "payload"
import {authorityFieldAdmin} from "@/payload/plugins/locker/fields/authority/admin"
import {authorityFieldAccess} from "./access"

export const authorityField = (props: {
	collection: CollectionSlug
	overrides?: Partial<NumberField>
}): NumberField => {
	const {collection, overrides} = props
	const config = {
		name: "authority",
		type: "number",
		max: 1000,
		min: 0,
		step: 1,
		index: true,
		defaultValue: 0,
		admin: authorityFieldAdmin({
			collection,
			overrides: {
				...(overrides?.admin || {}),
				description: "Limit access to users of this role or higher",
				hidden: true,
			},
		}),
		access: authorityFieldAccess({
			collection,
			overrides: overrides?.access || {},
		}),
		...overrides,
	}
	return config as NumberField
}
