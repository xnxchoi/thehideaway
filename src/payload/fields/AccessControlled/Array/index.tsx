import {
  AccessControlledFieldProps,
  FieldServerPropsMap
} from "@/AccessControlled/Array/types";
import {
  AccessControlledFieldTypes,
  AccessControlSchema,
  ACResolvedAccess
} from "@/AccessControlled/types";
import { ArrayField } from "@payloadcms/ui";
import type { ArrayFieldServerProps } from "payload";
const resolveAccess = <
  T extends AccessControlledFieldTypes = AccessControlledFieldTypes
>(
  type: T,
  props: FieldServerPropsMap[T] & AccessControlSchema<T>
): ACResolvedAccess<T> => {
  const { accessControlled, ...fieldProps } = props;
  const {
    user,
    payload,
    id: idDoc,
    collectionSlug
  } = fieldProps as AccessControlledFieldProps<T>;
  const id = (!!idDoc && `${idDoc}`) || undefined;
  let selff: ACResolvedAccess<T> | boolean = false;
  if ("self" in accessControlled) {
    if (collectionSlug === "users" && id === user.id) {
      const res =
        typeof accessControlled.self === "function"
          ? accessControlled.self({ ...fieldProps, id })
          : accessControlled.self;
      if (res instanceof Promise) {
        res.then((re) => {
          selff = re;
        });
      }
    } else if ("author" in accessControlled) {
    }
  }
};
const AccessControlledArrayField = (
  props: ArrayFieldServerProps & AccessControlSchema<"array">
) => {
  const { accessControlled, ...fieldProps } = props;
  const {
    user,
    payload,
    id: docId,
    schemaPath,
    permissions,
    clientField,
    readOnly: readPm,
    collectionSlug,
    path,
    data,
    siblingData,
    field
  } = fieldProps;
  const id = (!!docId && `${docId}`) || undefined;
  const role = user.role;
  const clearf = accessControlled[role];

  const visibility =
    typeof clearf === "function" ? clearf({ ...fieldProps, id }) : clearf;
  const clear = visibility === true || visibility === "readonly";
  const readOnly = visibility === "readonly" || !!readPm;
  if (clear) {
    return (
      <ArrayField
        readOnly={readOnly}
        field={clientField}
        path={path}
        schemaPath={schemaPath}
        permissions={permissions}
      />
    );
  }
  return <></>;
};
export default AccessControlledArrayField;
