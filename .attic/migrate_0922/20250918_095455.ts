import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "search_author" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "search_allow_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "search_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "search" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "search_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "search_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "search_author" CASCADE;
  DROP TABLE IF EXISTS "search_allow_list" CASCADE;
  DROP TABLE IF EXISTS "search_tags" CASCADE;
  DROP TABLE IF EXISTS "search" CASCADE;
  DROP TABLE IF EXISTS "search_locales" CASCADE;
  DROP TABLE IF EXISTS "search_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_search_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_search_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "search_id";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "search_author" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar(24) PRIMARY KEY NOT NULL,
  	"author_id" uuid
  );
  
  CREATE TABLE "search_allow_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar(24) PRIMARY KEY NOT NULL,
  	"allow_list_id" uuid
  );
  
  CREATE TABLE "search_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar(24) PRIMARY KEY NOT NULL,
  	"tag_title" varchar NOT NULL,
  	"tag_key" varchar NOT NULL,
  	"weight" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "search" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"priority" numeric,
  	"slug" varchar NOT NULL,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"category_category_key" varchar,
  	"category_category_title" varchar,
  	"category_category_slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" uuid,
  	"delta_id" uuid,
  	"albums_id" uuid,
  	"categories_id" uuid,
  	"tags_id" uuid,
  	"users_id" uuid,
  	"pages_id" uuid
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_id" uuid;
  ALTER TABLE "search_author" ADD CONSTRAINT "search_author_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_allow_list" ADD CONSTRAINT "search_allow_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_tags" ADD CONSTRAINT "search_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search" ADD CONSTRAINT "search_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_locales" ADD CONSTRAINT "search_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_author_order_idx" ON "search_author" USING btree ("_order");
  CREATE INDEX "search_author_parent_id_idx" ON "search_author" USING btree ("_parent_id");
  CREATE INDEX "search_allow_list_order_idx" ON "search_allow_list" USING btree ("_order");
  CREATE INDEX "search_allow_list_parent_id_idx" ON "search_allow_list" USING btree ("_parent_id");
  CREATE INDEX "search_tags_order_idx" ON "search_tags" USING btree ("_order");
  CREATE INDEX "search_tags_parent_id_idx" ON "search_tags" USING btree ("_parent_id");
  CREATE INDEX "search_slug_idx" ON "search" USING btree ("slug");
  CREATE INDEX "search_locked_idx" ON "search" USING btree ("locked");
  CREATE INDEX "search_authority_idx" ON "search" USING btree ("authority");
  CREATE INDEX "search_category_category_category_key_idx" ON "search" USING btree ("category_category_key");
  CREATE INDEX "search_meta_meta_image_idx" ON "search" USING btree ("meta_image_id");
  CREATE INDEX "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE UNIQUE INDEX "search_locales_locale_parent_id_unique" ON "search_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX "search_rels_posts_id_idx" ON "search_rels" USING btree ("posts_id");
  CREATE INDEX "search_rels_delta_id_idx" ON "search_rels" USING btree ("delta_id");
  CREATE INDEX "search_rels_albums_id_idx" ON "search_rels" USING btree ("albums_id");
  CREATE INDEX "search_rels_categories_id_idx" ON "search_rels" USING btree ("categories_id");
  CREATE INDEX "search_rels_tags_id_idx" ON "search_rels" USING btree ("tags_id");
  CREATE INDEX "search_rels_users_id_idx" ON "search_rels" USING btree ("users_id");
  CREATE INDEX "search_rels_pages_id_idx" ON "search_rels" USING btree ("pages_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");`);
}
