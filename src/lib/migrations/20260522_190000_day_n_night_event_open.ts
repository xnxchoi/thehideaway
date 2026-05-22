import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Ensure the Day n Night event has state = 'open'.
 *
 * The initial seed migration uses ON CONFLICT DO NOTHING, so if the event
 * was created via the admin UI in draft state the seed INSERT skips it.
 * This migration patches it regardless of how the row got there.
 *
 * Re-runnable: UPDATE is idempotent — applying to an already-open event
 * is a safe no-op.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events"
    SET "state" = 'open'
    WHERE "slug" = 'day-n-night';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events"
    SET "state" = 'draft'
    WHERE "slug" = 'day-n-night';
  `);
}
