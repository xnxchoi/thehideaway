import {AccessControlSchema} from "@/AccessControlled/types";
import {UploadField} from "@payloadcms/ui";
import type {UploadFieldServerProps} from "payload";

const AccessControlledUploadField = (
	props: UploadFieldServerProps & AccessControlSchema<"upload">
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
			<UploadField
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
export default AccessControlledUploadField;
