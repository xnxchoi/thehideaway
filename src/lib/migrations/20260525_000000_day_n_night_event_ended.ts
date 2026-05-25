import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Archive Day n Night after the event has finished.
 *
 * In the Events collection, `state='ended'` is the post-event archive state:
 * new purchases are blocked while attendee-only exclusive content remains live.
 *
 * Re-runnable: UPDATE is idempotent when the event is already ended/open.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events"
    SET "state" = 'ended', "updated_at" = NOW()
    WHERE "slug" = 'day-n-night';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events"
    SET "state" = 'open', "updated_at" = NOW()
    WHERE "slug" = 'day-n-night';
  `);
}
