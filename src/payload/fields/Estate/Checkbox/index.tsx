import { CheckboxField } from "@payloadcms/ui";
import type {
  CheckboxFieldServerComponent,
  CheckboxFieldServerProps
} from "payload";
import { RP_Roles } from "@/stores/Notification/NotificationStore";

export type ConditionalFieldProp = {
  allowedRoles?: RP_Roles[];
  allowAuthor?: boolean;
};
const RestoredCheckboxField: CheckboxFieldServerComponent = (
  props: CheckboxFieldServerProps & ConditionalFieldProp
) => {
  const {
    user,
    payload,
    id,
    schemaPath,
    data,
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
  if (clear)
    return (
      <CheckboxField
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  return <></>;
};
export default RestoredCheckboxField;
