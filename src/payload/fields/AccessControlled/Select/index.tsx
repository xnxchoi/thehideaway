import {AccessControlSchema} from "@/AccessControlled/types";
import {SelectField} from "@payloadcms/ui"
import type {
	ClientUser,
	CollectionSlug,
	SelectField as SelectFieldConfig,
  SelectFieldServerComponent,
  SelectFieldServerProps
} from "payload"
import type {ConditionalFieldProp} from "../Checkbox"

const AccessControlledSelectField = (
	props: SelectFieldServerProps & AccessControlSchema<"select">
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
      <SelectField
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
export default AccessControlledSelectField;
