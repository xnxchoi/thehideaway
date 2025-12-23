import { EmailField } from "@payloadcms/ui";
import type { EmailFieldServerComponent, EmailFieldServerProps } from "payload";
import type { ConditionalFieldProp } from "../Checkbox";
import type {EmailField as EmailFieldConfig} from "payload";
import type {ClientUser, CollectionSlug} from "payload";

const AccessControlledEmailField: EmailFieldServerComponent = (
	props: EmailFieldServerProps & ConditionalFieldProp<"email">
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
			field?: EmailFieldConfig;
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
      <EmailField
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
