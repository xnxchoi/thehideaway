import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'enum_addresses_country') THEN
        ALTER TYPE "public"."enum_addresses_country" ADD VALUE IF NOT EXISTS 'KR';
      END IF;
    END $$;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // WHY-OVERRIDE-PAYLOAD: the generated enum replacement cannot cast persisted
  // KR addresses to the old enum. Refuse rollback before any schema mutation;
  // an operator must explicitly resolve those records, never delete them here.
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'enum_addresses_country' AND e.enumlabel = 'KR') THEN
        RETURN;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'country') THEN
        IF EXISTS (SELECT 1 FROM "public"."addresses" WHERE "country"::text = 'KR') THEN
          RAISE EXCEPTION 'Cannot remove KR country support while KR addresses exist';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'country'
          AND udt_schema = 'public' AND udt_name = 'enum_addresses_country') THEN
          ALTER TABLE "public"."addresses" ALTER COLUMN "country" SET DATA TYPE text;
        END IF;
      END IF;
      DROP TYPE IF EXISTS "public"."enum_addresses_country";
      BEGIN
        CREATE TYPE "public"."enum_addresses_country" AS ENUM('US', 'GB', 'CA', 'AU', 'AT', 'BE', 'BR', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HK', 'HU', 'IN', 'IE', 'IT', 'JP', 'LV', 'LT', 'LU', 'MY', 'MT', 'MX', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE', 'CH');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
      IF EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'addresses' AND column_name = 'country'
        AND data_type = 'text') THEN
        ALTER TABLE "public"."addresses" ALTER COLUMN "country" SET DATA TYPE "public"."enum_addresses_country" USING "country"::"public"."enum_addresses_country";
      END IF;
    END $$;`);
}
