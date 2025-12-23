import { RelationshipField } from "@payloadcms/ui";
import type {RelationshipField as RelationshipFieldConfig} from "payload";
import type {
	ClientUser,
	CollectionSlug,
  RelationshipFieldServerComponent,
  RelationshipFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AccessControlledRelationshipField: RelationshipFieldServerComponent = (
	props: RelationshipFieldServerProps & ConditionalFieldProp<"relationship">
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
			field?: RelationshipFieldConfig;
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
      <RelationshipField
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
