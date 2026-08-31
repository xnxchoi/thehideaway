import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

// WHY-OVERRIDE-PAYLOAD: data backfill. Posts and Surf defaultValue look up
// slug `uncategorized`. The generated seed lives in `src/lib/migrations/`
// which is not the active `migrationDir` (`migrations-baseline`).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "categories" (
      "id",
      "title",
      "description",
      "slug",
      "popularity",
      "identity_accent",
      "identity_layout",
      "updated_at",
      "created_at"
    )
    SELECT
      '019e4fc2-3e2d-726c-b3d5-e9c787e1d55e',
      'Uncategorized',
      'Default bucket for all reflections without a category.',
      'uncategorized',
      0,
      'none',
      'left',
      now(),
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM "categories" WHERE "slug" = 'uncategorized'
    );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "categories" WHERE "slug" = 'uncategorized';
  `);
}
