import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "title_editor";
  ALTER TABLE "_posts_v" DROP COLUMN "version_title_editor";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "title_editor" jsonb;
  ALTER TABLE "_posts_v" ADD COLUMN "version_title_editor" jsonb;`)
}
