import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "search_author" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar(24) PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"image" varchar,
  	"slug" varchar NOT NULL
  );
  
  CREATE TABLE "search_allow_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar(24) PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "search_category" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"key" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL
  );
  
  ALTER TABLE "profile" ADD COLUMN "slug" varchar DEFAULT '';
  ALTER TABLE "_profile_v" ADD COLUMN "version_slug" varchar DEFAULT '';
  ALTER TABLE "search" ADD COLUMN "slug" varchar NOT NULL;
  ALTER TABLE "search" ADD COLUMN "locked" boolean DEFAULT false NOT NULL;
  ALTER TABLE "search" ADD COLUMN "authority" numeric DEFAULT 0;
  ALTER TABLE "search" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "search" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "search" ADD COLUMN "meta_image_id" uuid;
  ALTER TABLE "search_author" ADD CONSTRAINT "search_author_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_allow_list" ADD CONSTRAINT "search_allow_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_category" ADD CONSTRAINT "search_category_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_author_order_idx" ON "search_author" USING btree ("_order");
  CREATE INDEX "search_author_parent_id_idx" ON "search_author" USING btree ("_parent_id");
  CREATE INDEX "search_allow_list_order_idx" ON "search_allow_list" USING btree ("_order");
  CREATE INDEX "search_allow_list_parent_id_idx" ON "search_allow_list" USING btree ("_parent_id");
  CREATE INDEX "search_category_order_idx" ON "search_category" USING btree ("_order");
  CREATE INDEX "search_category_parent_id_idx" ON "search_category" USING btree ("_parent_id");
  CREATE INDEX "search_category_key_idx" ON "search_category" USING btree ("key");
  ALTER TABLE "search" ADD CONSTRAINT "search_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "profile_slug_idx" ON "profile" USING btree ("slug");
  CREATE INDEX "_profile_v_version_version_slug_idx" ON "_profile_v" USING btree ("version_slug");
  CREATE INDEX "search_slug_idx" ON "search" USING btree ("slug");
  CREATE INDEX "search_locked_idx" ON "search" USING btree ("locked");
  CREATE INDEX "search_authority_idx" ON "search" USING btree ("authority");
  CREATE INDEX "search_meta_meta_image_idx" ON "search" USING btree ("meta_image_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "search_author" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_allow_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_category" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "search_author" CASCADE;
  DROP TABLE "search_allow_list" CASCADE;
  DROP TABLE "search_category" CASCADE;
  ALTER TABLE "search" DROP CONSTRAINT "search_meta_image_id_media_id_fk";
  
  DROP INDEX "profile_slug_idx";
  DROP INDEX "_profile_v_version_version_slug_idx";
  DROP INDEX "search_slug_idx";
  DROP INDEX "search_locked_idx";
  DROP INDEX "search_authority_idx";
  DROP INDEX "search_meta_meta_image_idx";
  ALTER TABLE "profile" DROP COLUMN "slug";
  ALTER TABLE "_profile_v" DROP COLUMN "version_slug";
  ALTER TABLE "search" DROP COLUMN "slug";
  ALTER TABLE "search" DROP COLUMN "locked";
  ALTER TABLE "search" DROP COLUMN "authority";
  ALTER TABLE "search" DROP COLUMN "meta_title";
  ALTER TABLE "search" DROP COLUMN "meta_description";
  ALTER TABLE "search" DROP COLUMN "meta_image_id";`);
}
