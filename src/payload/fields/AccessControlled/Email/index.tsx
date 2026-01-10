import {AccessControlSchema} from "@/AccessControlled/types";
import { EmailField } from "@payloadcms/ui";
import type { EmailFieldServerComponent, EmailFieldServerProps } from "payload";
import type { ConditionalFieldProp } from "../Checkbox";
import type {EmailField as EmailFieldConfig} from "payload";
import type {ClientUser, CollectionSlug} from "payload";

const AccessControlledEmailField = (
	props: EmailFieldServerProps & AccessControlSchema<"email">
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
	    <EmailField readOnly={readOnly}
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AccessControlledEmailField;
