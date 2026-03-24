import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "onboarding_progress" jsonb;
  ALTER TABLE "_users_v" ADD COLUMN "version_onboarding_progress" jsonb;
 `);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "onboarding_progress";
  ALTER TABLE "_users_v" DROP COLUMN "version_onboarding_progress";
 `);
}
