import type {
  UploadFieldServerComponent,
  UploadFieldServerProps
} from "payload";
import type { ConditionalFieldProp } from "@/AccessControlled/Checkbox";
import { UploadField } from "@payloadcms/ui";

const AdminOnlyUploadField: UploadFieldServerComponent = (
  props: UploadFieldServerProps & ConditionalFieldProp
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
      <UploadField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  return <></>;
};
