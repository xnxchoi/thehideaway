import type { FieldAccess } from "payload";

export const canUpdateUserRoleField: FieldAccess = ({ req }) => {
  if (req.context.overrideAccess === true) return true;
  const user = req.user;
  if (!user || ("banned" in user && user.banned === true)) return false;
  return ["admin", "cofounder", "editor"].includes(user.role ?? "");
};
