import {CheckboxField, CollectionSlug} from "payload";
import {lockboxFieldAdmin} from "./admin";
import {lockboxFieldAccess} from "./access";

export const lockBoxField = (props: {
	collection: CollectionSlug;
	overrides?: Partial<CheckboxField>;
}): CheckboxField => {
	const {collection, overrides = {}} = props;
	const config: Partial<CheckboxField> = {
		name: "locked",
		type: "checkbox",
		defaultValue: false,
		label: "Locked",
		admin: lockboxFieldAdmin({collection, overrides: overrides?.admin || {}}),
		access: lockboxFieldAccess({
			collection,
			overrides: overrides?.access || {},
		}),
		...props.overrides,
	};
	return config as CheckboxField;
};
