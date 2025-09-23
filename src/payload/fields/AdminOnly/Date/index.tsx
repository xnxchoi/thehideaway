import { DateTimeField } from "@payloadcms/ui";
import type { DateFieldServerComponent, DateFieldServerProps } from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AdminOnlyDateField: DateFieldServerComponent = (
  props: DateFieldServerProps & ConditionalFieldProp
) => {
  const {
    user,
    payload,
    id,
    schemaPath,
    permissions,
    clientField,
    path,
    allowedRoles = ["admin"],
    allowAuthor = false,
    data
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
      <DateTimeField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AdminOnlyDateField;
