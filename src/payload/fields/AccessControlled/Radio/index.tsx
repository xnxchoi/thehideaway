import {AccessControlSchema} from "@/AccessControlled/types";
import {RadioGroupField} from "@payloadcms/ui";
import type {RadioFieldServerProps} from "payload";

const AccessControlledRadioField = (
	props: RadioFieldServerProps & AccessControlSchema<"radio">
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
			<RadioGroupField
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
export default AccessControlledRadioField;
