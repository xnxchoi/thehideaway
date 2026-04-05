import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "artist_album_idx" ON "tracks" USING btree ("artist","album_id");
  CREATE INDEX "version_artist_version_album_idx" ON "_tracks_v" USING btree ("version_artist","version_album_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "artist_album_idx";
  DROP INDEX "version_artist_version_album_idx";`)
}
