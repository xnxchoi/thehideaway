import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add new columns to compilations
    ALTER TABLE "compilations"
      ADD COLUMN IF NOT EXISTS "hash_id" varchar,
      ADD COLUMN IF NOT EXISTS "description" varchar,
      ADD COLUMN IF NOT EXISTS "author_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "visibility" varchar NOT NULL DEFAULT 'private',
      ADD COLUMN IF NOT EXISTS "cover_image_id" varchar REFERENCES "media"("id") ON DELETE SET NULL;

    -- Drop old columns
    ALTER TABLE "compilations"
      DROP COLUMN IF EXISTS "image_picker";

    -- Indexes for new compilations columns
    CREATE INDEX IF NOT EXISTS "compilations_hash_id_idx" ON "compilations" USING btree ("hash_id");
    CREATE INDEX IF NOT EXISTS "compilations_author_id_idx" ON "compilations" USING btree ("author_id");
    CREATE INDEX IF NOT EXISTS "compilations_visibility_idx" ON "compilations" USING btree ("visibility");

    -- Add new relationship columns to compilations_rels for all supported item types
    ALTER TABLE "compilations_rels"
      ADD COLUMN IF NOT EXISTS "posts_id" varchar REFERENCES "posts"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "surf_id" varchar REFERENCES "surf"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "profile_id" uuid REFERENCES "profile"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "albums_id" uuid REFERENCES "albums"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "playlists_id" uuid REFERENCES "playlists"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "tracks_id" uuid REFERENCES "tracks"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "user_media_id" varchar REFERENCES "user_media"("id") ON DELETE CASCADE;

    -- Drop old rels columns (assets and media items)
    ALTER TABLE "compilations_rels"
      DROP COLUMN IF EXISTS "assets_id",
      DROP COLUMN IF EXISTS "media_id";

    -- Indexes for new compilations_rels columns
    CREATE INDEX IF NOT EXISTS "compilations_rels_posts_id_idx" ON "compilations_rels" USING btree ("posts_id");
    CREATE INDEX IF NOT EXISTS "compilations_rels_surf_id_idx" ON "compilations_rels" USING btree ("surf_id");
    CREATE INDEX IF NOT EXISTS "compilations_rels_profile_id_idx" ON "compilations_rels" USING btree ("profile_id");
    CREATE INDEX IF NOT EXISTS "compilations_rels_albums_id_idx" ON "compilations_rels" USING btree ("albums_id");
    CREATE INDEX IF NOT EXISTS "compilations_rels_playlists_id_idx" ON "compilations_rels" USING btree ("playlists_id");
    CREATE INDEX IF NOT EXISTS "compilations_rels_tracks_id_idx" ON "compilations_rels" USING btree ("tracks_id");
    CREATE INDEX IF NOT EXISTS "compilations_rels_user_media_id_idx" ON "compilations_rels" USING btree ("user_media_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Restore compilations_rels old columns
    ALTER TABLE "compilations_rels"
      DROP COLUMN IF EXISTS "posts_id",
      DROP COLUMN IF EXISTS "surf_id",
      DROP COLUMN IF EXISTS "profile_id",
      DROP COLUMN IF EXISTS "albums_id",
      DROP COLUMN IF EXISTS "playlists_id",
      DROP COLUMN IF EXISTS "tracks_id",
      DROP COLUMN IF EXISTS "user_media_id",
      ADD COLUMN IF NOT EXISTS "assets_id" varchar REFERENCES "assets"("id") ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS "media_id" varchar REFERENCES "media"("id") ON DELETE CASCADE;

    -- Restore compilations old columns
    ALTER TABLE "compilations"
      DROP COLUMN IF EXISTS "hash_id",
      DROP COLUMN IF EXISTS "description",
      DROP COLUMN IF EXISTS "author_id",
      DROP COLUMN IF EXISTS "visibility",
      DROP COLUMN IF EXISTS "cover_image_id",
      ADD COLUMN IF NOT EXISTS "image_picker" boolean NOT NULL DEFAULT true;

    -- Drop indexes
    DROP INDEX IF EXISTS "compilations_hash_id_idx";
    DROP INDEX IF EXISTS "compilations_author_id_idx";
    DROP INDEX IF EXISTS "compilations_visibility_idx";
    DROP INDEX IF EXISTS "compilations_rels_posts_id_idx";
    DROP INDEX IF EXISTS "compilations_rels_surf_id_idx";
    DROP INDEX IF EXISTS "compilations_rels_profile_id_idx";
    DROP INDEX IF EXISTS "compilations_rels_albums_id_idx";
    DROP INDEX IF EXISTS "compilations_rels_playlists_id_idx";
    DROP INDEX IF EXISTS "compilations_rels_tracks_id_idx";
    DROP INDEX IF EXISTS "compilations_rels_user_media_id_idx";
  `);
}
