import { RadioGroupField } from "@payloadcms/ui";
import type { RadioFieldServerComponent, RadioFieldServerProps } from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const AdminOnlyRadioField: RadioFieldServerComponent = (
  props: RadioFieldServerProps & ConditionalFieldProp
) => {
  const {
    user,
    payload,
    id,
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
  if (clear)
    return (
      <RadioGroupField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  return <></>;
};
export default AdminOnlyRadioField;
