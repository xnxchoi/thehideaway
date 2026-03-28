import { roleToAuthority } from "@/payload/plugins/locker/fields/authority/utils";
import type { RP_Roles } from "@/stores/Notification/NotificationStore";
import type { Config, User } from "@payload-types";
import { capitalize } from "lodash-es";
import { FieldAdmin } from "node_modules/payload/dist/fields/config/types";
import {
  ACCallback,
  AccessControlledFieldTypes,
  AccessControlPath,
  ACProps,
  ACResolvedSchema,
  FieldConfigMap,
  WithAC
} from "./types";

export function withAC<
  T extends AccessControlledFieldTypes,
  F extends FieldConfigMap[T]
>({
  type,
  admin,
  access,
  ...fieldProps
}: F & {
  type: T;
}) {
  let fieldAdmin: FieldAdmin = {};
  if (!!admin) {
    const { hidden, readOnly, condition, components, ...fieldAdminBase } =
      admin;
    fieldAdmin = {
      ...fieldAdminBase
    };
  }
  if (!!access) {
    const { read, create, update } = access;
  }
}
export const ACField = <
  T extends AccessControlledFieldTypes,
  F extends ACProps<T>
>(
  type: T,
  props?: F
): WithAC<T> => {
  const allowAuthor = props?.allowAuthor || false;
  const finalizedSchema: ACResolvedSchema<T> = {
    admin: true,
    editor: "readonly",
    author: "readonly",
    patron: false,
    user: false
  };
  const path = getACFieldPath(type);
  let allowedRoles: RP_Roles[] = ["admin"];
  if (props?.allowedRoles) {
    allowedRoles.push(...props.allowedRoles);
  } else {
    allowedRoles.push("editor");
  }

  allowedRoles = [...new Set([...allowedRoles])];
  allowedRoles.forEach((role) => (finalizedSchema[role] = true));
  if (allowAuthor) {
    const test: ACCallback<T> = ({
      user: u,
      id,
      data,
      req,
      collectionSlug,
      operation
    }) => {
      if (!u) return false;
      if (roleToAuthority("author") < roleToAuthority(u.role)) return true;
      const user = u as unknown as Omit<User, "role">;
      switch (operation) {
        case "create":
          return true;
        case "update":
          if (!data) return false;
          if (!("author" in data)) {
            if (collectionSlug === "user") {
              return u.id === id;
            }
            return false;
          }
          const autD =
            (
              data as Extract<
                Config["collections"][keyof Config["collections"]],
                {
                  author: User | string;
                }
              >
            )?.author || false;

          return typeof autD === "boolean"
            ? autD
            : (typeof autD === "string" ? autD : autD.id) === user.id;
      }
      return false;
    };
  }
  const conditionTester = props?.conditionTester;
  const field = {
    path,
    serverProps: {
      accessControlled: finalizedSchema
    }
  };
  return {
    ...(props?.overrides || {}),
    Field: field
  };
};

const getACFieldPath = <T extends AccessControlledFieldTypes>(
  type: T
): AccessControlPath<T> => {
  const base = "@/AccessControlled/";
  const capitalized = (capitalize(type.substring(0, 1)) +
    type.substring(1)) as Capitalize<T>;
  return `${base}${capitalized}`;
};
