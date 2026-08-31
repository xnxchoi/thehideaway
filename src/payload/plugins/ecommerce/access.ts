import type { Access, FieldAccess } from "payload";

import {
  authenticated,
  isAdmin
} from "@/payload/plugins/locker/access/accessCheckers";

export const isEcommerceAdmin: Access = (args) => isAdmin(args);

export const adminOnlyFieldAccess: FieldAccess = (args) => isAdmin(args);

export const isAuthenticated: Access = (args) => authenticated(args);

export const isCustomer: FieldAccess = ({ req: { user } }) =>
  Boolean(user && user.role !== "admin");

export const isDocumentOwner: Access = ({ req: { user } }) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return {
    customer: {
      equals: user.id
    }
  };
};

export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user?.role === "admin") return true;
  return {
    _status: {
      equals: "published"
    }
  };
};
