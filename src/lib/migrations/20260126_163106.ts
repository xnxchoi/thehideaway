import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "likes";
  ALTER TABLE "_posts_v" DROP COLUMN "version_likes";
  ALTER TABLE "user_media" DROP COLUMN "likes";
  ALTER TABLE "delta" DROP COLUMN "likes";
  ALTER TABLE "_delta_v" DROP COLUMN "version_likes";
  ALTER TABLE "albums" DROP COLUMN "likes";
  ALTER TABLE "_albums_v" DROP COLUMN "version_likes";
  ALTER TABLE "tracks" DROP COLUMN "likes";
  ALTER TABLE "_tracks_v" DROP COLUMN "version_likes";
  ALTER TABLE "playlists" DROP COLUMN "likes";
  ALTER TABLE "_playlists_v" DROP COLUMN "version_likes";
  ALTER TABLE "citations" DROP COLUMN "likes";
  ALTER TABLE "responses" DROP COLUMN "likes";
  ALTER TABLE "_responses_v" DROP COLUMN "version_likes";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "likes" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_likes" numeric;
  ALTER TABLE "user_media" ADD COLUMN "likes" numeric;
  ALTER TABLE "delta" ADD COLUMN "likes" numeric;
  ALTER TABLE "_delta_v" ADD COLUMN "version_likes" numeric;
  ALTER TABLE "albums" ADD COLUMN "likes" numeric;
  ALTER TABLE "_albums_v" ADD COLUMN "version_likes" numeric;
  ALTER TABLE "tracks" ADD COLUMN "likes" numeric;
  ALTER TABLE "_tracks_v" ADD COLUMN "version_likes" numeric;
  ALTER TABLE "playlists" ADD COLUMN "likes" numeric;
  ALTER TABLE "_playlists_v" ADD COLUMN "version_likes" numeric;
  ALTER TABLE "citations" ADD COLUMN "likes" numeric;
  ALTER TABLE "responses" ADD COLUMN "likes" numeric;
  ALTER TABLE "_responses_v" ADD COLUMN "version_likes" numeric;`);
}
