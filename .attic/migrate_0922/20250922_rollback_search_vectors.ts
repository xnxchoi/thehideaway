import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Rollback search vector functionality that's causing Drizzle adapter issues
  const collections = [
    "users",
    "posts",
    "delta",
    "albums",
    "tracks",
    "playlists",
    "categories",
    "tags"
  ];

  for (const collection of collections) {
    await db.execute(sql`
      -- Drop indexes
      DROP INDEX IF EXISTS ${sql.raw(collection)}_search_vector_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_title_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_subtitle_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_slug_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_name_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_username_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_bio_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_location_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_source_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_artist_gin_idx;
      DROP INDEX IF EXISTS ${sql.raw(collection)}_description_gin_idx;
      
      -- Drop trigger and function
      DROP TRIGGER IF EXISTS ${sql.raw(collection)}_search_vector_update ON ${sql.raw(collection)};
      DROP FUNCTION IF EXISTS ${sql.raw(`update_${collection}_search_vector`)}();
      
      -- Drop search_vector column
      ALTER TABLE ${sql.raw(collection)} DROP COLUMN IF EXISTS search_vector;
    `);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This would re-add the search functionality, but we'll leave it empty for now
  // since we want to keep it rolled back to fix the Drizzle adapter issue
}
