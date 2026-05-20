import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Profile.rsvp.tier — three-tier ordering for the Day n Night guest list.
 *
 *   host  → cofounders / event hosts (appear first in the rolling credits)
 *   past  → previously-attended guests (appear second)
 *   guest → first-timers / default for everyone else
 *
 * Stored as a free-text varchar rather than a Postgres enum so the
 * eventual Payload-native regen doesn't fight a hand-rolled enum type.
 * Application-side validation enforces the three values; DB allows any
 * non-null string. Default value is "guest" (set on existing rows in
 * up()).
 *
 * Follows readmes/MIGRATIONS.md: every CREATE / ALTER is guarded; down()
 * mirrors the safeguard pattern. Mirrors Payload's flatten-group naming
 * (`rsvp_tier` on the live table, `version_rsvp_tier` on `_profile_v`).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- profile (live)
    ALTER TABLE "profile"
      ADD COLUMN IF NOT EXISTS "rsvp_tier" varchar DEFAULT 'guest';

    UPDATE "profile" SET "rsvp_tier" = 'guest' WHERE "rsvp_tier" IS NULL;

    CREATE INDEX IF NOT EXISTS "profile_rsvp_tier_idx"
      ON "profile" ("rsvp_tier");

    -- _profile_v (versions)
    ALTER TABLE "_profile_v"
      ADD COLUMN IF NOT EXISTS "version_rsvp_tier" varchar DEFAULT 'guest';

    CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_tier_idx"
      ON "_profile_v" ("version_rsvp_tier");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_profile_v_version_rsvp_tier_idx";
    ALTER TABLE "_profile_v" DROP COLUMN IF EXISTS "version_rsvp_tier";

    DROP INDEX IF EXISTS "profile_rsvp_tier_idx";
    ALTER TABLE "profile" DROP COLUMN IF EXISTS "rsvp_tier";
  `);
}
