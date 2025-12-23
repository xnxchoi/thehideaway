import { CheckboxField } from "@payloadcms/ui";
import type {
	BasePayload,
  CheckboxFieldServerComponent,
	CheckboxFieldServerProps,
	ClientUser,
	CollectionSlug,
	Field,
	Payload
} from "payload";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import type {Admin, User} from "@/payload-types";
import type {CheckboxField as CheckboxFieldConfig} from "payload";

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
const AccessControlledCheckboxField: CheckboxFieldServerComponent = (
	props: CheckboxFieldServerProps & ConditionalFieldProp<"checkbox">
) => {
  const {
    user,
    payload,
    id,
    schemaPath,
    permissions,
    clientField,
	  collectionSlug,
    path,
	  data,
	  field,
    allowedRoles = ["admin"],
	  allowAuthor = false,
	  conditionTester: cT
  } = props;
	const conditionTester = cT
		? cT
		: ({
			   user
		   }: {
			user: ClientUser | null;
			field?: CheckboxFieldConfig;
			collection?: CollectionSlug;
		}) => {
			if (!user) return false;
			const isAdmin = allowedRoles.some((r) => user.role === (r as string));
			if (isAdmin) return true;
			let isCl = false;
			if (allowAuthor) {
				if ("author" in data) {
					if (Array.isArray(data.author)) {
						const auth = data.author as (
							| string
							| { relationTo: "admins" | "users"; value: string }
							)[];
						if (
							auth.some((u) => {
								return (typeof u === "string" ? u : u.value) === user.id;
							})
						) {
							isCl = true;
						}
					} else {
						isCl = isCl || data.author === user.id;
					}
				}
			}
			return isCl;
		};
	const clear = conditionTester({
		user,
		field,
		collection: collectionSlug as CollectionSlug
	});

	if (clear) {
    return (
      <CheckboxField
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
