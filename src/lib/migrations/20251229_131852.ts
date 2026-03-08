import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_media_block" RENAME TO "pages_blocks_image_block";
  ALTER TABLE "_pages_v_blocks_media_block" RENAME TO "_pages_v_blocks_image_block";
  ALTER TABLE "pages_blocks_image_block" DROP CONSTRAINT "pages_blocks_media_block_parent_id_fk";
  
  ALTER TABLE "_pages_v_blocks_image_block" DROP CONSTRAINT "_pages_v_blocks_media_block_parent_id_fk";
  
  DROP INDEX "pages_blocks_media_block_order_idx";
  DROP INDEX "pages_blocks_media_block_parent_id_idx";
  DROP INDEX "pages_blocks_media_block_path_idx";
  DROP INDEX "_pages_v_blocks_media_block_order_idx";
  DROP INDEX "_pages_v_blocks_media_block_parent_id_idx";
  DROP INDEX "_pages_v_blocks_media_block_path_idx";
  ALTER TABLE "pages_rels" ADD COLUMN "assets_id" uuid;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "assets_id" uuid;
  ALTER TABLE "pages_blocks_image_block" ADD CONSTRAINT "pages_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_block" ADD CONSTRAINT "_pages_v_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_assets_fk" FOREIGN KEY ("assets_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_image_block_order_idx" ON "pages_blocks_image_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_block_parent_id_idx" ON "pages_blocks_image_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_block_path_idx" ON "pages_blocks_image_block" USING btree ("_path");
  CREATE INDEX "pages_rels_assets_id_idx" ON "pages_rels" USING btree ("assets_id");
  CREATE INDEX "_pages_v_blocks_image_block_order_idx" ON "_pages_v_blocks_image_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_block_parent_id_idx" ON "_pages_v_blocks_image_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_block_path_idx" ON "_pages_v_blocks_image_block" USING btree ("_path");
  CREATE INDEX "_pages_v_rels_assets_id_idx" ON "_pages_v_rels" USING btree ("assets_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_media_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_image_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_image_block" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_image_block" CASCADE;
  DROP TABLE "_pages_v_blocks_image_block" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_assets_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_assets_fk";
  
  DROP INDEX "pages_rels_assets_id_idx";
  DROP INDEX "_pages_v_rels_assets_id_idx";
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block" ADD CONSTRAINT "_pages_v_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_media_block_order_idx" ON "pages_blocks_media_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_block_parent_id_idx" ON "pages_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_block_path_idx" ON "pages_blocks_media_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_block_order_idx" ON "_pages_v_blocks_media_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_block_parent_id_idx" ON "_pages_v_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_block_path_idx" ON "_pages_v_blocks_media_block" USING btree ("_path");
  ALTER TABLE "pages_rels" DROP COLUMN "assets_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "assets_id";`);
}
