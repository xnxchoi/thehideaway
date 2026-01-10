import {AccessControlSchema} from "@/AccessControlled/types";
import { RelationshipField } from "@payloadcms/ui";
import type {RelationshipField as RelationshipFieldConfig} from "payload";
import type {
	ClientUser,
	CollectionSlug,
  RelationshipFieldServerComponent,
  RelationshipFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AccessControlledRelationshipField = (
	props: RelationshipFieldServerProps & AccessControlSchema<"relationship">
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
      <RelationshipField
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
export default AccessControlledRelationshipField;
