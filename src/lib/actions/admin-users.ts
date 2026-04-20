"use server";

import { getPayload } from "@/lib/payload";
import { headers as requestHeaders } from "next/headers";
import { z } from "zod";

// Admin gate — throws when the caller is not an admin. All actions below must
// start with this, since BetterAuth's admin API trusts the caller implicitly.
async function assertAdmin() {
  const payload = await getPayload();
  const headers = await requestHeaders();
  const session = await payload.betterAuth.api.getSession({ headers });
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    throw new Error("Forbidden");
  }
  return { payload, headers };
}

// ── Input schemas ──────────────────────────────────────────────────────────

const listUsersInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().min(0).default(0),
    sortBy: z.string().default("createdAt"),
    sortDirection: z.enum(["asc", "desc"]).default("desc"),
    searchField: z.enum(["email", "name", "username"]).optional(),
    searchValue: z.string().optional()
  })
  .default({});

const createUserInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["admin", "user"]).default("user")
});

const userIdInput = z.object({ userId: z.string().min(1) });

const banUserInput = z.object({
  userId: z.string().min(1),
  banReason: z.string().max(500).optional(),
  banExpiresIn: z.number().int().positive().optional()
});

// ── Actions ────────────────────────────────────────────────────────────────

export async function listUsersAction(raw?: z.input<typeof listUsersInput>) {
  const input = listUsersInput.parse(raw ?? {});
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.listUsers({
    query: input,
    headers
  });
}

export async function createUserAction(raw: z.input<typeof createUserInput>) {
  const input = createUserInput.parse(raw);
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.createUser({
    body: input,
    headers
  });
}

export async function removeUserAction(raw: z.input<typeof userIdInput>) {
  const input = userIdInput.parse(raw);
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.removeUser({
    body: { userId: input.userId },
    headers
  });
}

export async function revokeUserSessionsAction(
  raw: z.input<typeof userIdInput>
) {
  const input = userIdInput.parse(raw);
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.revokeUserSessions({
    body: { userId: input.userId },
    headers
  });
}

export async function impersonateUserAction(raw: z.input<typeof userIdInput>) {
  const input = userIdInput.parse(raw);
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.impersonateUser({
    body: { userId: input.userId },
    headers
  });
}

export async function banUserAction(raw: z.input<typeof banUserInput>) {
  const input = banUserInput.parse(raw);
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.banUser({
    body: input,
    headers
  });
}

export async function unbanUserAction(raw: z.input<typeof userIdInput>) {
  const input = userIdInput.parse(raw);
  const { payload, headers } = await assertAdmin();
  return payload.betterAuth.api.unbanUser({
    body: { userId: input.userId },
    headers
  });
}
