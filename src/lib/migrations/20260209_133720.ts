import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search" DROP CONSTRAINT "search_meta_image_id_media_id_fk";
  
  DROP INDEX "search_meta_meta_image_idx";
  ALTER TABLE "search_rels" ADD COLUMN "media_id" uuid;
  ALTER TABLE "search_rels" ADD COLUMN "assets_id" uuid;
  ALTER TABLE "search_rels" ADD COLUMN "user_media_id" uuid;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_user_media_fk" FOREIGN KEY ("user_media_id") REFERENCES "public"."user_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_media_id_idx" ON "search_rels" USING btree ("media_id");
  CREATE INDEX "search_rels_assets_id_idx" ON "search_rels" USING btree ("assets_id");
  CREATE INDEX "search_rels_user_media_id_idx" ON "search_rels" USING btree ("user_media_id");
  ALTER TABLE "search" DROP COLUMN "meta_image_id";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_media_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_assets_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_user_media_fk";
  
  DROP INDEX "search_rels_media_id_idx";
  DROP INDEX "search_rels_assets_id_idx";
  DROP INDEX "search_rels_user_media_id_idx";
  ALTER TABLE "search" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "search" ADD CONSTRAINT "search_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "search_meta_meta_image_idx" ON "search" USING btree ("meta_image_id");
  ALTER TABLE "search_rels" DROP COLUMN "media_id";
  ALTER TABLE "search_rels" DROP COLUMN "assets_id";
  ALTER TABLE "search_rels" DROP COLUMN "user_media_id";`);
}
