import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "citations_color_idx";
  DROP INDEX "citations_path_idx";
  ALTER TABLE "citations" ALTER COLUMN "reference" DROP DEFAULT;
  ALTER TABLE "citations" DROP COLUMN "color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "citations" ALTER COLUMN "reference" SET DEFAULT '';
  ALTER TABLE "citations" ADD COLUMN "color" varchar NOT NULL;
  CREATE INDEX "citations_color_idx" ON "citations" USING btree ("color");
  CREATE INDEX "citations_path_idx" ON "citations" USING btree ("path");`)
}
