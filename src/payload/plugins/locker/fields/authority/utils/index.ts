import { RP_Roles } from "@/stores/Notification/NotificationStore";

export type Role = RP_Roles | "guest";


export const roleToAuthority = (role: Role): number => {
  switch (role) {
    case "guest":
      return 0;
    case "user":
      return 1;
    case "resident":
      return 2;
    case "patron":
      return 3;
    case "author":
      return 4;
    case "editor":
      return 5;
    case "cofounder":
      return 6;
    case "admin":
      return 1000;
    default:
      return 0;
  }
};

export const authorityToRole = (authority: number): Role => {
  switch (authority) {
    case 1:
      return "user";
    case 2:
      return "resident";
    case 3:
      return "patron";
    case 4:
      return "author";
    case 5:
      return "editor";
    case 6:
      return "cofounder";
    case 1000:
      return "admin";
    default:
      return "guest";
  }
};

export const rolesToAuthority = (roles: Role[]): number => {
  return roles.reduce((acc, role) => {
    return Math.max(acc, roleToAuthority(role));
  }, 0);
};

export const PAID_ROLES: Role[] = ["resident", "patron", "cofounder"];
export const STAFF_ROLES: Role[] = ["editor", "cofounder", "admin"];
export const isPaidRole = (role: Role | null | undefined): boolean =>
  !!role && PAID_ROLES.includes(role);
export const isStaffRole = (role: Role | null | undefined): boolean =>
  !!role && STAFF_ROLES.includes(role);
