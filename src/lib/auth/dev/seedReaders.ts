/**
 * @dev-only — Reader fixtures.
 *
 * Creates a fixed set of role=`user` accounts (Daria, Miles) for testing
 * multi-user interactions: Follows, Comments on Butler's posts, Bookmarks,
 * Citations on shared content, etc. Shares the same hashing path as
 * `seedButler` (Better Auth's scrypt) so the dev sign-in button can pick
 * any of them.
 *
 * Safeguards:
 *   - Refuses to run when NODE_ENV === "production". Nothing is touched.
 *   - Refuses to run when DEV_READER_PASSWORD is unset or <8 chars.
 *   - Idempotent: matches by username, normalizes display name on every
 *     dev startup, and rotates the password on every run.
 *
 * NEVER set DEV_READER_PASSWORD in production environments. Pair this
 * fixture with the prod sanity-check (logs an error if any of these
 * usernames are found in a prod DB at boot) for defence in depth.
 */

import { hashPassword } from "better-auth/crypto";
import { sql } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";

interface ReaderFixture {
  username: string;
  email: string;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
}

/**
 * Stable list of reader personas. Adding/removing entries here is the
 * canonical way to extend or contract the dev fixture pool.
 *
 * Naming convention: `*-reader` username suffix makes these instantly
 * identifiable as dev fixtures (matters for the prod sanity check).
 */
export const READER_FIXTURES: ReaderFixture[] = [
  {
    username: "daria-reader",
    email: "daria@hideaway.dev",
    slug: "daria-reader",
    name: "Daria Morgendorffer",
    firstName: "Daria",
    lastName: "Morgendorffer"
  },
  {
    username: "miles-reader",
    email: "miles@hideaway.dev",
    slug: "miles-reader",
    name: "Miles Bennell",
    firstName: "Miles",
    lastName: "Bennell"
  }
];

/** Usernames the prod sanity check looks for. */
export const READER_FIXTURE_USERNAMES: ReadonlyArray<string> =
  READER_FIXTURES.map((r) => r.username);

interface SeededReader {
  id: string;
  email: string;
  username: string;
}

interface SeedReadersResult {
  /** null when skipped (prod / no password / bad password). */
  readers: SeededReader[] | null;
}

/**
 * Idempotent. Safe to call on every dev startup. Returns the seeded
 * readers' ids+emails when seeded, or `{ readers: null }` when skipped.
 */
export async function seedReaders(
  payload: Payload
): Promise<SeedReadersResult> {
  payload.logger.info(
    `[dev-readers] seed called — NODE_ENV=${process.env.NODE_ENV}, DEV_READER_PASSWORD set=${Boolean(process.env.DEV_READER_PASSWORD)}`
  );
  if (process.env.NODE_ENV === "production") {
    payload.logger.info("[dev-readers] production — skipping.");
    return { readers: null };
  }
  // SEED_CAPTURE=1 means we're inside `pnpm seed:rebuild`. The
  // generator captures every INSERT and bakes them into the production
  // seed migration; reader fixtures are dev-only and must not ship to prod.
  if (process.env.SEED_CAPTURE === "1") {
    payload.logger.info(
      "[dev-readers] SEED_CAPTURE=1 — skipping (dev fixture, not for migration)."
    );
    return { readers: null };
  }
  // Falls back to DEV_BUTLER_PASSWORD so a single dev secret enables every
  // fixture. Keep them independent in `.env.local` if you want different
  // passwords per role.
  const password =
    process.env.DEV_READER_PASSWORD ?? process.env.DEV_BUTLER_PASSWORD;
  if (!password) {
    payload.logger.info(
      "[dev-readers] DEV_READER_PASSWORD (or fallback DEV_BUTLER_PASSWORD) not set — skipping reader seed."
    );
    return { readers: null };
  }
  if (password.length < 8) {
    payload.logger.warn(
      "[dev-readers] dev reader password is too short (<8 chars). Skipping seed."
    );
    return { readers: null };
  }

  // Hash once — every fixture shares the same dev password (matching the
  // Butler pattern). Better Auth's scrypt-based hash; see `seedButler.ts`
  // header for why we don't use Payload's pbkdf2.
  const hashed = await hashPassword(password);

  const seeded: SeededReader[] = [];

  for (const fixture of READER_FIXTURES) {
    const existing = await payload
      .find({
        collection: "users",
        where: { username: { equals: fixture.username } },
        overrideAccess: true,
        limit: 1,
        pagination: false,
        select: { id: true, email: true, username: true }
      })
      .then(({ docs }) => docs[0] ?? null);

    let userId: string;
    if (existing?.id) {
      userId = existing.id;
      // Idempotent name normalization — Users beforeChange rewrites
      // `name` to "first last" on update, so we coordinate all three.
      await payload.db.drizzle.execute(sql`
        UPDATE users
        SET name = ${fixture.name},
            first_name = ${fixture.firstName},
            last_name = ${fixture.lastName}
        WHERE id = ${userId}::uuid
      `);
    } else {
      const created = await payload.create({
        collection: "users",
        overrideAccess: true,
        draft: false,
        data: {
          name: fixture.name,
          role: "user",
          slug: fixture.slug,
          email: fixture.email,
          username: fixture.username,
          firstName: fixture.firstName,
          lastName: fixture.lastName,
          emailVerified: true,
          verified: true,
          onboarded: true,
          banned: false,
          twoFactorEnabled: false
        }
      });
      userId = created.id;
      payload.logger.info(
        `[dev-readers] created ${fixture.username} (id=${userId}).`
      );
    }

    // Upsert the credential account via raw SQL (same rationale as
    // seedButler — Better Auth manages this table directly). `accounts`
    // has no unique index on (user_id, provider_id), so a naive INSERT
    // with ON CONFLICT DO NOTHING doesn't actually dedup. Use a guarded
    // INSERT instead so concurrent boot-time seeds (e.g. payload.config
    // onInit firing alongside a manual one-off run) don't duplicate.
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

    seeded.push({
      id: userId,
      email: fixture.email,
      username: fixture.username
    });
  }

  payload.logger.info(
    `[dev-readers] ready: ${seeded.map((r) => r.username).join(", ")}.`
  );

  return { readers: seeded };
}

/**
 * Defence-in-depth sanity check. Logs (does NOT delete) if any reader
 * fixtures are present in the DB while running in production. Run from
 * onInit so ops sees the signal on every prod boot.
 *
 * Why we don't auto-delete: a real user could legitimately register a
 * username that collides — we don't want a CI/runtime to nuke real data.
 * The log line is the alert; cleanup is a manual judgment call.
 */
export async function warnIfFixtureUsersInProd(
  payload: Payload
): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;

  const all = ["butler", ...READER_FIXTURE_USERNAMES];
  const found = await payload.find({
    collection: "users",
    where: { username: { in: all } },
    overrideAccess: true,
    limit: all.length,
    pagination: false,
    select: { id: true, username: true, email: true }
  });

  if (found.docs.length === 0) return;

  payload.logger.error(
    `[prod-sanity] Dev fixture user(s) detected in production database: ${found.docs
      .map((d) => `${d.username}<${d.email ?? "?"}>`)
      .join(", ")}. ` +
      "These should never exist in production. Audit and remove manually."
  );
}

export const READERS_DEV_USERNAMES = READER_FIXTURE_USERNAMES;
