import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "admin_invitations"
    ADD COLUMN IF NOT EXISTS "email" varchar,
    ADD COLUMN IF NOT EXISTS "expires_at" timestamp(3) with time zone;

  DO $$
  BEGIN
    IF to_regclass('public.admin_invitations') IS NOT NULL THEN
      UPDATE "admin_invitations"
      SET
        "token" = md5("token"),
        "email" = 'expired+' || "id"::text || '@invalid.local',
        "expires_at" = CURRENT_TIMESTAMP
      WHERE "email" IS NULL OR "expires_at" IS NULL;

      ALTER TABLE "admin_invitations"
        ALTER COLUMN "email" SET NOT NULL,
        ALTER COLUMN "expires_at" SET NOT NULL;

      CREATE INDEX IF NOT EXISTS "admin_invitations_email_idx"
        ON "admin_invitations" USING btree ("email");
      CREATE INDEX IF NOT EXISTS "admin_invitations_expires_at_idx"
        ON "admin_invitations" USING btree ("expires_at");
    END IF;
  END $$;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "admin_invitations_expires_at_idx";
  DROP INDEX IF EXISTS "admin_invitations_email_idx";
  ALTER TABLE IF EXISTS "admin_invitations"
    DROP COLUMN IF EXISTS "expires_at",
    DROP COLUMN IF EXISTS "email";`);
}
