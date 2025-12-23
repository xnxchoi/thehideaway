import { TextareaField } from "@payloadcms/ui";
import type {
	ClientUser,
	CollectionSlug,
	TextareaField as TextareaFieldConfig,
  TextareaFieldServerComponent,
  TextareaFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AccessControlledTextareaField: TextareaFieldServerComponent = (
	props: TextareaFieldServerProps & ConditionalFieldProp<"textarea">
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
			field?: TextareaFieldConfig;
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
      <TextareaField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AccessControlledTextareaField;
