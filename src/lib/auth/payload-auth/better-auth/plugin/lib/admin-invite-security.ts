import { createHash } from "node:crypto";
import type { Where } from "better-auth";

export const ADMIN_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export const normalizeAdminInviteEmail = (email: string) =>
  email.trim().toLowerCase();

export const hashAdminInviteToken = (token: string) =>
  createHash("sha256").update(token, "utf8").digest("hex");

export const buildAdminInviteWhere = ({
  email,
  now = new Date(),
  token
}: {
  email?: string;
  now?: Date;
  token: string;
}): Where[] => [
  {
    field: "token",
    value: hashAdminInviteToken(token),
    operator: "eq"
  },
  {
    field: "expiresAt",
    value: now,
    operator: "gt"
  },
  ...(email
    ? [
        {
          field: "email",
          value: normalizeAdminInviteEmail(email),
          operator: "eq" as const
        }
      ]
    : [])
];
