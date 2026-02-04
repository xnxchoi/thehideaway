import {AccessControlSchema} from "@/AccessControlled/types";
import {GroupField as GroupFieldComponent} from "@payloadcms/ui";
import type {
	ClientUser,
	CollectionSlug,
	GroupField,
	GroupFieldServerComponent,
	GroupFieldServerProps
} from "payload";
import type {ConditionalFieldProp} from "../Checkbox";

const AccessControlledGroupField = (
	props: GroupFieldServerProps & AccessControlSchema<"group">
) => {
	const {

		accessControlled,
		...fieldProps
	} = props;
	const {
		user,
		payload,
		id,
		schemaPath,
		permissions,
		clientField,
		readOnly: readPm,
		collectionSlug,
		path,
		data,
		field,
	} = fieldProps
	const role = user.role;
	const clearf = accessControlled[role]
	const visibility = (typeof clearf === "function" ? clearf({...fieldProps}) : clearf)
	const clear = visibility === true || visibility === "readonly";
	const readOnly = visibility === "readonly" || !!readPm

	if (clear) {
		return (
			<GroupFieldComponent readOnly={readOnly}
			                     field={clientField}
			                     path={path}
			                     schemaPath={schemaPath}
			                     permissions={permissions}
			/>
		);
	}
	return <></>;
};
export default AccessControlledGroupField;
