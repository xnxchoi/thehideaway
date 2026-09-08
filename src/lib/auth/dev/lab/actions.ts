"use server";

/**
 * @dev-only — On-demand fixtures for public auth branches that cannot be
 * exercised locally without a provider, mailbox, authenticator, or token.
 * Guarded by NODE_ENV + DEV_BUTLER_PASSWORD. Delete this folder to remove.
 */

import { generateId } from "@better-auth/core/utils/id";
import { createOTP } from "@better-auth/utils/otp";
import {
  generateRandomString,
  symmetricDecrypt,
  symmetricEncrypt
} from "better-auth/crypto";
import { sql } from "@payloadcms/db-postgres/drizzle";
import { headers } from "next/headers";
import { generateVerifyEmailUrl } from "@/lib/auth/payload-auth/better-auth/plugin/helpers/generate-verify-email-url";
import { getPayload } from "@/lib/payload";
import type { AuthLabAction } from "./cases";
import {
  BUTLER_DEV_EMAIL,
  DARIA_DEV_EMAIL,
  LAB_2FA_EMAIL,
  LAB_ORG_SLUG,
  ensureLabUser,
  ensureSocialLabUser,
  ensureTwoFactorLabUser,
  findUserByEmail,
  labPassword
} from "./fixtures";
import { assertDevAuthLab } from "./guard";
import type { AuthLabResult } from "./result";

function secretKey() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set.");
  return secret;
}

function fillCreds(email: string, extra?: Record<string, string>) {
  return { email, password: labPassword(), ...extra };
}

async function signInAs(email: string) {
  const payload = await getPayload();
  const password = labPassword();
  return payload.betterAuth.api.signInEmail({
    body: { email, password },
    headers: await headers()
  });
}

async function mintResetFor(email: string): Promise<AuthLabResult> {
  const payload = await getPayload();
  const user = await findUserByEmail(payload, email);
  if (!user) {
    return { ok: false, error: `No user for ${email}. Start the dev server so fixtures seed.` };
  }
  const token = generateId(24);
  await payload.create({
    collection: "verifications",
    overrideAccess: true,
    data: {
      identifier: `reset-password:${token}`,
      value: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }
  });
  return {
    ok: true,
    href: `/reset-password?token=${token}`,
    assign: true,
    fill: { email: user.email },
    secret: token,
    note: "Paste a new password on the reset form. Forgot-password still sends mail; this is the token that email would have contained."
  };
}

async function upsertTotpSecret(userId: string) {
  const payload = await getPayload();
  const secret = generateRandomString(32, "a-z", "A-Z", "0-9");
  const encryptedSecret = await symmetricEncrypt({
    key: secretKey(),
    data: secret
  });
  const encryptedBackup = await symmetricEncrypt({
    key: secretKey(),
    data: JSON.stringify(["lab-backup-1", "lab-backup-2"])
  });
  const existing = await payload
    .find({
      collection: "twoFactors",
      where: { user: { equals: userId } },
      overrideAccess: true,
      limit: 1,
      pagination: false
    })
    .then(({ docs }) => docs[0] ?? null);

  if (existing?.id) {
    await payload.update({
      collection: "twoFactors",
      id: existing.id,
      overrideAccess: true,
      data: {
        secret: encryptedSecret,
        backupCodes: encryptedBackup,
        verified: true,
        failedVerificationCount: 0,
        lockedUntil: null
      }
    });
  } else {
    await payload.create({
      collection: "twoFactors",
      overrideAccess: true,
      data: {
        user: userId,
        secret: encryptedSecret,
        backupCodes: encryptedBackup,
        verified: true,
        failedVerificationCount: 0
      }
    });
  }

  await payload.update({
    collection: "users",
    id: userId,
    overrideAccess: true,
    data: { twoFactorEnabled: true }
  });

  return secret;
}

async function currentTotpFor(userId: string): Promise<string> {
  const payload = await getPayload();
  const row = await payload
    .find({
      collection: "twoFactors",
      where: { user: { equals: userId } },
      overrideAccess: true,
      limit: 1,
      pagination: false
    })
    .then(({ docs }) => docs[0] ?? null);
  if (!row?.secret) {
    throw new Error("No TOTP secret. Run 2FA TOTP first.");
  }
  const plaintext = await symmetricDecrypt({
    key: secretKey(),
    data: row.secret
  });
  return createOTP(plaintext, { digits: 6, period: 30 }).totp();
}

const handlers: Record<
  AuthLabAction,
  () => Promise<AuthLabResult>
> = {
  async signInButler() {
    await signInAs(BUTLER_DEV_EMAIL);
    return {
      ok: true,
      href: "/me/settings/profile",
      assign: true,
      fill: fillCreds(BUTLER_DEV_EMAIL, { username: "butler" }),
      note: "Session issued as butler. Sign out and paste these creds to exercise the form."
    };
  },
  async signInDaria() {
    await signInAs(DARIA_DEV_EMAIL);
    return {
      ok: true,
      href: "/me",
      assign: true,
      fill: fillCreds(DARIA_DEV_EMAIL, { username: "daria-reader" }),
      note: "Session issued as daria-reader. The sign-in form accepts this username too."
    };
  },
  async mintUnverifiedUser() {
    const payload = await getPayload();
    const stamp = generateId(8);
    const username = `lab-unverified-${stamp}`;
    const user = await ensureLabUser(payload, {
      username,
      email: `${username}@hideaway.dev`,
      name: "Lab Unverified",
      firstName: "Lab",
      lastName: "Unverified",
      emailVerified: false
    });
    return {
      ok: true,
      href: "/sign-in",
      assign: true,
      fill: fillCreds(user.email, { username: user.username }),
      note: "Paste these into sign-in. requireEmailVerification should reject until you run Email verification."
    };
  },
  async skipConsent() {
    return {
      ok: true,
      href: "/sign-up",
      assign: true,
      note: "Client writes the consent cookie, then opens sign-up."
    };
  },
  async mintSignupCredentials() {
    const stamp = generateId(8);
    const username = `lab-signup-${stamp}`;
    const email = `${username}@hideaway.dev`;
    return {
      ok: true,
      href: "/sign-up",
      assign: true,
      fill: fillCreds(email, {
        username,
        name: "Lab Signup"
      }),
      note: "User is not created yet. Paste into the sign-up form. Then run Email verification."
    };
  },
  async mintVerificationUrl() {
    const payload = await getPayload();
    const stamp = generateId(8);
    const username = `lab-verify-${stamp}`;
    const user = await ensureLabUser(payload, {
      username,
      email: `${username}@hideaway.dev`,
      name: "Lab Verify",
      firstName: "Lab",
      lastName: "Verify",
      emailVerified: false
    });
    const base =
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000";
    const href = await generateVerifyEmailUrl({
      userEmail: user.email.toLowerCase(),
      secret: secretKey(),
      verifyRouteUrl: `${base}/api/auth/verify-email`,
      callbackURL: "/me"
    });
    return {
      ok: true,
      href,
      assign: true,
      fill: fillCreds(user.email, { username: user.username }),
      note: "Opens Better Auth verify-email with a minted JWT. After it lands, the user can sign in."
    };
  },
  async mintResetUrl() {
    return mintResetFor(BUTLER_DEV_EMAIL);
  },
  async openInvalidReset() {
    return {
      ok: true,
      href: "/reset-password?token=lab-invalid",
      assign: true,
      note: "Submit any new password. The token is not in verifications."
    };
  },
  async simulateGoogle() {
    const payload = await getPayload();
    const user = await ensureSocialLabUser(payload, "google");
    await signInAs(user.email);
    return {
      ok: true,
      href: "/me/settings/security",
      assign: true,
      fill: fillCreds(user.email, { username: user.username }),
      note: "Skips Google. Session + google account row so you can inspect post-login / linked-provider state. The real button still leaves localhost."
    };
  },
  async simulateNaver() {
    const payload = await getPayload();
    const user = await ensureSocialLabUser(payload, "naver");
    await signInAs(user.email);
    return {
      ok: true,
      href: "/me/settings/security",
      assign: true,
      fill: fillCreds(user.email, { username: user.username }),
      note: "Skips Naver. Session + naver account row. The real button still leaves localhost."
    };
  },
  async simulateKakao() {
    const payload = await getPayload();
    const user = await ensureSocialLabUser(payload, "kakao");
    await signInAs(user.email);
    return {
      ok: true,
      href: "/me/settings/security",
      assign: true,
      fill: fillCreds(user.email, { username: user.username }),
      note: "Skips Kakao. Session + kakao account row. The real button still leaves localhost."
    };
  },
  async simulatePasskey() {
    await signInAs(BUTLER_DEV_EMAIL);
    return {
      ok: true,
      href: "/me/settings/security",
      assign: true,
      fill: fillCreds(BUTLER_DEV_EMAIL, { username: "butler" }),
      note: "WebAuthn cannot be forged. Enroll a real passkey here, sign out, then use Sign in with Passkey on /sign-in."
    };
  },
  async startTotp() {
    const payload = await getPayload();
    const user = await ensureTwoFactorLabUser(payload);
    const secret = await upsertTotpSecret(user.id);
    const code = await createOTP(secret, { digits: 6, period: 30 }).totp();
    try {
      await signInAs(LAB_2FA_EMAIL);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/two.?factor/i.test(message)) throw error;
    }
    return {
      ok: true,
      href: "/two-factor",
      assign: true,
      fill: fillCreds(LAB_2FA_EMAIL, { username: "lab-2fa" }),
      secret: code,
      note: "Pending 2FA cookie is set. Paste the code into TOTP. Refresh with Current TOTP if it expires."
    };
  },
  async startEmailOtp() {
    const payload = await getPayload();
    const user = await ensureTwoFactorLabUser(payload);
    await upsertTotpSecret(user.id);
    try {
      await signInAs(LAB_2FA_EMAIL);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/two.?factor/i.test(message)) throw error;
    }
    return {
      ok: true,
      href: "/two-factor/otp",
      assign: true,
      fill: fillCreds(LAB_2FA_EMAIL, { username: "lab-2fa" }),
      note: "Pending 2FA cookie is set. Click Send on the page, then Reveal last email OTP."
    };
  },
  async currentTotp() {
    const payload = await getPayload();
    const user = await findUserByEmail(payload, LAB_2FA_EMAIL);
    if (!user) {
      return { ok: false, error: "Run 2FA TOTP first." };
    }
    const code = await currentTotpFor(user.id);
    return {
      ok: true,
      href: "/two-factor",
      secret: code,
      note: "Current authenticator code for lab-2fa. Valid for this 30s window."
    };
  },
  async revealLastOtp() {
    const payload = await getPayload();
    const found = await payload.find({
      collection: "verifications",
      sort: "-createdAt",
      limit: 30,
      overrideAccess: true,
      pagination: false
    });
    const row = found.docs.find((doc) =>
      String(doc.identifier ?? "").startsWith("2fa-otp-")
    );
    if (!row?.value) {
      return {
        ok: false,
        error: "No 2FA email OTP stored. Open 2FA email OTP, then click Send on the page."
      };
    }
    const code = String(row.value).split(":")[0] ?? "";
    return {
      ok: true,
      href: "/two-factor/otp",
      secret: code,
      note: "Last stored 2FA email OTP (plain). Paste it into the form."
    };
  },
  async mintInvitation() {
    const payload = await getPayload();
    const butler = await findUserByEmail(payload, BUTLER_DEV_EMAIL);
    const daria = await findUserByEmail(payload, DARIA_DEV_EMAIL);
    if (!butler || !daria) {
      return {
        ok: false,
        error: "Butler or Daria missing. Start the dev server so fixtures seed."
      };
    }

    await payload.db.drizzle.execute(sql`
      INSERT INTO organizations (name, slug, created_at, updated_at)
      SELECT ${"Lab Org"}, ${LAB_ORG_SLUG}, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM organizations WHERE slug = ${LAB_ORG_SLUG}
      )
    `);
    const org = await payload
      .find({
        collection: "organizations",
        where: { slug: { equals: LAB_ORG_SLUG } },
        overrideAccess: true,
        limit: 1,
        pagination: false
      })
      .then(({ docs }) => docs[0] ?? null);
    if (!org?.id) {
      return { ok: false, error: "Could not create lab organization." };
    }

    await payload.db.drizzle.execute(sql`
      INSERT INTO members (organization_id, user_id, role, created_at, updated_at)
      SELECT ${org.id}::uuid, ${butler.id}::uuid, ${"owner"}, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM members
        WHERE organization_id = ${org.id}::uuid AND user_id = ${butler.id}::uuid
      )
    `);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await payload.db.drizzle.execute(sql`
      INSERT INTO invitations (
        organization_id, email, role, status, expires_at, inviter_id,
        created_at, updated_at
      )
      VALUES (
        ${org.id}::uuid,
        ${daria.email},
        ${"member"},
        ${"pending"},
        ${expiresAt}::timestamptz,
        ${butler.id}::uuid,
        now(),
        now()
      )
    `);
    const invitation = await payload
      .find({
        collection: "invitations",
        where: {
          and: [
            { organization: { equals: org.id } },
            { email: { equals: daria.email } },
            { status: { equals: "pending" } }
          ]
        },
        overrideAccess: true,
        sort: "-createdAt",
        limit: 1,
        pagination: false
      })
      .then(({ docs }) => docs[0] ?? null);
    if (!invitation?.id) {
      return { ok: false, error: "Could not create lab invitation." };
    }

    await signInAs(daria.email);
    return {
      ok: true,
      href: `/accept-invitation/${invitation.id}`,
      assign: true,
      fill: fillCreds(daria.email, { username: daria.username }),
      note: "Signed in as Daria with a pending invite to Lab Org."
    };
  },
  async openInvalidInvitation() {
    return {
      ok: true,
      href: "/accept-invitation/00000000-0000-0000-0000-000000000000",
      assign: true,
      note: "Opens the invitation error state."
    };
  }
};

export async function runAuthLabAction(
  action: AuthLabAction
): Promise<AuthLabResult> {
  assertDevAuthLab();
  const handler = handlers[action];
  if (!handler) {
    return { ok: false, error: `Unknown auth lab action: ${String(action)}` };
  }
  try {
    return await handler();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Auth lab action failed."
    };
  }
}
