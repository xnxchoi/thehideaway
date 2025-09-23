import { RelationshipField } from "@payloadcms/ui";
import type {
  RelationshipFieldServerComponent,
  RelationshipFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AdminOnlyRelationshipField: RelationshipFieldServerComponent = (
  props: RelationshipFieldServerProps & ConditionalFieldProp
) => {
  const {
    user,
    payload,
    id,
    data,
    schemaPath,
    permissions,
    clientField,
    path,
    allowedRoles = ["admin"],
    allowAuthor = false
  } = props;
  const isAdmin = allowedRoles.some((r) => user?.role === r);
  const isAuthor =
    Boolean(
      "author" in data &&
        data.author &&
        (data.author as string | undefined) === user.id
    ) && allowAuthor;
  const clear = isAdmin || isAuthor;
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
export default AdminOnlyRelationshipField;
