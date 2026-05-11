import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "author__status_updatedAt_idx" ON "posts" USING btree ("author_id","_status","updated_at");
  CREATE INDEX "version_author_version__status_version_updatedAt_idx" ON "_posts_v" USING btree ("version_author_id","version__status","version_updated_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "author__status_updatedAt_idx";
  DROP INDEX "version_author_version__status_version_updatedAt_idx";`)
}
