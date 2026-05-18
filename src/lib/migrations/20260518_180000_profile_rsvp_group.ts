import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Profile.rsvp group — Day n Night guest list backing.
 *
 * Adds a Payload group field `rsvp` on the profile collection (and its
 * versions counterpart `_profile_v`). The group flattens to two scalar
 * columns and a child table for the gallery array — mirroring how
 * Payload's generator already lays out the existing `hero` group +
 * `slides` array on this collection (see profile.hero_title and
 * profile_slides in payload-generated-schema.ts).
 *
 * Shape (matches the actual live DB types — payload-generated-schema.ts is
 * stale on array-table column types; the live DB uses uuid columns where
 * the generated schema mistakenly types them as varchar):
 *
 *   profile.rsvp_intro        text         (≤200 chars, nullable)
 *   profile.rsvp_ig_handle    varchar      (nullable)
 *   profile_rsvp_gallery(
 *     _order        integer  NOT NULL,
 *     _parent_id    uuid     NOT NULL  -> profile(id) ON DELETE CASCADE,
 *     id            uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
 *     media_id      uuid               -> user_media(id) ON DELETE SET NULL
 *   )
 *
 *   _profile_v.version_rsvp_intro / version_rsvp_ig_handle
 *   _profile_v_version_rsvp_gallery(...)  -- id uuid, _uuid varchar, media_id uuid
 *
 * Per readmes/MIGRATIONS.md:
 *   - Every CREATE/ADD COLUMN guarded with IF NOT EXISTS.
 *   - Every constraint add wrapped in DO $$ existence check.
 *   - FKs are explicit so the down() can drop them in safe order.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── profile (live) ──────────────────────────────────────────────────
    ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "rsvp_intro" text;
    ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "rsvp_ig_handle" varchar;

    CREATE TABLE IF NOT EXISTS "profile_rsvp_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "media_id" uuid
    );

    CREATE INDEX IF NOT EXISTS "profile_rsvp_gallery_order_idx"
      ON "profile_rsvp_gallery" ("_order");
    CREATE INDEX IF NOT EXISTS "profile_rsvp_gallery_parent_id_idx"
      ON "profile_rsvp_gallery" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "profile_rsvp_gallery_media_idx"
      ON "profile_rsvp_gallery" ("media_id");

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profile_rsvp_gallery_parent_id_fk'
      ) THEN
        ALTER TABLE "profile_rsvp_gallery"
          ADD CONSTRAINT "profile_rsvp_gallery_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "profile" ("id")
          ON DELETE CASCADE;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profile_rsvp_gallery_media_id_fk'
      ) THEN
        ALTER TABLE "profile_rsvp_gallery"
          ADD CONSTRAINT "profile_rsvp_gallery_media_id_fk"
          FOREIGN KEY ("media_id") REFERENCES "user_media" ("id")
          ON DELETE SET NULL;
      END IF;
    END $$;

    -- ── _profile_v (versions) ───────────────────────────────────────────
    ALTER TABLE "_profile_v" ADD COLUMN IF NOT EXISTS "version_rsvp_intro" text;
    ALTER TABLE "_profile_v" ADD COLUMN IF NOT EXISTS "version_rsvp_ig_handle" varchar;

    CREATE TABLE IF NOT EXISTS "_profile_v_version_rsvp_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" uuid NOT NULL,
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "_uuid" varchar,
      "media_id" uuid
    );

    CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_gallery_order_idx"
      ON "_profile_v_version_rsvp_gallery" ("_order");
    CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_gallery_parent_id_idx"
      ON "_profile_v_version_rsvp_gallery" ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_profile_v_version_rsvp_gallery_media_idx"
      ON "_profile_v_version_rsvp_gallery" ("media_id");

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_profile_v_version_rsvp_gallery_parent_id_fk'
      ) THEN
        ALTER TABLE "_profile_v_version_rsvp_gallery"
          ADD CONSTRAINT "_profile_v_version_rsvp_gallery_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "_profile_v" ("id")
          ON DELETE CASCADE;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '_profile_v_version_rsvp_gallery_media_id_fk'
      ) THEN
        ALTER TABLE "_profile_v_version_rsvp_gallery"
          ADD CONSTRAINT "_profile_v_version_rsvp_gallery_media_id_fk"
          FOREIGN KEY ("media_id") REFERENCES "user_media" ("id")
          ON DELETE SET NULL;
      END IF;
    END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop FKs first so the table drop is unblocked
    ALTER TABLE "_profile_v_version_rsvp_gallery"
      DROP CONSTRAINT IF EXISTS "_profile_v_version_rsvp_gallery_media_id_fk";
    ALTER TABLE "_profile_v_version_rsvp_gallery"
      DROP CONSTRAINT IF EXISTS "_profile_v_version_rsvp_gallery_parent_id_fk";

    DROP INDEX IF EXISTS "_profile_v_version_rsvp_gallery_media_idx";
    DROP INDEX IF EXISTS "_profile_v_version_rsvp_gallery_parent_id_idx";
    DROP INDEX IF EXISTS "_profile_v_version_rsvp_gallery_order_idx";
    DROP TABLE IF EXISTS "_profile_v_version_rsvp_gallery";

    ALTER TABLE "_profile_v" DROP COLUMN IF EXISTS "version_rsvp_ig_handle";
    ALTER TABLE "_profile_v" DROP COLUMN IF EXISTS "version_rsvp_intro";

    ALTER TABLE "profile_rsvp_gallery"
      DROP CONSTRAINT IF EXISTS "profile_rsvp_gallery_media_id_fk";
    ALTER TABLE "profile_rsvp_gallery"
      DROP CONSTRAINT IF EXISTS "profile_rsvp_gallery_parent_id_fk";

    DROP INDEX IF EXISTS "profile_rsvp_gallery_media_idx";
    DROP INDEX IF EXISTS "profile_rsvp_gallery_parent_id_idx";
    DROP INDEX IF EXISTS "profile_rsvp_gallery_order_idx";
    DROP TABLE IF EXISTS "profile_rsvp_gallery";

    ALTER TABLE "profile" DROP COLUMN IF EXISTS "rsvp_ig_handle";
    ALTER TABLE "profile" DROP COLUMN IF EXISTS "rsvp_intro";
  `);
}
