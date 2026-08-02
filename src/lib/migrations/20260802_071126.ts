import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "two_factors"
    ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "failed_verification_count" numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "locked_until" timestamp(3) with time zone;

  DO $$
  BEGIN
    IF to_regclass('public.two_factors') IS NOT NULL THEN
      UPDATE "two_factors"
      SET
        "verified" = COALESCE("verified", true),
        "failed_verification_count" = COALESCE("failed_verification_count", 0)
      WHERE "verified" IS NULL OR "failed_verification_count" IS NULL;

      ALTER TABLE "two_factors"
        ALTER COLUMN "verified" SET DEFAULT true,
        ALTER COLUMN "failed_verification_count" SET DEFAULT 0;
    END IF;
  END $$;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE IF EXISTS "two_factors"
    DROP COLUMN IF EXISTS "verified",
    DROP COLUMN IF EXISTS "failed_verification_count",
    DROP COLUMN IF EXISTS "locked_until";`);
}
