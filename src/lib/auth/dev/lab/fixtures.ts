/**
 * @dev-only — On-demand lab users. Not seeded at boot. Not captured by SEED_CAPTURE.
 */

import { hashPassword } from "better-auth/crypto";
import { sql } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";
import { BUTLER_DEV_EMAIL, BUTLER_DEV_USERNAME } from "@/lib/auth/dev/seedButler";
import { READER_FIXTURES } from "@/lib/auth/dev/seedReaders";

export const LAB_2FA_USERNAME = "lab-2fa";
export const LAB_2FA_EMAIL = "lab-2fa@hideaway.dev";
export const LAB_ORG_SLUG = "lab-org";

export type LabSocialProvider = "google" | "naver" | "kakao";

export function labPassword() {
  return process.env.DEV_READER_PASSWORD ?? process.env.DEV_BUTLER_PASSWORD ?? "";
}

export type LabUser = {
  id: string;
  email: string;
  username: string;
};

async function upsertCredentialAccount(
  payload: Payload,
  userId: string,
  hashed: string
) {
  await payload.db.drizzle.execute(sql`
    INSERT INTO accounts (account_id, provider_id, user_id, password)
    SELECT ${userId}, 'credential', ${userId}::uuid, ${hashed}
    WHERE NOT EXISTS (
      SELECT 1 FROM accounts
      WHERE user_id = ${userId}::uuid AND provider_id = 'credential'
    )
  `);
  await payload.db.drizzle.execute(sql`
    UPDATE accounts
    SET password = ${hashed}, updated_at = now()
    WHERE user_id = ${userId}::uuid AND provider_id = 'credential'
  `);
}

export async function ensureLabUser(
  payload: Payload,
  input: {
    username: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
  }
): Promise<LabUser> {
  const password = labPassword();
  if (!password) {
    throw new Error("DEV_BUTLER_PASSWORD is not set.");
  }

  const email = input.email.toLowerCase();
  const username = input.username.toLowerCase();

  const existing = await payload
    .find({
      collection: "users",
      where: { username: { equals: username } },
      overrideAccess: true,
      limit: 1,
      pagination: false,
      select: { id: true, email: true, username: true }
    })
    .then(({ docs }) => docs[0] ?? null);

  let userId: string;
  if (existing?.id) {
    userId = existing.id;
    await payload.update({
      collection: "users",
      id: userId,
      overrideAccess: true,
      data: {
        email,
        normalizedEmail: email,
        emailVerified: input.emailVerified ?? true,
        twoFactorEnabled: input.twoFactorEnabled ?? false
      }
    });
  } else {
    const created = await payload.create({
      collection: "users",
      overrideAccess: true,
      draft: false,
      data: {
        name: input.name,
        role: "user",
        slug: username,
        email,
        normalizedEmail: email,
        username,
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerified: input.emailVerified ?? true,
        verified: input.emailVerified ?? true,
        onboarded: true,
        banned: false,
        twoFactorEnabled: input.twoFactorEnabled ?? false
      }
    });
    userId = created.id;
  }

  const hashed = await hashPassword(password);
  await upsertCredentialAccount(payload, userId, hashed);

  return { id: userId, email, username };
}

export async function findUserByEmail(
  payload: Payload,
  email: string
): Promise<LabUser | null> {
  const existing = await payload
    .find({
      collection: "users",
      where: { email: { equals: email } },
      overrideAccess: true,
      limit: 1,
      pagination: false,
      select: { id: true, email: true, username: true }
    })
    .then(({ docs }) => docs[0] ?? null);
  if (!existing?.id) return null;
  return {
    id: existing.id,
    email: existing.email ?? email,
    username: existing.username ?? ""
  };
}

export async function ensureSocialLabUser(
  payload: Payload,
  provider: LabSocialProvider
): Promise<LabUser> {
  const username = `lab-${provider}`;
  const user = await ensureLabUser(payload, {
    username,
    email: `${username}@hideaway.dev`,
    name: `Lab ${provider}`,
    firstName: "Lab",
    lastName: provider
  });
  await payload.db.drizzle.execute(sql`
    INSERT INTO accounts (account_id, provider_id, user_id)
    SELECT ${`${provider}:${user.id}`}, ${provider}, ${user.id}::uuid
    WHERE NOT EXISTS (
      SELECT 1 FROM accounts
      WHERE user_id = ${user.id}::uuid AND provider_id = ${provider}
    )
  `);
  return user;
}

export async function ensureTwoFactorLabUser(payload: Payload): Promise<LabUser> {
  return ensureLabUser(payload, {
    username: LAB_2FA_USERNAME,
    email: LAB_2FA_EMAIL,
    name: "Lab Two Factor",
    firstName: "Lab",
    lastName: "TwoFactor",
    twoFactorEnabled: true
  });
}

export { BUTLER_DEV_EMAIL, BUTLER_DEV_USERNAME };

export const DARIA_DEV_EMAIL = READER_FIXTURES[0]?.email ?? "daria@hideaway.dev";
export const DARIA_DEV_USERNAME =
  READER_FIXTURES[0]?.username ?? "daria-reader";
