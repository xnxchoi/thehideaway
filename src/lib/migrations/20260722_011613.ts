import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

// WHY-OVERRIDE-PAYLOAD: PostgreSQL cannot use an enum value in an index
// predicate until the transaction that added the value has committed. Payload
// generated both operations in 20260722_011612, so this index must run in the
// immediately following migration transaction.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "inventory_movements_reservation_source_ref_once_idx"
      ON "inventory_movements" USING btree ("source_ref")
      WHERE "source_type" = 'inventory_reservation';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "inventory_movements_reservation_source_ref_once_idx";
  `);
}
