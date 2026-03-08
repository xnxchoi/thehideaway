import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_tagged" RENAME TO "search_tags";
  ALTER TABLE "search_tags" DROP CONSTRAINT "search_tagged_parent_id_fk";
  
  DROP INDEX "search_tagged_order_idx";
  DROP INDEX "search_tagged_parent_id_idx";
  DROP INDEX "search_tagged_key_idx";
  ALTER TABLE "search_tags" ADD CONSTRAINT "search_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_tags_order_idx" ON "search_tags" USING btree ("_order");
  CREATE INDEX "search_tags_parent_id_idx" ON "search_tags" USING btree ("_parent_id");
  CREATE INDEX "search_tags_key_idx" ON "search_tags" USING btree ("key");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_tags" RENAME TO "search_tagged";
  ALTER TABLE "search_tagged" DROP CONSTRAINT "search_tags_parent_id_fk";
  
  DROP INDEX "search_tags_order_idx";
  DROP INDEX "search_tags_parent_id_idx";
  DROP INDEX "search_tags_key_idx";
  ALTER TABLE "search_tagged" ADD CONSTRAINT "search_tagged_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_tagged_order_idx" ON "search_tagged" USING btree ("_order");
  CREATE INDEX "search_tagged_parent_id_idx" ON "search_tagged" USING btree ("_parent_id");
  CREATE INDEX "search_tagged_key_idx" ON "search_tagged" USING btree ("key");`);
}
