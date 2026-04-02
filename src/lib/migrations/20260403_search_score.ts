import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "search"
      ADD COLUMN IF NOT EXISTS "score" numeric DEFAULT 0;

    CREATE INDEX IF NOT EXISTS "search_score_idx" ON "search" USING btree ("score");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "search_score_idx";

    ALTER TABLE "search"
      DROP COLUMN IF EXISTS "score";
  `);
}
