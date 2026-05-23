import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Ensure the Day n Night event row exists with state='open'.
 *
 * Backstory: the seed migration `99999999_000000_initial_seed` was
 * augmented post-hoc to include the events INSERT (commit 2ac44d74).
 * Production DBs that applied the seed migration *before* that commit
 * have it marked complete in `payload_migrations`, so Payload skips
 * re-running it — and the events row never gets inserted.
 *
 * The previous fix (20260522_190000_day_n_night_event_open) only
 * UPDATEs, which is a no-op when no row exists. This migration is an
 * idempotent upsert that works regardless of prior state.
 *
 * Re-runnable: ON CONFLICT DO UPDATE makes both INSERT and UPDATE
 * paths safe to re-apply.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "events" (
      "id", "name", "slug", "description", "date", "end_date",
      "location", "gate_password", "capacity", "max_per_user",
      "ticket_price", "state", "goods_drop_enabled",
      "updated_at", "created_at"
    ) VALUES (
      '019e4fc2-3eaa-7a08-b69c-0a8797b984af',
      'Day n Night',
      'day-n-night',
      'An intimate late-night gathering at The Hideaway.',
      '2026-05-24T18:30:00+09:00',
      '2026-05-25T00:00:00+09:00',
      'Haebangchon · Itaewon',
      'seoul2026',
      30,
      3,
      65000,
      'open',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "state" = 'open';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "events" SET "state" = 'draft' WHERE "slug" = 'day-n-night';
  `);
}
