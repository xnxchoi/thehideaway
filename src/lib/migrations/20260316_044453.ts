import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tracks" ADD COLUMN "duration" numeric;
  ALTER TABLE "_tracks_v" ADD COLUMN "version_duration" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tracks" DROP COLUMN "duration";
  ALTER TABLE "_tracks_v" DROP COLUMN "version_duration";`)
}
