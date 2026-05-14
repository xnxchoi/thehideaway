/**
 * @dev-only — Butler is the development bypass user.
 *
 * Creates a dedicated admin user "butler" with a known password sourced from
 * `DEV_BUTLER_PASSWORD`, used by the dev-only "Sign in as Butler" button on
 * the sign-in page. Skipped entirely in production, and skipped silently in
 * dev when the env var is missing — so production deployments cannot
 * accidentally seed a known-credential user.
 *
 * NEVER set DEV_BUTLER_PASSWORD in production environments.
 */

// Use Better Auth's scrypt-based hash (default), not Payload's pbkdf2.
// `disableDefaultPayloadAuth: true` is set in lib/auth/options.ts, so Better
// Auth ignores Payload's password helpers — meaning any seed using pbkdf2
// would fail "Invalid password" on sign-in. Match Better Auth's hash format.
import { hashPassword } from "better-auth/crypto";
import { sql } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";

const BUTLER_USERNAME = "butler";
const BUTLER_EMAIL = "butler@hideaway.dev";
const BUTLER_SLUG = "butler";

interface SeededButler {
  id: string;
  email: string;
  username: string;
}

/**
 * Idempotent. Safe to call on every dev startup. Returns the butler user's
 * id+email when seeded, or null when skipped (production / no env var).
 */
export async function seedButler(
  payload: Payload
): Promise<SeededButler | null> {
  payload.logger.info(
    `[dev-butler] seed called — NODE_ENV=${process.env.NODE_ENV}, DEV_BUTLER_PASSWORD set=${Boolean(process.env.DEV_BUTLER_PASSWORD)}`
  );
  if (process.env.NODE_ENV === "production") {
    payload.logger.info("[dev-butler] production — skipping.");
    return null;
  }
  // SEED_CAPTURE=1 means we're inside `pnpm seed:rebuild`. The
  // generator captures every INSERT and bakes them into the production
  // seed migration; butler is dev-only and must not ship to prod.
  if (process.env.SEED_CAPTURE === "1") {
    payload.logger.info(
      "[dev-butler] SEED_CAPTURE=1 — skipping (dev fixture, not for migration)."
    );
    return null;
  }
  const password = process.env.DEV_BUTLER_PASSWORD;
  if (!password) {
    payload.logger.info(
      "[dev-butler] DEV_BUTLER_PASSWORD not set — skipping butler seed."
    );
    return null;
  }
  if (password.length < 8) {
    payload.logger.warn(
      "[dev-butler] DEV_BUTLER_PASSWORD is too short (<8 chars). Skipping seed."
    );
    return null;
  }

  // Find or create the butler user.
  payload.logger.info("[dev-butler] step 1: looking up user");
  const existing = await payload
    .find({
      collection: "users",
      where: { username: { equals: BUTLER_USERNAME } },
      overrideAccess: true,
      limit: 1,
      pagination: false,
      select: { id: true, email: true, username: true }
    })
    .then(({ docs }) => docs[0] ?? null);
  payload.logger.info(
    `[dev-butler] step 1 done: existing=${existing ? existing.id : "none"}`
  );

  let userId: string;
  if (existing?.id) {
    userId = existing.id;
    // Idempotent name normalization. The Users beforeChange hook rewrites
    // `name` to `${firstName} ${lastName}` on update, so we must coordinate
    // both fields to land on the desired display string.
    await payload.db.drizzle.execute(sql`
      UPDATE users
      SET name = 'Butler', first_name = 'Butler', last_name = ''
      WHERE id = ${userId}::uuid
    `);
  } else {
    payload.logger.info("[dev-butler] step 2: creating user");
    const created = await payload.create({
      collection: "users",
      overrideAccess: true,
      draft: false,
      data: {
        // firstName + lastName are concatenated into displayName fallbacks
        // elsewhere; keep firstName as the actual first name so the avatar
        // initial reads "B" and the public-preview shows "Butler".
        name: "Butler",
        role: "admin",
        slug: BUTLER_SLUG,
        email: BUTLER_EMAIL,
        username: BUTLER_USERNAME,
        firstName: "Butler",
        lastName: "",
        emailVerified: true,
        verified: true,
        onboarded: true,
        banned: false,
        twoFactorEnabled: false
      }
    });
    userId = created.id;
    payload.logger.info(`[dev-butler] step 2 done: created user=${userId}`);
  }

  // Hash and upsert the credential account directly via SQL.
  // Better Auth manages the `accounts` collection — going through Payload's
  // create/update triggers plugin hooks that fight the seed flow. Raw SQL
  // is the simpler, more reliable path for dev seeding.
  payload.logger.info("[dev-butler] step 3: hashing password");
  const hashed = await hashPassword(password);
  payload.logger.info(
    "[dev-butler] step 4: upserting credential account via SQL"
  );
  // `accounts` has no unique index on (user_id, provider_id), so a naive
  // INSERT with ON CONFLICT DO NOTHING doesn't actually dedup against
  // racing inserts. Guard the insert with NOT EXISTS so concurrent
  // seed-time calls (or repeated dev-server restarts in flight) can't
  // accumulate duplicate credential rows.
  await payload.db.drizzle.execute(sql`
    INSERT INTO accounts (account_id, provider_id, user_id, password)
    SELECT ${userId}, 'credential', ${userId}::uuid, ${hashed}
    WHERE NOT EXISTS (
      SELECT 1 FROM accounts
      WHERE user_id = ${userId}::uuid AND provider_id = 'credential'
    )
  `);
  // Always rotate the password to whatever DEV_BUTLER_PASSWORD is now.
  await payload.db.drizzle.execute(sql`
    UPDATE accounts
    SET password = ${hashed}, updated_at = now()
    WHERE user_id = ${userId}::uuid AND provider_id = 'credential'
  `);
  payload.logger.info("[dev-butler] step 4 done");

  payload.logger.info(
    `[dev-butler] Butler ready (${BUTLER_EMAIL}). Sign-in shortcut available at /sign-in.`
  );

  return { id: userId, email: BUTLER_EMAIL, username: BUTLER_USERNAME };
}

export const BUTLER_DEV_EMAIL = BUTLER_EMAIL;
export const BUTLER_DEV_USERNAME = BUTLER_USERNAME;
