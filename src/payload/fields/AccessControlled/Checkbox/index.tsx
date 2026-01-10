import {AccessControlSchema} from "@/AccessControlled/types";
import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {CheckboxField} from "@payloadcms/ui";
import type {CheckboxFieldServerProps, ClientUser, CollectionSlug, Field} from "payload";

export type ConditionalFieldProp<T extends Field["type"]> = {
	allowedRoles?: RP_Roles[];
	allowAuthor?: boolean;
	conditionTester?: (data: {
		user?:
			| (ClientUser & {
			collection: "users" | "admins";
			role: RP_Roles | string;
		})
			| null;
		collection?: CollectionSlug;
		field?: Extract<Field, { type: T }>;
	}) => boolean;
};
const AccessControlledCheckboxField = (
	props: CheckboxFieldServerProps & AccessControlSchema<"checkbox">
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
			<CheckboxField
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
export default AccessControlledCheckboxField;
