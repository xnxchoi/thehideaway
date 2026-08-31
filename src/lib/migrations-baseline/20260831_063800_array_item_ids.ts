import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

// WHY-OVERRIDE-PAYLOAD: plugin array row IDs are 24-char strings. The
// generated Postgres schema typed carts/orders/transactions item `id`
// columns as uuid with uuidv7(), so cart add-item fails with
// invalid input syntax for type uuid. Payload's generated schema already
// lists these as varchar; this aligns the live tables.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'carts_items' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
      ALTER TABLE "carts_items" ALTER COLUMN "id" DROP DEFAULT;
      ALTER TABLE "carts_items" ALTER COLUMN "id" TYPE varchar USING "id"::text;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders_items' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
      ALTER TABLE "orders_items" ALTER COLUMN "id" DROP DEFAULT;
      ALTER TABLE "orders_items" ALTER COLUMN "id" TYPE varchar USING "id"::text;
    END IF;
  END $$;
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'transactions_items' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
      ALTER TABLE "transactions_items" ALTER COLUMN "id" DROP DEFAULT;
      ALTER TABLE "transactions_items" ALTER COLUMN "id" TYPE varchar USING "id"::text;
    END IF;
  END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'carts_items' AND column_name = 'id' AND data_type = 'character varying'
    ) THEN
      ALTER TABLE "carts_items" ALTER COLUMN "id" TYPE uuid USING NULL;
      ALTER TABLE "carts_items" ALTER COLUMN "id" SET DEFAULT uuidv7();
    END IF;
  END $$;
  `);
}
