import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_surf_source" AS ENUM('x', 'twitter', 'substack', 'instagram', 'youtube', 'external', 'medium');
  CREATE TYPE "public"."enum_surf_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__surf_v_version_source" AS ENUM('x', 'twitter', 'substack', 'instagram', 'youtube', 'external', 'medium');
  CREATE TYPE "public"."enum__surf_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__surf_v_published_locale" AS ENUM('en', 'ko');
  CREATE TABLE "surf" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"rich_title" jsonb,
  	"source" "enum_surf_source" DEFAULT 'external',
  	"content" jsonb,
  	"category_id" uuid,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"comments_enabled" boolean DEFAULT true,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_surf_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "surf_locales" (
  	"meta_title" varchar,
  	"meta_image_id" uuid,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "surf_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"surf_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_surf_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_rich_title" jsonb,
  	"version_source" "enum__surf_v_version_source" DEFAULT 'external',
  	"version_content" jsonb,
  	"version_category_id" uuid,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_comments_enabled" boolean DEFAULT true,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__surf_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__surf_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_surf_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_surf_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"surf_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  ALTER TABLE "delta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "delta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "delta_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_delta_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_delta_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_delta_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "delta" CASCADE;
  DROP TABLE IF EXISTS "delta_locales" CASCADE;
  DROP TABLE IF EXISTS "delta_rels" CASCADE;
  DROP TABLE IF EXISTS "_delta_v" CASCADE;
  DROP TABLE IF EXISTS "_delta_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_delta_v_rels" CASCADE;
  ALTER TABLE "notifications_rels" DROP CONSTRAINT IF EXISTS "notifications_rels_delta_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_delta_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_delta_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT IF EXISTS "bookmarks_rels_delta_fk";
  
  ALTER TABLE "user_views_rels" DROP CONSTRAINT IF EXISTS "user_views_rels_delta_fk";
  
  ALTER TABLE "citations_rels" DROP CONSTRAINT IF EXISTS "citations_rels_delta_fk";
  
  ALTER TABLE "responses_rels" DROP CONSTRAINT IF EXISTS "responses_rels_delta_fk";
  
  ALTER TABLE "_responses_v_rels" DROP CONSTRAINT IF EXISTS "_responses_v_rels_delta_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT IF EXISTS "search_rels_delta_fk";
  
  ALTER TABLE "header_rels" DROP CONSTRAINT IF EXISTS "header_rels_delta_fk";
  
  ALTER TABLE "footer_rels" DROP CONSTRAINT IF EXISTS "footer_rels_delta_fk";
  
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'system'::text;
  DROP TYPE IF EXISTS "public"."enum_notifications_type";
  CREATE TYPE "public"."enum_notifications_type" AS ENUM('comment', 'follow', 'mention', 'system', 'access', 'bookmark', 'profile', 'post', 'surf', 'notification');
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'system'::"public"."enum_notifications_type";
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_notifications_type" USING "type"::"public"."enum_notifications_type";
  ALTER TABLE "pages_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_fotd_relation_to";
  CREATE TYPE "public"."enum_pages_blocks_fotd_relation_to" AS ENUM('posts', 'surf');
  ALTER TABLE "pages_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE "public"."enum_pages_blocks_fotd_relation_to" USING "value"::"public"."enum_pages_blocks_fotd_relation_to";
  ALTER TABLE "_pages_v_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_fotd_relation_to";
  CREATE TYPE "public"."enum__pages_v_blocks_fotd_relation_to" AS ENUM('posts', 'surf');
  ALTER TABLE "_pages_v_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE "public"."enum__pages_v_blocks_fotd_relation_to" USING "value"::"public"."enum__pages_v_blocks_fotd_relation_to";
  DROP INDEX "notifications_rels_delta_id_idx";
  DROP INDEX "pages_rels_delta_id_idx";
  DROP INDEX "_pages_v_rels_delta_id_idx";
  DROP INDEX "bookmarks_rels_delta_id_idx";
  DROP INDEX "user_views_rels_delta_id_idx";
  DROP INDEX "citations_rels_delta_id_idx";
  DROP INDEX "responses_rels_delta_id_idx";
  DROP INDEX "_responses_v_rels_delta_id_idx";
  DROP INDEX "search_rels_delta_id_idx";
  DROP INDEX "header_rels_delta_id_idx";
  DROP INDEX "footer_rels_delta_id_idx";
  ALTER TABLE "notifications_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "pages_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "user_views_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "citations_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "responses_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "_responses_v_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "search_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "header_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "footer_rels" ADD COLUMN "surf_id" uuid;
  ALTER TABLE "surf" ADD CONSTRAINT "surf_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "surf" ADD CONSTRAINT "surf_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "surf_locales" ADD CONSTRAINT "surf_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "surf_locales" ADD CONSTRAINT "surf_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "surf_rels" ADD CONSTRAINT "surf_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_surf_v" ADD CONSTRAINT "_surf_v_parent_id_surf_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."surf"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_surf_v" ADD CONSTRAINT "_surf_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_surf_v" ADD CONSTRAINT "_surf_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_surf_v_locales" ADD CONSTRAINT "_surf_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_surf_v_locales" ADD CONSTRAINT "_surf_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_surf_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_surf_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_surf_v_rels" ADD CONSTRAINT "_surf_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "surf_source_idx" ON "surf" USING btree ("source");
  CREATE INDEX "surf_category_idx" ON "surf" USING btree ("category_id");
  CREATE INDEX "surf_slug_key_idx" ON "surf" USING btree ("slug_key");
  CREATE INDEX "surf_hash_id_idx" ON "surf" USING btree ("hash_id");
  CREATE INDEX "surf_comments_enabled_idx" ON "surf" USING btree ("comments_enabled");
  CREATE INDEX "surf_author_idx" ON "surf" USING btree ("author_id");
  CREATE INDEX "surf_authority_idx" ON "surf" USING btree ("authority");
  CREATE INDEX "surf_updated_at_idx" ON "surf" USING btree ("updated_at");
  CREATE INDEX "surf_created_at_idx" ON "surf" USING btree ("created_at");
  CREATE INDEX "surf__status_idx" ON "surf" USING btree ("_status");
  CREATE INDEX "surf_meta_meta_image_idx" ON "surf_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "surf_locales_locale_parent_id_unique" ON "surf_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "surf_rels_order_idx" ON "surf_rels" USING btree ("order");
  CREATE INDEX "surf_rels_parent_idx" ON "surf_rels" USING btree ("parent_id");
  CREATE INDEX "surf_rels_path_idx" ON "surf_rels" USING btree ("path");
  CREATE INDEX "surf_rels_tags_id_idx" ON "surf_rels" USING btree ("tags_id");
  CREATE INDEX "surf_rels_surf_id_idx" ON "surf_rels" USING btree ("surf_id");
  CREATE INDEX "surf_rels_posts_id_idx" ON "surf_rels" USING btree ("posts_id");
  CREATE INDEX "surf_rels_users_id_idx" ON "surf_rels" USING btree ("users_id");
  CREATE INDEX "_surf_v_parent_idx" ON "_surf_v" USING btree ("parent_id");
  CREATE INDEX "_surf_v_version_version_source_idx" ON "_surf_v" USING btree ("version_source");
  CREATE INDEX "_surf_v_version_version_category_idx" ON "_surf_v" USING btree ("version_category_id");
  CREATE INDEX "_surf_v_version_version_slug_key_idx" ON "_surf_v" USING btree ("version_slug_key");
  CREATE INDEX "_surf_v_version_version_hash_id_idx" ON "_surf_v" USING btree ("version_hash_id");
  CREATE INDEX "_surf_v_version_version_comments_enabled_idx" ON "_surf_v" USING btree ("version_comments_enabled");
  CREATE INDEX "_surf_v_version_version_author_idx" ON "_surf_v" USING btree ("version_author_id");
  CREATE INDEX "_surf_v_version_version_authority_idx" ON "_surf_v" USING btree ("version_authority");
  CREATE INDEX "_surf_v_version_version_updated_at_idx" ON "_surf_v" USING btree ("version_updated_at");
  CREATE INDEX "_surf_v_version_version_created_at_idx" ON "_surf_v" USING btree ("version_created_at");
  CREATE INDEX "_surf_v_version_version__status_idx" ON "_surf_v" USING btree ("version__status");
  CREATE INDEX "_surf_v_created_at_idx" ON "_surf_v" USING btree ("created_at");
  CREATE INDEX "_surf_v_updated_at_idx" ON "_surf_v" USING btree ("updated_at");
  CREATE INDEX "_surf_v_snapshot_idx" ON "_surf_v" USING btree ("snapshot");
  CREATE INDEX "_surf_v_published_locale_idx" ON "_surf_v" USING btree ("published_locale");
  CREATE INDEX "_surf_v_latest_idx" ON "_surf_v" USING btree ("latest");
  CREATE INDEX "_surf_v_version_meta_version_meta_image_idx" ON "_surf_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_surf_v_locales_locale_parent_id_unique" ON "_surf_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_surf_v_rels_order_idx" ON "_surf_v_rels" USING btree ("order");
  CREATE INDEX "_surf_v_rels_parent_idx" ON "_surf_v_rels" USING btree ("parent_id");
  CREATE INDEX "_surf_v_rels_path_idx" ON "_surf_v_rels" USING btree ("path");
  CREATE INDEX "_surf_v_rels_tags_id_idx" ON "_surf_v_rels" USING btree ("tags_id");
  CREATE INDEX "_surf_v_rels_surf_id_idx" ON "_surf_v_rels" USING btree ("surf_id");
  CREATE INDEX "_surf_v_rels_posts_id_idx" ON "_surf_v_rels" USING btree ("posts_id");
  CREATE INDEX "_surf_v_rels_users_id_idx" ON "_surf_v_rels" USING btree ("users_id");
  ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "citations_rels" ADD CONSTRAINT "citations_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_surf_fk" FOREIGN KEY ("surf_id") REFERENCES "public"."surf"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "notifications_rels_surf_id_idx" ON "notifications_rels" USING btree ("surf_id");
  CREATE INDEX "pages_rels_surf_id_idx" ON "pages_rels" USING btree ("surf_id");
  CREATE INDEX "_pages_v_rels_surf_id_idx" ON "_pages_v_rels" USING btree ("surf_id");
  CREATE INDEX "bookmarks_rels_surf_id_idx" ON "bookmarks_rels" USING btree ("surf_id");
  CREATE INDEX "user_views_rels_surf_id_idx" ON "user_views_rels" USING btree ("surf_id");
  CREATE INDEX "citations_rels_surf_id_idx" ON "citations_rels" USING btree ("surf_id");
  CREATE INDEX "responses_rels_surf_id_idx" ON "responses_rels" USING btree ("surf_id");
  CREATE INDEX "_responses_v_rels_surf_id_idx" ON "_responses_v_rels" USING btree ("surf_id");
  CREATE INDEX "search_rels_surf_id_idx" ON "search_rels" USING btree ("surf_id");
  CREATE INDEX "header_rels_surf_id_idx" ON "header_rels" USING btree ("surf_id");
  CREATE INDEX "footer_rels_surf_id_idx" ON "footer_rels" USING btree ("surf_id");
  ALTER TABLE "notifications_rels" DROP COLUMN "delta_id";
  ALTER TABLE "pages_rels" DROP COLUMN "delta_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "delta_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "delta_id";
  ALTER TABLE "user_views_rels" DROP COLUMN "delta_id";
  ALTER TABLE "citations_rels" DROP COLUMN "delta_id";
  ALTER TABLE "responses_rels" DROP COLUMN "delta_id";
  ALTER TABLE "_responses_v_rels" DROP COLUMN "delta_id";
  ALTER TABLE "search_rels" DROP COLUMN "delta_id";
  ALTER TABLE "header_rels" DROP COLUMN "delta_id";
  ALTER TABLE "footer_rels" DROP COLUMN "delta_id";
  DROP TYPE IF EXISTS "public"."enum_delta_source";
  DROP TYPE IF EXISTS "public"."enum_delta_status";
  DROP TYPE IF EXISTS "public"."enum__delta_v_version_source";
  DROP TYPE IF EXISTS "public"."enum__delta_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__delta_v_published_locale";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_delta_source" AS ENUM('x', 'twitter', 'substack', 'Instagram', 'youtube');
  CREATE TYPE "public"."enum_delta_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__delta_v_version_source" AS ENUM('x', 'twitter', 'substack', 'Instagram', 'youtube');
  CREATE TYPE "public"."enum__delta_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__delta_v_published_locale" AS ENUM('en', 'ko');
  CREATE TABLE "delta" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"rich_title" jsonb,
  	"source" "enum_delta_source",
  	"content" jsonb,
  	"category_id" uuid,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"comments_enabled" boolean DEFAULT true,
  	"slug_lock" boolean,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"author_id" uuid,
  	"locked" boolean DEFAULT false,
  	"authority" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_delta_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "delta_locales" (
  	"meta_title" varchar,
  	"meta_image_id" uuid,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "delta_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"delta_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_delta_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_rich_title" jsonb,
  	"version_source" "enum__delta_v_version_source",
  	"version_content" jsonb,
  	"version_category_id" uuid,
  	"version_slug_key" varchar,
  	"version_hash_id" varchar(11) NOT NULL,
  	"version_comments_enabled" boolean DEFAULT true,
  	"version_slug_lock" boolean,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_author_id" uuid,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__delta_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__delta_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_delta_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" uuid,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_delta_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"delta_id" uuid,
  	"posts_id" uuid,
  	"users_id" uuid
  );
  
  ALTER TABLE "surf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "surf_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "surf_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_surf_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_surf_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_surf_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "surf" CASCADE;
  DROP TABLE IF EXISTS "surf_locales" CASCADE;
  DROP TABLE IF EXISTS "surf_rels" CASCADE;
  DROP TABLE IF EXISTS "_surf_v" CASCADE;
  DROP TABLE IF EXISTS "_surf_v_locales" CASCADE;
  DROP TABLE IF EXISTS "_surf_v_rels" CASCADE;
  ALTER TABLE "notifications_rels" DROP CONSTRAINT IF EXISTS "notifications_rels_surf_fk";
  
  ALTER TABLE "pages_rels" DROP CONSTRAINT IF EXISTS "pages_rels_surf_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT IF EXISTS "_pages_v_rels_surf_fk";
  
  ALTER TABLE "bookmarks_rels" DROP CONSTRAINT IF EXISTS "bookmarks_rels_surf_fk";
  
  ALTER TABLE "user_views_rels" DROP CONSTRAINT IF EXISTS "user_views_rels_surf_fk";
  
  ALTER TABLE "citations_rels" DROP CONSTRAINT IF EXISTS "citations_rels_surf_fk";
  
  ALTER TABLE "responses_rels" DROP CONSTRAINT IF EXISTS "responses_rels_surf_fk";
  
  ALTER TABLE "_responses_v_rels" DROP CONSTRAINT IF EXISTS "_responses_v_rels_surf_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT IF EXISTS "search_rels_surf_fk";
  
  ALTER TABLE "header_rels" DROP CONSTRAINT IF EXISTS "header_rels_surf_fk";
  
  ALTER TABLE "footer_rels" DROP CONSTRAINT IF EXISTS "footer_rels_surf_fk";
  
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'system'::text;
  DROP TYPE IF EXISTS "public"."enum_notifications_type";
  CREATE TYPE "public"."enum_notifications_type" AS ENUM('comment', 'follow', 'mention', 'system', 'access', 'bookmark', 'profile', 'post', 'delta', 'notification');
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'system'::"public"."enum_notifications_type";
  ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."enum_notifications_type" USING "type"::"public"."enum_notifications_type";
  ALTER TABLE "pages_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_fotd_relation_to";
  CREATE TYPE "public"."enum_pages_blocks_fotd_relation_to" AS ENUM('posts', 'delta');
  ALTER TABLE "pages_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE "public"."enum_pages_blocks_fotd_relation_to" USING "value"::"public"."enum_pages_blocks_fotd_relation_to";
  ALTER TABLE "_pages_v_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_fotd_relation_to";
  CREATE TYPE "public"."enum__pages_v_blocks_fotd_relation_to" AS ENUM('posts', 'delta');
  ALTER TABLE "_pages_v_blocks_fotd_relation_to" ALTER COLUMN "value" SET DATA TYPE "public"."enum__pages_v_blocks_fotd_relation_to" USING "value"::"public"."enum__pages_v_blocks_fotd_relation_to";
  DROP INDEX "notifications_rels_surf_id_idx";
  DROP INDEX "pages_rels_surf_id_idx";
  DROP INDEX "_pages_v_rels_surf_id_idx";
  DROP INDEX "bookmarks_rels_surf_id_idx";
  DROP INDEX "user_views_rels_surf_id_idx";
  DROP INDEX "citations_rels_surf_id_idx";
  DROP INDEX "responses_rels_surf_id_idx";
  DROP INDEX "_responses_v_rels_surf_id_idx";
  DROP INDEX "search_rels_surf_id_idx";
  DROP INDEX "header_rels_surf_id_idx";
  DROP INDEX "footer_rels_surf_id_idx";
  ALTER TABLE "notifications_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "pages_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "bookmarks_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "user_views_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "citations_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "responses_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "_responses_v_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "search_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "header_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "footer_rels" ADD COLUMN "delta_id" uuid;
  ALTER TABLE "delta" ADD CONSTRAINT "delta_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "delta" ADD CONSTRAINT "delta_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "delta_locales" ADD CONSTRAINT "delta_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "delta_locales" ADD CONSTRAINT "delta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delta_rels" ADD CONSTRAINT "delta_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delta_rels" ADD CONSTRAINT "delta_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delta_rels" ADD CONSTRAINT "delta_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delta_rels" ADD CONSTRAINT "delta_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delta_rels" ADD CONSTRAINT "delta_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_delta_v" ADD CONSTRAINT "_delta_v_parent_id_delta_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."delta"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_delta_v" ADD CONSTRAINT "_delta_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_delta_v" ADD CONSTRAINT "_delta_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_delta_v_locales" ADD CONSTRAINT "_delta_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_delta_v_locales" ADD CONSTRAINT "_delta_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_delta_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_delta_v_rels" ADD CONSTRAINT "_delta_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_delta_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_delta_v_rels" ADD CONSTRAINT "_delta_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_delta_v_rels" ADD CONSTRAINT "_delta_v_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_delta_v_rels" ADD CONSTRAINT "_delta_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_delta_v_rels" ADD CONSTRAINT "_delta_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "delta_source_idx" ON "delta" USING btree ("source");
  CREATE INDEX "delta_category_idx" ON "delta" USING btree ("category_id");
  CREATE INDEX "delta_slug_key_idx" ON "delta" USING btree ("slug_key");
  CREATE INDEX "delta_hash_id_idx" ON "delta" USING btree ("hash_id");
  CREATE INDEX "delta_comments_enabled_idx" ON "delta" USING btree ("comments_enabled");
  CREATE INDEX "delta_author_idx" ON "delta" USING btree ("author_id");
  CREATE INDEX "delta_authority_idx" ON "delta" USING btree ("authority");
  CREATE INDEX "delta_updated_at_idx" ON "delta" USING btree ("updated_at");
  CREATE INDEX "delta_created_at_idx" ON "delta" USING btree ("created_at");
  CREATE INDEX "delta__status_idx" ON "delta" USING btree ("_status");
  CREATE INDEX "delta_meta_meta_image_idx" ON "delta_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "delta_locales_locale_parent_id_unique" ON "delta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "delta_rels_order_idx" ON "delta_rels" USING btree ("order");
  CREATE INDEX "delta_rels_parent_idx" ON "delta_rels" USING btree ("parent_id");
  CREATE INDEX "delta_rels_path_idx" ON "delta_rels" USING btree ("path");
  CREATE INDEX "delta_rels_tags_id_idx" ON "delta_rels" USING btree ("tags_id");
  CREATE INDEX "delta_rels_delta_id_idx" ON "delta_rels" USING btree ("delta_id");
  CREATE INDEX "delta_rels_posts_id_idx" ON "delta_rels" USING btree ("posts_id");
  CREATE INDEX "delta_rels_users_id_idx" ON "delta_rels" USING btree ("users_id");
  CREATE INDEX "_delta_v_parent_idx" ON "_delta_v" USING btree ("parent_id");
  CREATE INDEX "_delta_v_version_version_source_idx" ON "_delta_v" USING btree ("version_source");
  CREATE INDEX "_delta_v_version_version_category_idx" ON "_delta_v" USING btree ("version_category_id");
  CREATE INDEX "_delta_v_version_version_slug_key_idx" ON "_delta_v" USING btree ("version_slug_key");
  CREATE INDEX "_delta_v_version_version_hash_id_idx" ON "_delta_v" USING btree ("version_hash_id");
  CREATE INDEX "_delta_v_version_version_comments_enabled_idx" ON "_delta_v" USING btree ("version_comments_enabled");
  CREATE INDEX "_delta_v_version_version_author_idx" ON "_delta_v" USING btree ("version_author_id");
  CREATE INDEX "_delta_v_version_version_authority_idx" ON "_delta_v" USING btree ("version_authority");
  CREATE INDEX "_delta_v_version_version_updated_at_idx" ON "_delta_v" USING btree ("version_updated_at");
  CREATE INDEX "_delta_v_version_version_created_at_idx" ON "_delta_v" USING btree ("version_created_at");
  CREATE INDEX "_delta_v_version_version__status_idx" ON "_delta_v" USING btree ("version__status");
  CREATE INDEX "_delta_v_created_at_idx" ON "_delta_v" USING btree ("created_at");
  CREATE INDEX "_delta_v_updated_at_idx" ON "_delta_v" USING btree ("updated_at");
  CREATE INDEX "_delta_v_snapshot_idx" ON "_delta_v" USING btree ("snapshot");
  CREATE INDEX "_delta_v_published_locale_idx" ON "_delta_v" USING btree ("published_locale");
  CREATE INDEX "_delta_v_latest_idx" ON "_delta_v" USING btree ("latest");
  CREATE INDEX "_delta_v_version_meta_version_meta_image_idx" ON "_delta_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_delta_v_locales_locale_parent_id_unique" ON "_delta_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_delta_v_rels_order_idx" ON "_delta_v_rels" USING btree ("order");
  CREATE INDEX "_delta_v_rels_parent_idx" ON "_delta_v_rels" USING btree ("parent_id");
  CREATE INDEX "_delta_v_rels_path_idx" ON "_delta_v_rels" USING btree ("path");
  CREATE INDEX "_delta_v_rels_tags_id_idx" ON "_delta_v_rels" USING btree ("tags_id");
  CREATE INDEX "_delta_v_rels_delta_id_idx" ON "_delta_v_rels" USING btree ("delta_id");
  CREATE INDEX "_delta_v_rels_posts_id_idx" ON "_delta_v_rels" USING btree ("posts_id");
  CREATE INDEX "_delta_v_rels_users_id_idx" ON "_delta_v_rels" USING btree ("users_id");
  ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookmarks_rels" ADD CONSTRAINT "bookmarks_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_views_rels" ADD CONSTRAINT "user_views_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "citations_rels" ADD CONSTRAINT "citations_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "responses_rels" ADD CONSTRAINT "responses_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_responses_v_rels" ADD CONSTRAINT "_responses_v_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_delta_fk" FOREIGN KEY ("delta_id") REFERENCES "public"."delta"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "notifications_rels_delta_id_idx" ON "notifications_rels" USING btree ("delta_id");
  CREATE INDEX "pages_rels_delta_id_idx" ON "pages_rels" USING btree ("delta_id");
  CREATE INDEX "_pages_v_rels_delta_id_idx" ON "_pages_v_rels" USING btree ("delta_id");
  CREATE INDEX "bookmarks_rels_delta_id_idx" ON "bookmarks_rels" USING btree ("delta_id");
  CREATE INDEX "user_views_rels_delta_id_idx" ON "user_views_rels" USING btree ("delta_id");
  CREATE INDEX "citations_rels_delta_id_idx" ON "citations_rels" USING btree ("delta_id");
  CREATE INDEX "responses_rels_delta_id_idx" ON "responses_rels" USING btree ("delta_id");
  CREATE INDEX "_responses_v_rels_delta_id_idx" ON "_responses_v_rels" USING btree ("delta_id");
  CREATE INDEX "search_rels_delta_id_idx" ON "search_rels" USING btree ("delta_id");
  CREATE INDEX "header_rels_delta_id_idx" ON "header_rels" USING btree ("delta_id");
  CREATE INDEX "footer_rels_delta_id_idx" ON "footer_rels" USING btree ("delta_id");
  ALTER TABLE "notifications_rels" DROP COLUMN "surf_id";
  ALTER TABLE "pages_rels" DROP COLUMN "surf_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "surf_id";
  ALTER TABLE "bookmarks_rels" DROP COLUMN "surf_id";
  ALTER TABLE "user_views_rels" DROP COLUMN "surf_id";
  ALTER TABLE "citations_rels" DROP COLUMN "surf_id";
  ALTER TABLE "responses_rels" DROP COLUMN "surf_id";
  ALTER TABLE "_responses_v_rels" DROP COLUMN "surf_id";
  ALTER TABLE "search_rels" DROP COLUMN "surf_id";
  ALTER TABLE "header_rels" DROP COLUMN "surf_id";
  ALTER TABLE "footer_rels" DROP COLUMN "surf_id";
  DROP TYPE IF EXISTS "public"."enum_surf_source";
  DROP TYPE IF EXISTS "public"."enum_surf_status";
  DROP TYPE IF EXISTS "public"."enum__surf_v_version_source";
  DROP TYPE IF EXISTS "public"."enum__surf_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__surf_v_published_locale";`);
}
