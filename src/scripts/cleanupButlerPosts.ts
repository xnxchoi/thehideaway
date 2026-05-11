/**
 * Cleanup Butler's seeded posts — inverse of `seedButlerPosts.ts`.
 *
 * Hard-deletes every post authored by Butler AND removes the orphan
 * version rows in `_posts_v`.
 *
 * Why the manual `_posts_v` cleanup: the auto-generated FK
 * `_posts_v.parent_id → posts.id` is `ON DELETE SET NULL`, not CASCADE.
 * Payload chose this so version history survives parent deletion in
 * production (audit / recovery). For dev re-seeds, those orphans pile
 * up and become unaddressable (parent_id is NULL, the version_author_id
 * is also nullable). Re-introducing CASCADE via migration would fight
 * Payload's schema generator on the next `pnpm micreate`. Cleaner to
 * cascade by hand here.
 *
 * Usage:
 *   pnpm cleanup:butler-posts
 *
 * Dev only — refuses to run when NODE_ENV === 'production'.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { sql } from "@payloadcms/db-postgres/drizzle";

const BUTLER_USERNAME = "butler";

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
    console.warn(`[cleanup:butler-posts] db shutdown warning: ${message}`);
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[cleanup:butler-posts] Refusing to run with NODE_ENV=production."
    );
    process.exit(1);
  }

  const payload = await getPayload({ config });

  try {
    console.log("[cleanup:butler-posts] starting…");

    const found = await payload.find({
      collection: "users",
      where: { username: { equals: BUTLER_USERNAME } },
      limit: 1,
      overrideAccess: true,
      depth: 0
    });
    const butler = found.docs[0] as { id: string } | undefined;
    if (!butler?.id) {
      console.error("[cleanup:butler-posts] Butler user not found.");
      await shutdownDb(payload);
      process.exit(1);
    }
    const butlerId = String(butler.id);

    // 1) Delete Butler's posts (leaves orphan _posts_v rows by FK design).
    const deletedPosts = await payload.db.drizzle.execute(sql`
      DELETE FROM posts WHERE author_id = ${butlerId}::uuid
      RETURNING id
    `);
    const postsDeleted = Array.isArray(deletedPosts) ? deletedPosts.length : 0;
    console.log(
      `[cleanup:butler-posts] deleted ${postsDeleted} post${postsDeleted === 1 ? "" : "s"}.`
    );

    // 2) Cascade-by-hand: drop orphan version rows. Two paths:
    //    (a) version_author_id matches butler — direct ownership
    //    (b) parent_id is now NULL AND version_author_id matches butler
    //        — orphans created by step 1, scoped to butler so we never
    //        wipe version history for legitimate authors whose parent post
    //        was deleted for unrelated reasons (manual admin delete, prior
    //        migration rollback, etc.).
    const deletedVersions = await payload.db.drizzle.execute(sql`
      DELETE FROM _posts_v
      WHERE version_author_id = ${butlerId}::uuid
         OR (parent_id IS NULL AND version_author_id = ${butlerId}::uuid)
      RETURNING id
    `);
    const versionsDeleted = Array.isArray(deletedVersions)
      ? deletedVersions.length
      : 0;
    console.log(
      `[cleanup:butler-posts] deleted ${versionsDeleted} version row${versionsDeleted === 1 ? "" : "s"}.`
    );

    // 3) The Butler-owned tags created by the seed are intentionally NOT
    //    cleaned up — they may be linked to other docs and the tag pool
    //    is tiny (4 entries). If you want a full reset, drop them by
    //    hand: DELETE FROM tags WHERE title IN ('Essay','Dispatch',
    //    'Notebook','Letters') — but verify no posts/surf/etc. still
    //    reference them first.

    console.log("[cleanup:butler-posts] done.");
  } finally {
    await shutdownDb(payload);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[cleanup:butler-posts] fatal:", err);
  process.exit(1);
});
