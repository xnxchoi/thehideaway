import { NumberField } from "@payloadcms/ui";
import type {
  NumberFieldServerComponent,
  NumberFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AdminOnlyNumberField: NumberFieldServerComponent = (
  props: NumberFieldServerProps & ConditionalFieldProp
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
export default AdminOnlyNumberField;
