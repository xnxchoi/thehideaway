import {MigrateDownArgs, MigrateUpArgs, sql} from '@payloadcms/db-postgres'

export async function up({db, payload, req}: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "_posts_v" ADD COLUMN "autosave" boolean;
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");`)
}

export async function down({db, payload, req}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   DROP INDEX "_posts_v_autosave_idx";
  ALTER TABLE "_posts_v" DROP COLUMN "autosave";`)
}
