import {AccessControlSchema} from "@/AccessControlled/types";
import { DateTimeField } from "@payloadcms/ui";
import type { DateFieldServerComponent, DateFieldServerProps } from "payload";
import type { ConditionalFieldProp } from "../Checkbox";
import type {DateField as DateFieldConfig} from "payload";
import type {ClientUser, CollectionSlug} from "payload";

const AccessControlledDateField = (
	props: DateFieldServerProps & AccessControlSchema<"date">
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
	    <DateTimeField readOnly={readOnly}
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AccessControlledDateField;
