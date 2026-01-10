import {AccessControlSchema} from "@/AccessControlled/types";
import {TextField} from "@payloadcms/ui";
import type {TextFieldServerProps} from "payload";

const AccessControlledTextField = (
	props: TextFieldServerProps & AccessControlSchema<"text">
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
			<TextField
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
export default AccessControlledTextField;
