import {CollectionSlug, DefaultValue, SingleRelationshipField} from "payload";
import {allowListFieldAdmin} from "@/payload/plugins/locker/fields/allowlist/admin";
import {allowListFieldAccess} from "./access";

const defaultValue: DefaultValue = ({user}) => {
	if (!user) return [];
	return [user.id];
};
export const allowListField = (props: {
	collection: CollectionSlug;
	overrides?: Partial<SingleRelationshipField>;
}): SingleRelationshipField => {
	const {collection, overrides} = props;
	const config = {
		name: "allowList",
		type: "relationship",
		relationTo: "users",
		maxDepth: 0,
		hasMany: true,
		index: true,
		defaultValue: defaultValue,
		admin: allowListFieldAdmin({
			collection,
			overrides: overrides?.admin || {},
		}),
		access: allowListFieldAccess({
			collection,
			overrides: overrides?.access || {},
		}),
		...overrides,
	};
	return config as SingleRelationshipField;
};
