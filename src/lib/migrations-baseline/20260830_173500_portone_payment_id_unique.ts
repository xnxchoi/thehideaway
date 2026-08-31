import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: PortOne paymentId must be unique so concurrent
// confirm-order + webhook cannot attach two orders to one payment.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "transactions_portone_portone_payment_id_idx";
    CREATE UNIQUE INDEX IF NOT EXISTS "transactions_portone_payment_id_idx"
      ON "transactions" USING btree ("portone_payment_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "transactions_portone_payment_id_idx";
    CREATE INDEX IF NOT EXISTS "transactions_portone_portone_payment_id_idx"
      ON "transactions" USING btree ("portone_payment_id");
  `);
}
