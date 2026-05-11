/**
 * Cleanup ALL dev fixture users (Butler + Readers) and the content they
 * authored. Heavier-weight than `cleanupButlerPosts` — also drops the
 * user rows, their credential accounts, profiles, owned media, and
 * orphan version-table rows for posts.
 *
 * Usage:
 *   pnpm cleanup:dev-fixtures              # dev only
 *   FORCE_PROD=1 pnpm cleanup:dev-fixtures # explicit prod escape hatch
 *
 * Designed as the manual remediation tool the `warnIfFixtureUsersInProd`
 * sanity check points at: if dev fixture users are ever detected in a
 * prod database (a misconfigured env, a restored dev dump, etc.) ops
 * can run this with FORCE_PROD=1 to remove them.
 *
 * Idempotent — running it twice deletes 0 rows the second time.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { sql } from "@payloadcms/db-postgres/drizzle";
import { BUTLER_DEV_USERNAME } from "@/lib/auth/dev/seedButler";
import { READER_FIXTURE_USERNAMES } from "@/lib/auth/dev/seedReaders";

const FIXTURE_USERNAMES = [BUTLER_DEV_USERNAME, ...READER_FIXTURE_USERNAMES];

async function shutdownDb(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<void> {
  try {
    const db = payload.db as { destroy?: () => Promise<void> };
    if (typeof db.destroy === "function") {
      await db.destroy();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[cleanup:dev-fixtures] db shutdown warning: ${message}`);
  }
}

async function main(): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  const forceProd = process.env.FORCE_PROD === "1";

  if (isProd && !forceProd) {
    console.error(
      "[cleanup:dev-fixtures] Refusing to run with NODE_ENV=production. " +
        "If you actually need to delete dev fixtures from a prod DB " +
        "(restored dev dump? misconfigured env?), re-run with FORCE_PROD=1."
    );
    process.exit(1);
  }
  if (isProd && forceProd) {
    console.warn(
      "[cleanup:dev-fixtures] FORCE_PROD=1 set. Proceeding against production. " +
        `Targeting fixture usernames: ${FIXTURE_USERNAMES.join(", ")}.`
    );
  }

  const payload = await getPayload({ config });

  try {
    console.log("[cleanup:dev-fixtures] starting…");

    // 1) Resolve fixture user IDs.
    const found = await payload.find({
      collection: "users",
      where: { username: { in: FIXTURE_USERNAMES } },
      overrideAccess: true,
      limit: FIXTURE_USERNAMES.length,
      pagination: false,
      depth: 0
    });
    const fixtureIds = found.docs
      .map((d) => (d as { id?: string }).id)
      .filter((id): id is string => typeof id === "string");

    if (fixtureIds.length === 0) {
      console.log(
        "[cleanup:dev-fixtures] no fixture users found. nothing to do."
      );
      return;
    }

    console.log(
      `[cleanup:dev-fixtures] resolved ${fixtureIds.length} fixture user${fixtureIds.length === 1 ? "" : "s"}: ${found.docs.map((d) => (d as { username?: string }).username).join(", ")}.`
    );

    // 2) Delete content authored by fixtures across collections that have
    //    an `author_id` column. Each delete is parameterized; ordering
    //    matters only where FKs would cascade — we go widest-first.
    const ops: Array<{ label: string; query: ReturnType<typeof sql> }> = [
      {
        label: "posts",
        query: sql`DELETE FROM posts WHERE author_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        // SECURITY: the `parent_id IS NULL` arm is scoped to fixture
        // authors. Otherwise running this script with FORCE_PROD=1 could
        // wipe version history for legitimate authors whose parent post
        // was previously deleted (manual admin delete, migration
        // rollback, etc.). Belt-and-suspenders: even though this script
        // refuses to run in production without FORCE_PROD=1, that escape
        // hatch makes the over-broad query a real data-loss vector.
        label: "_posts_v (orphan + fixture-authored)",
        query: sql`DELETE FROM _posts_v WHERE version_author_id = ANY(${fixtureIds}::uuid[]) OR (parent_id IS NULL AND version_author_id = ANY(${fixtureIds}::uuid[])) RETURNING id`
      },
      {
        label: "profile",
        query: sql`DELETE FROM profile WHERE author_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "user_media",
        query: sql`DELETE FROM user_media WHERE author_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "bookmarks",
        query: sql`DELETE FROM bookmarks WHERE user_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "follows (as follower or target)",
        query: sql`DELETE FROM follows WHERE user_id = ANY(${fixtureIds}::uuid[]) OR target_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "notifications (recipient)",
        query: sql`DELETE FROM notifications WHERE recipient_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "citations (author)",
        query: sql`DELETE FROM citations WHERE author_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "responses (comment author)",
        query: sql`DELETE FROM responses WHERE author_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      },
      {
        label: "user_views",
        query: sql`DELETE FROM user_views WHERE user_id = ANY(${fixtureIds}::uuid[]) RETURNING id`
      }
    ];

    for (const op of ops) {
      try {
        const res = await payload.db.drizzle.execute(op.query);
        const count = Array.isArray(res) ? res.length : 0;
        console.log(
          `[cleanup:dev-fixtures] ${op.label}: deleted ${count} row${count === 1 ? "" : "s"}.`
        );
      } catch (err: unknown) {
        // A missing table (e.g., responses if comments collection slug
        // differs in some env) shouldn't abort the whole cleanup.
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[cleanup:dev-fixtures] ${op.label}: skipped (${msg.slice(0, 120)})`
        );
      }
    }

    // 3) Drop the credential accounts (Better Auth's `accounts` table).
    //    Done before users so the FK doesn't fire as we delete users.
    await payload.db.drizzle.execute(sql`
      DELETE FROM accounts WHERE user_id = ANY(${fixtureIds}::uuid[])
    `);
    console.log(`[cleanup:dev-fixtures] accounts: deleted for fixture users.`);

    // 4) Finally, the user rows themselves.
    const deletedUsers = await payload.db.drizzle.execute(sql`
      DELETE FROM users WHERE id = ANY(${fixtureIds}::uuid[]) RETURNING id
    `);
    const usersDeleted = Array.isArray(deletedUsers) ? deletedUsers.length : 0;
    console.log(
      `[cleanup:dev-fixtures] users: deleted ${usersDeleted} row${usersDeleted === 1 ? "" : "s"}.`
    );

    console.log("[cleanup:dev-fixtures] done.");
  } finally {
    await shutdownDb(payload);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[cleanup:dev-fixtures] fatal:", err);
  process.exit(1);
});
