import { NumberField } from "@payloadcms/ui";
import type {
	CollectionSlug,
	ClientUser,
	NumberField as NumberFieldConfig,
  NumberFieldServerComponent,
  NumberFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AccessControlledNumberField: NumberFieldServerComponent = (
	props: NumberFieldServerProps & ConditionalFieldProp<"number">
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
			field?: NumberFieldConfig;
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
      <NumberField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AccessControlledNumberField;
