"use server";

import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sql } from "@payloadcms/db-postgres/drizzle";

import { getPayload } from "src/lib/payload";
import { formatUserHandle } from "src/payload/fields/handle/formatUserHandle";

const InputSchema = z.object({
  email: z.string().trim().email(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128)
});

type ActionResult =
  | { ok: true; email: string }
  | { ok: false; reason: "existing-account-login-required" | "failed" };

function buildUsername(email: string): string {
  const local = email.split("@")[0] ?? "";
  const base = formatUserHandle(local) || "guest";
  const suffix = nanoid(6).toLowerCase();
  return `${base}-${suffix}`;
}

export async function prepareDayNNightPurchaserAction(
  raw: z.input<typeof InputSchema>
): Promise<ActionResult> {
  const input = InputSchema.parse(raw);
  const payload = await getPayload();
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const existing = await payload
    .find({
      collection: "users",
      overrideAccess: true,
      pagination: false,
      limit: 1,
      where: { email: { equals: input.email } }
    })
    .then(({ docs }) => docs[0] ?? null);

  if (existing?.id) {
    return { ok: false, reason: "existing-account-login-required" };
  }

  const username = buildUsername(input.email);
  const created = await payload.create({
    collection: "users",
    overrideAccess: true,
    draft: false,
    data: {
      email: input.email,
      emailVerified: true,
      verified: true,
      name: fullName,
      firstName: input.firstName,
      lastName: input.lastName,
      username,
      slug: formatUserHandle(username),
      role: "user",
      onboarded: false,
      banned: false,
      twoFactorEnabled: false
    }
  });
  const targetUserId = String(created.id);

  const hashed = await hashPassword(input.password);

  await payload.db.drizzle.execute(sql`
    INSERT INTO accounts (account_id, provider_id, user_id, password)
    SELECT ${targetUserId}, 'credential', ${targetUserId}::uuid, ${hashed}
    WHERE NOT EXISTS (
      SELECT 1
      FROM accounts
      WHERE user_id = ${targetUserId}::uuid
        AND provider_id = 'credential'
    )
  `);

  return { ok: true, email: input.email };
}
