import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_media_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_media_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_user_media_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_user_media_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_media_v" CASCADE;
  DROP TABLE "_media_v_rels" CASCADE;
  DROP TABLE "_user_media_v" CASCADE;
  DROP TABLE "_user_media_v_rels" CASCADE;
  DROP INDEX "media__status_idx";
  DROP INDEX "user_media__status_idx";
  ALTER TABLE "media" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "user_media" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "media" DROP COLUMN "_status";
  ALTER TABLE "user_media" DROP COLUMN "_status";
  DROP TYPE "public"."enum_media_status";
  DROP TYPE "public"."enum__media_v_version_status";
  DROP TYPE "public"."enum__media_v_published_locale";
  DROP TYPE "public"."enum_user_media_status";
  DROP TYPE "public"."enum__user_media_v_version_status";
  DROP TYPE "public"."enum__user_media_v_published_locale";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__media_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__media_v_published_locale" AS ENUM('en', 'ko');
  CREATE TYPE "public"."enum_user_media_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__user_media_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__user_media_v_published_locale" AS ENUM('en', 'ko');
  CREATE TABLE "_media_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_alt" varchar DEFAULT 'an image',
  	"version_caption" varchar,
  	"version_darkmode" boolean DEFAULT false,
  	"version_author_id" uuid,
  	"version_published_at" timestamp(3) with time zone,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_blur_data_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__media_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_sizes_thumbnail_url" varchar,
  	"version_sizes_thumbnail_width" numeric,
  	"version_sizes_thumbnail_height" numeric,
  	"version_sizes_thumbnail_mime_type" varchar,
  	"version_sizes_thumbnail_filesize" numeric,
  	"version_sizes_thumbnail_filename" varchar,
  	"version_sizes_square_url" varchar,
  	"version_sizes_square_width" numeric,
  	"version_sizes_square_height" numeric,
  	"version_sizes_square_mime_type" varchar,
  	"version_sizes_square_filesize" numeric,
  	"version_sizes_square_filename" varchar,
  	"version_sizes_small_url" varchar,
  	"version_sizes_small_width" numeric,
  	"version_sizes_small_height" numeric,
  	"version_sizes_small_mime_type" varchar,
  	"version_sizes_small_filesize" numeric,
  	"version_sizes_small_filename" varchar,
  	"version_sizes_medium_url" varchar,
  	"version_sizes_medium_width" numeric,
  	"version_sizes_medium_height" numeric,
  	"version_sizes_medium_mime_type" varchar,
  	"version_sizes_medium_filesize" numeric,
  	"version_sizes_medium_filename" varchar,
  	"version_sizes_large_url" varchar,
  	"version_sizes_large_width" numeric,
  	"version_sizes_large_height" numeric,
  	"version_sizes_large_mime_type" varchar,
  	"version_sizes_large_filesize" numeric,
  	"version_sizes_large_filename" varchar,
  	"version_sizes_xlarge_url" varchar,
  	"version_sizes_xlarge_width" numeric,
  	"version_sizes_xlarge_height" numeric,
  	"version_sizes_xlarge_mime_type" varchar,
  	"version_sizes_xlarge_filesize" numeric,
  	"version_sizes_xlarge_filename" varchar,
  	"version_sizes_og_url" varchar,
  	"version_sizes_og_width" numeric,
  	"version_sizes_og_height" numeric,
  	"version_sizes_og_mime_type" varchar,
  	"version_sizes_og_filesize" numeric,
  	"version_sizes_og_filename" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__media_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_media_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  CREATE TABLE "_user_media_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_alt" varchar,
  	"version_caption" varchar,
  	"version_darkmode" boolean DEFAULT false,
  	"version_author_id" uuid,
  	"version_published_at" timestamp(3) with time zone,
  	"version_locked" boolean DEFAULT false,
  	"version_authority" numeric DEFAULT 0,
  	"version_blur_data_url" varchar,
  	"version_likes" numeric,
  	"version_folder_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__user_media_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"version_sizes_thumbnail_url" varchar,
  	"version_sizes_thumbnail_width" numeric,
  	"version_sizes_thumbnail_height" numeric,
  	"version_sizes_thumbnail_mime_type" varchar,
  	"version_sizes_thumbnail_filesize" numeric,
  	"version_sizes_thumbnail_filename" varchar,
  	"version_sizes_square_url" varchar,
  	"version_sizes_square_width" numeric,
  	"version_sizes_square_height" numeric,
  	"version_sizes_square_mime_type" varchar,
  	"version_sizes_square_filesize" numeric,
  	"version_sizes_square_filename" varchar,
  	"version_sizes_small_url" varchar,
  	"version_sizes_small_width" numeric,
  	"version_sizes_small_height" numeric,
  	"version_sizes_small_mime_type" varchar,
  	"version_sizes_small_filesize" numeric,
  	"version_sizes_small_filename" varchar,
  	"version_sizes_medium_url" varchar,
  	"version_sizes_medium_width" numeric,
  	"version_sizes_medium_height" numeric,
  	"version_sizes_medium_mime_type" varchar,
  	"version_sizes_medium_filesize" numeric,
  	"version_sizes_medium_filename" varchar,
  	"version_sizes_large_url" varchar,
  	"version_sizes_large_width" numeric,
  	"version_sizes_large_height" numeric,
  	"version_sizes_large_mime_type" varchar,
  	"version_sizes_large_filesize" numeric,
  	"version_sizes_large_filename" varchar,
  	"version_sizes_xlarge_url" varchar,
  	"version_sizes_xlarge_width" numeric,
  	"version_sizes_xlarge_height" numeric,
  	"version_sizes_xlarge_mime_type" varchar,
  	"version_sizes_xlarge_filesize" numeric,
  	"version_sizes_xlarge_filename" varchar,
  	"version_sizes_og_url" varchar,
  	"version_sizes_og_width" numeric,
  	"version_sizes_og_height" numeric,
  	"version_sizes_og_mime_type" varchar,
  	"version_sizes_og_filesize" numeric,
  	"version_sizes_og_filename" varchar,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__user_media_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_user_media_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid
  );
  
  ALTER TABLE "media" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "user_media" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "media" ADD COLUMN "_status" "enum_media_status" DEFAULT 'draft';
  ALTER TABLE "user_media" ADD COLUMN "_status" "enum_user_media_status" DEFAULT 'draft';
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_user_media_v" ADD CONSTRAINT "_user_media_v_parent_id_user_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_user_media_v" ADD CONSTRAINT "_user_media_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_user_media_v" ADD CONSTRAINT "_user_media_v_version_folder_id_payload_folders_id_fk" FOREIGN KEY ("version_folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_user_media_v_rels" ADD CONSTRAINT "_user_media_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_user_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_user_media_v_rels" ADD CONSTRAINT "_user_media_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_media_v_parent_idx" ON "_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version_darkmode_idx" ON "_media_v" USING btree ("version_darkmode");
  CREATE INDEX "_media_v_version_version_author_idx" ON "_media_v" USING btree ("version_author_id");
  CREATE INDEX "_media_v_version_version_authority_idx" ON "_media_v" USING btree ("version_authority");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version__status_idx" ON "_media_v" USING btree ("version__status");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_sizes_thumbnail_version_sizes_thumbnail_idx" ON "_media_v" USING btree ("version_sizes_thumbnail_filename");
  CREATE INDEX "_media_v_version_sizes_square_version_sizes_square_filen_idx" ON "_media_v" USING btree ("version_sizes_square_filename");
  CREATE INDEX "_media_v_version_sizes_small_version_sizes_small_filenam_idx" ON "_media_v" USING btree ("version_sizes_small_filename");
  CREATE INDEX "_media_v_version_sizes_medium_version_sizes_medium_filen_idx" ON "_media_v" USING btree ("version_sizes_medium_filename");
  CREATE INDEX "_media_v_version_sizes_large_version_sizes_large_filenam_idx" ON "_media_v" USING btree ("version_sizes_large_filename");
  CREATE INDEX "_media_v_version_sizes_xlarge_version_sizes_xlarge_filen_idx" ON "_media_v" USING btree ("version_sizes_xlarge_filename");
  CREATE INDEX "_media_v_version_sizes_og_version_sizes_og_filename_idx" ON "_media_v" USING btree ("version_sizes_og_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "_media_v" USING btree ("updated_at");
  CREATE INDEX "_media_v_snapshot_idx" ON "_media_v" USING btree ("snapshot");
  CREATE INDEX "_media_v_published_locale_idx" ON "_media_v" USING btree ("published_locale");
  CREATE INDEX "_media_v_latest_idx" ON "_media_v" USING btree ("latest");
  CREATE INDEX "_media_v_autosave_idx" ON "_media_v" USING btree ("autosave");
  CREATE INDEX "_media_v_rels_order_idx" ON "_media_v_rels" USING btree ("order");
  CREATE INDEX "_media_v_rels_parent_idx" ON "_media_v_rels" USING btree ("parent_id");
  CREATE INDEX "_media_v_rels_path_idx" ON "_media_v_rels" USING btree ("path");
  CREATE INDEX "_media_v_rels_users_id_idx" ON "_media_v_rels" USING btree ("users_id");
  CREATE INDEX "_user_media_v_parent_idx" ON "_user_media_v" USING btree ("parent_id");
  CREATE INDEX "_user_media_v_version_version_darkmode_idx" ON "_user_media_v" USING btree ("version_darkmode");
  CREATE INDEX "_user_media_v_version_version_author_idx" ON "_user_media_v" USING btree ("version_author_id");
  CREATE INDEX "_user_media_v_version_version_authority_idx" ON "_user_media_v" USING btree ("version_authority");
  CREATE INDEX "_user_media_v_version_version_folder_idx" ON "_user_media_v" USING btree ("version_folder_id");
  CREATE INDEX "_user_media_v_version_version_updated_at_idx" ON "_user_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_user_media_v_version_version_created_at_idx" ON "_user_media_v" USING btree ("version_created_at");
  CREATE INDEX "_user_media_v_version_version__status_idx" ON "_user_media_v" USING btree ("version__status");
  CREATE INDEX "_user_media_v_version_version_filename_idx" ON "_user_media_v" USING btree ("version_filename");
  CREATE INDEX "_user_media_v_version_sizes_thumbnail_version_sizes_thum_idx" ON "_user_media_v" USING btree ("version_sizes_thumbnail_filename");
  CREATE INDEX "_user_media_v_version_sizes_square_version_sizes_square__idx" ON "_user_media_v" USING btree ("version_sizes_square_filename");
  CREATE INDEX "_user_media_v_version_sizes_small_version_sizes_small_fi_idx" ON "_user_media_v" USING btree ("version_sizes_small_filename");
  CREATE INDEX "_user_media_v_version_sizes_medium_version_sizes_medium__idx" ON "_user_media_v" USING btree ("version_sizes_medium_filename");
  CREATE INDEX "_user_media_v_version_sizes_large_version_sizes_large_fi_idx" ON "_user_media_v" USING btree ("version_sizes_large_filename");
  CREATE INDEX "_user_media_v_version_sizes_xlarge_version_sizes_xlarge__idx" ON "_user_media_v" USING btree ("version_sizes_xlarge_filename");
  CREATE INDEX "_user_media_v_version_sizes_og_version_sizes_og_filename_idx" ON "_user_media_v" USING btree ("version_sizes_og_filename");
  CREATE INDEX "_user_media_v_created_at_idx" ON "_user_media_v" USING btree ("created_at");
  CREATE INDEX "_user_media_v_updated_at_idx" ON "_user_media_v" USING btree ("updated_at");
  CREATE INDEX "_user_media_v_snapshot_idx" ON "_user_media_v" USING btree ("snapshot");
  CREATE INDEX "_user_media_v_published_locale_idx" ON "_user_media_v" USING btree ("published_locale");
  CREATE INDEX "_user_media_v_latest_idx" ON "_user_media_v" USING btree ("latest");
  CREATE INDEX "_user_media_v_autosave_idx" ON "_user_media_v" USING btree ("autosave");
  CREATE INDEX "_user_media_v_rels_order_idx" ON "_user_media_v_rels" USING btree ("order");
  CREATE INDEX "_user_media_v_rels_parent_idx" ON "_user_media_v_rels" USING btree ("parent_id");
  CREATE INDEX "_user_media_v_rels_path_idx" ON "_user_media_v_rels" USING btree ("path");
  CREATE INDEX "_user_media_v_rels_users_id_idx" ON "_user_media_v_rels" USING btree ("users_id");
  CREATE INDEX "media__status_idx" ON "media" USING btree ("_status");
  CREATE INDEX "user_media__status_idx" ON "user_media" USING btree ("_status");`)
}
