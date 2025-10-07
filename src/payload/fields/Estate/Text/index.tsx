import { ClientTextField } from "./client";
import type { TextFieldServerComponent, TextFieldServerProps } from "payload";
import type { ConditionalFieldProp } from "../Checkbox";

const RestoredTextField: TextFieldServerComponent = (
  props: TextFieldServerProps & ConditionalFieldProp
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
  if (clear) {
    return (
      <ClientTextField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default RestoredTextField;
