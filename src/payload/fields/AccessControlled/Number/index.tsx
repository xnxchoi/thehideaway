import {AccessControlSchema} from "@/AccessControlled/types";
import {NumberField} from "@payloadcms/ui";
import type {NumberFieldServerProps} from "payload";

const AccessControlledNumberField = (
	props: NumberFieldServerProps & AccessControlSchema<"number">
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
	const clearf = accessControlled?.[role]
	const visibility = (typeof clearf === "function" ? clearf({...fieldProps}) : clearf)
	const clear = visibility === true || visibility === "readonly";
	const readOnly = visibility === "readonly" || !!readPm
	if (clear) {
		return (
			<NumberField
				field={clientField} readOnly={readOnly}
				path={path}
				schemaPath={schemaPath}
				permissions={permissions}
			/>
		);
	}
	return <></>;
};
export default AccessControlledNumberField;
