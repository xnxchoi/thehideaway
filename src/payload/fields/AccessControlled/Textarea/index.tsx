import { TextareaField } from "@payloadcms/ui";
import type {
  TextareaFieldServerComponent,
  TextareaFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AdminOnlyTextareaField: TextareaFieldServerComponent = (
  props: TextareaFieldServerProps & ConditionalFieldProp
) => {
  const {
    user,
    schemaPath,
    permissions,
    clientField,
    path,
    data,
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
export default AdminOnlyTextareaField;
