import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_assets_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_media_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_pages_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__pages_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_posts_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__posts_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_user_media_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_profile_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__profile_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_albums_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__albums_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_tracks_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__tracks_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_playlists_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__playlists_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum_surf_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  CREATE TYPE "public"."enum__surf_v_version_audience" AS ENUM('public', 'any_user', 'members', 'patrons', 'curated');
  ALTER TABLE "assets" ADD COLUMN "audience" "enum_assets_audience" DEFAULT 'public';
  ALTER TABLE "media" ADD COLUMN "audience" "enum_media_audience" DEFAULT 'public';
  ALTER TABLE "pages" ADD COLUMN "audience" "enum_pages_audience" DEFAULT 'public';
  ALTER TABLE "_pages_v" ADD COLUMN "version_audience" "enum__pages_v_version_audience" DEFAULT 'public';
  ALTER TABLE "posts" ADD COLUMN "audience" "enum_posts_audience" DEFAULT 'public';
  ALTER TABLE "_posts_v" ADD COLUMN "version_audience" "enum__posts_v_version_audience" DEFAULT 'public';
  ALTER TABLE "user_media" ADD COLUMN "audience" "enum_user_media_audience" DEFAULT 'public';
  ALTER TABLE "profile" ADD COLUMN "audience" "enum_profile_audience" DEFAULT 'public';
  ALTER TABLE "_profile_v" ADD COLUMN "version_audience" "enum__profile_v_version_audience" DEFAULT 'public';
  ALTER TABLE "albums" ADD COLUMN "audience" "enum_albums_audience" DEFAULT 'public';
  ALTER TABLE "_albums_v" ADD COLUMN "version_audience" "enum__albums_v_version_audience" DEFAULT 'public';
  ALTER TABLE "tracks" ADD COLUMN "audience" "enum_tracks_audience" DEFAULT 'public';
  ALTER TABLE "_tracks_v" ADD COLUMN "version_audience" "enum__tracks_v_version_audience" DEFAULT 'public';
  ALTER TABLE "playlists" ADD COLUMN "audience" "enum_playlists_audience" DEFAULT 'public';
  ALTER TABLE "_playlists_v" ADD COLUMN "version_audience" "enum__playlists_v_version_audience" DEFAULT 'public';
  ALTER TABLE "surf" ADD COLUMN "audience" "enum_surf_audience" DEFAULT 'public';
  ALTER TABLE "_surf_v" ADD COLUMN "version_audience" "enum__surf_v_version_audience" DEFAULT 'public';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "assets" DROP COLUMN "audience";
  ALTER TABLE "media" DROP COLUMN "audience";
  ALTER TABLE "pages" DROP COLUMN "audience";
  ALTER TABLE "_pages_v" DROP COLUMN "version_audience";
  ALTER TABLE "posts" DROP COLUMN "audience";
  ALTER TABLE "_posts_v" DROP COLUMN "version_audience";
  ALTER TABLE "user_media" DROP COLUMN "audience";
  ALTER TABLE "profile" DROP COLUMN "audience";
  ALTER TABLE "_profile_v" DROP COLUMN "version_audience";
  ALTER TABLE "albums" DROP COLUMN "audience";
  ALTER TABLE "_albums_v" DROP COLUMN "version_audience";
  ALTER TABLE "tracks" DROP COLUMN "audience";
  ALTER TABLE "_tracks_v" DROP COLUMN "version_audience";
  ALTER TABLE "playlists" DROP COLUMN "audience";
  ALTER TABLE "_playlists_v" DROP COLUMN "version_audience";
  ALTER TABLE "surf" DROP COLUMN "audience";
  ALTER TABLE "_surf_v" DROP COLUMN "version_audience";
  DROP TYPE "public"."enum_assets_audience";
  DROP TYPE "public"."enum_media_audience";
  DROP TYPE "public"."enum_pages_audience";
  DROP TYPE "public"."enum__pages_v_version_audience";
  DROP TYPE "public"."enum_posts_audience";
  DROP TYPE "public"."enum__posts_v_version_audience";
  DROP TYPE "public"."enum_user_media_audience";
  DROP TYPE "public"."enum_profile_audience";
  DROP TYPE "public"."enum__profile_v_version_audience";
  DROP TYPE "public"."enum_albums_audience";
  DROP TYPE "public"."enum__albums_v_version_audience";
  DROP TYPE "public"."enum_tracks_audience";
  DROP TYPE "public"."enum__tracks_v_version_audience";
  DROP TYPE "public"."enum_playlists_audience";
  DROP TYPE "public"."enum__playlists_v_version_audience";
  DROP TYPE "public"."enum_surf_audience";
  DROP TYPE "public"."enum__surf_v_version_audience";`)
}
