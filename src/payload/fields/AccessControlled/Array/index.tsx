import {AccessControlSchema} from "@/AccessControlled/types";
import {ArrayField} from "@payloadcms/ui";
import type {ArrayFieldServerProps} from "payload";

const AccessControlledArrayField = (
	props: ArrayFieldServerProps & AccessControlSchema<"array">
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
			<ArrayField
				readOnly={readOnly}
				field={clientField}
				path={path}
				schemaPath={schemaPath}
				permissions={permissions}
			/>
		);
	}
	return <></>;
};
export default AccessControlledArrayField;
