import { TextFieldServerProps } from "payload";
import { User } from "@/payload-types";
import { HandleComponent } from "@/payload/fields/handle/HandleComponent";
import { getServerSideURL } from "@/utilities/getURL";

type ServerHandleProps = TextFieldServerProps;
export default function ServerHandle(props: ServerHandleProps) {
  const {
    value: v,
    user,
    clientField,
    data: d,
    path,
    readOnly: r,
    permissions,
    operation,
    ...rest
  } = props;
  const value = v as User["slug"] | null | undefined;
  const per = {
    read: false,
    update: false,
    create: false
  };
  const data = d as Partial<User> | undefined;
  let readOnly = r || !user || !data || (!value && !data.slug);
  const serverURL = getServerSideURL();
  console.log("permissions: ", permissions, "");
  switch (typeof permissions) {
    case "boolean":
      per.read = permissions;
      per.update = permissions;
      per.create = permissions;
      break;
    case "object":
      per.read = permissions.read;
      per.update = permissions.update;
      per.create = permissions.create;
      break;
    default:
      break;
  }
  if (!per.read) return <></>;
  if (!data?.id) return <></>;
  if (!per.update) readOnly = true;

  return (
    <HandleComponent
      fieldToUse={"username"}
      userId={data.id}
      editorId={user.id}
      operation={operation}
      serverURL={serverURL}
      path={path}
      startValue={value}
      field={{ ...clientField }}
      readOnly={readOnly}
    />
  );
}
