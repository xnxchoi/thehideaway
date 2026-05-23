"use server";

import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sql } from "@payloadcms/db-postgres/drizzle";

import { getPayload } from "@/lib/payload";
import { formatUserHandle } from "@/payload/fields/handle/formatUserHandle";

const InputSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120)
});

type ActionResult =
  | { ok: true }
  | { ok: false; reason: "existing-account-login-required" | "failed" };

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "Guest",
    lastName: parts.slice(1).join(" ")
  };
}

function buildUsername(email: string): string {
  const local = email.split("@")[0] ?? "";
  const base = formatUserHandle(local) || "guest";
  const suffix = nanoid(6).toLowerCase();
  return `${base}-${suffix}`;
}

function getRowArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return ((result as { rows?: T[] } | null)?.rows ?? []) as T[];
}

export async function prepareDayNNightPurchaserAction(
  raw: z.input<typeof InputSchema>
): Promise<ActionResult> {
  const input = InputSchema.parse(raw);
  const payload = await getPayload();

  const existing = await payload
    .find({
      collection: "users",
      overrideAccess: true,
      pagination: false,
      limit: 1,
      where: { email: { equals: input.email } }
    })
    .then(({ docs }) => docs[0] ?? null);

  const { firstName, lastName } = splitName(input.name);
  let userId: string;

  if (existing?.id) {
    userId = String(existing.id);

    await payload.update({
      collection: "users",
      id: userId,
      overrideAccess: true,
      data: {
        emailVerified: true,
        verified: true,
        ...(existing.firstName ? {} : { firstName }),
        ...(existing.lastName ? {} : { lastName }),
        ...(existing.name ? {} : { name: input.name })
      }
    });
  } else {
    const username = buildUsername(input.email);
    const created = await payload.create({
      collection: "users",
      overrideAccess: true,
      draft: false,
      data: {
        email: input.email,
        emailVerified: true,
        verified: true,
        name: input.name,
        firstName,
        lastName,
        username,
        slug: formatUserHandle(username),
        role: "user",
        onboarded: false,
        banned: false,
        twoFactorEnabled: false
      }
    });
    userId = String(created.id);
  }

  const credentialRows = getRowArray<{ exists: boolean }>(
    await payload.db.drizzle.execute(sql`
      SELECT EXISTS(
        SELECT 1
        FROM accounts
        WHERE user_id = ${userId}::uuid
          AND provider_id = 'credential'
      ) AS exists
    `)
  );

  if (credentialRows[0]?.exists) {
    return { ok: false, reason: "existing-account-login-required" };
  }

  const password = `${nanoid(20)}${nanoid(20)}`;
  const hashed = await hashPassword(password);

  await payload.db.drizzle.execute(sql`
    INSERT INTO accounts (account_id, provider_id, user_id, password)
    SELECT ${userId}, 'credential', ${userId}::uuid, ${hashed}
    WHERE NOT EXISTS (
      SELECT 1
      FROM accounts
      WHERE user_id = ${userId}::uuid
        AND provider_id = 'credential'
    )
  `);

  try {
    await payload.betterAuth.api.signInEmail({
      body: {
        email: input.email,
        password
      }
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
