import { Admin, User } from "@payload-types";
import type { Access, FieldAccess, PayloadRequest } from "payload";

export type AdminRolesConfig = {
  adminRoles?: string[];
};

export type AdminOrCurrentUserConfig = AdminRolesConfig & {
  idField?: string;
};

export type AdminOrCurrentUserUpdateConfig = AdminOrCurrentUserConfig & {
  allowedFields?: string[];
  userSlug: string;
};

const isBannedPayloadUser = (user: PayloadRequest["user"]) =>
  Boolean(
    user &&
      typeof user === "object" &&
      "banned" in user &&
      user.banned === true
  );

export const isAdminWithRoles =
  (config: AdminRolesConfig = {}): FieldAccess =>
  ({ req }) => {
    const { adminRoles = ["admin"] } = config;
    if (isBannedPayloadUser(req?.user)) return false;
    if (!req?.user || !req.user.role || !hasAdminRoles(adminRoles)({ req }))
      return false;
    return true;
  };

export const isAdminOrCurrentUserWithRoles =
  (config: AdminOrCurrentUserConfig = {}): Access =>
  ({ req }) => {
    const { adminRoles = ["admin"], idField = "id" } = config;
    if (isBannedPayloadUser(req?.user)) return false;
    if (isAdminWithRoles({ adminRoles })({ req })) return true;
    if (!req?.user) return false;
    return {
      [idField]: {
        equals: req?.user?.id
      }
    };
  };

export const hasAdminRoles = (adminRoles: string[]) => {
  return ({ req }: { req: PayloadRequest }): boolean => {
    if (isBannedPayloadUser(req.user)) return false;
    let userRoles: string[] = [];
    if (Array.isArray(req.user?.role)) {
      userRoles = req.user.role;
    } else if (typeof req.user?.role === "string") {
      if (req.user.role.includes(",")) {
        userRoles = req.user.role
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean);
      } else if (req.user.role) {
        userRoles = [req.user.role];
      }
    }
    if (!userRoles) return false;
    return userRoles.some((role) => adminRoles.includes(role));
  };
};

export const isAdminOrCurrentUserUpdateWithAllowedFields = (
  config: AdminOrCurrentUserUpdateConfig
): Access => {
  return async ({ req, id, data }) => {
    const {
      adminRoles = ["admin"],
      allowedFields = [],
      userSlug,
      idField = "id"
    } = config;
    const user = req.user;

    if (isBannedPayloadUser(user)) return false;

    if (isAdminWithRoles({ adminRoles })({ req })) return true;

    if (!user) return false;

    if ((user as User | Admin)["id"] === id && data) {
      const dataKeys = Object.keys(data);
      const permittedFields = new Set(allowedFields);

      const hasCurrentPassword = dataKeys.includes("currentPassword");
      const hasPassword = dataKeys.includes("password");

      if (hasPassword || hasCurrentPassword) {
        if (!(hasCurrentPassword && hasPassword)) return false;
        try {
          if (!user.email) return false;

          const result = await req.payload.login({
            collection: userSlug as "users" | "admins",
            data: {
              email: user.email,
              password: data.currentPassword
            }
          });

          if (!result) return false;

        permittedFields.add("password");
        permittedFields.add("currentPassword");
        } catch (error) {
          return false;
        }
      }

      const hasDisallowedField = dataKeys.some(
        (key) => !permittedFields.has(key)
      );

      return !hasDisallowedField;
    }

    return false;
  };
};
