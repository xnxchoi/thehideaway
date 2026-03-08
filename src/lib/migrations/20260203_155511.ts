import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tags" ADD COLUMN "tag_count" numeric DEFAULT 0 NOT NULL;
  CREATE INDEX "tags_tag_count_idx" ON "tags" USING btree ("tag_count");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "tags_tag_count_idx";
  ALTER TABLE "tags" DROP COLUMN "tag_count";`);
}
