import {AccessControlSchema} from "@/AccessControlled/types";
import { JSONField } from "@payloadcms/ui";
import type {
	ClientUser,
	CollectionSlug,
	JSONField as JSONFieldConfig,
	JSONFieldServerComponent,
	JSONFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";
import type {RP_Roles} from "@/stores/Notification/NotificationStore";

const AccessControlledJSONField = (
	props: JSONFieldServerProps & AccessControlSchema<"json">
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
      <JSONField
	      field={clientField} readOnly={readOnly}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AccessControlledJSONField;
