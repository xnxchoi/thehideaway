import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

/**
 * Delta migration on top of 20260519_180000_ticket_orders.
 *
 * 20260519 already creates `ticket_orders` (core columns + FKs +
 * indexes) and the `tickets.{gift_initial_name,gift_name_locked,order_id}`
 * additions. This file ONLY adds what's new beyond that snapshot:
 *
 *   - ticket_orders.mailed_at                  (timestamp)
 *   - ticket_orders.locale                    (enum_ticket_orders_locale)
 *   - profile.rsvp_tier                       (enum_profile_rsvp_tier)
 *   - _profile_v.version_rsvp_tier            (enum__profile_v_version_rsvp_tier)
 *   - payload_locked_documents_rels.ticket_orders_id  + FK + index
 *
 * Re-runnable per readmes/MIGRATIONS.md:
 *   - CREATE TYPE wrapped in DO $$ EXCEPTION WHEN duplicate_object block
 *   - ADD COLUMN uses IF NOT EXISTS
 *   - ADD CONSTRAINT FK wrapped in DO $$ block that checks pg_constraint
 *   - CREATE INDEX uses IF NOT EXISTS
 *
 * Original Drizzle-generated body was non-idempotent and duplicated
 * 20260519's CREATE TABLE — committed before 20260519 was baked into
 * `pnpm micreate`'s baseline. Replaced with the additive delta below.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Enums ----------------------------------------------------------------
    DO $$ BEGIN
      CREATE TYPE "public"."enum_profile_rsvp_tier" AS ENUM ('host', 'past', 'guest');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__profile_v_version_rsvp_tier" AS ENUM ('host', 'past', 'guest');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_ticket_orders_locale" AS ENUM ('ko', 'en');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- ticket_orders additions ----------------------------------------------
    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "mailed_at" timestamp(3) with time zone;
    ALTER TABLE "ticket_orders"
      ADD COLUMN IF NOT EXISTS "locale" "enum_ticket_orders_locale" DEFAULT 'ko';

    -- profile + _profile_v additions ---------------------------------------
    ALTER TABLE "profile"
      ADD COLUMN IF NOT EXISTS "rsvp_tier" "enum_profile_rsvp_tier" DEFAULT 'guest';
    ALTER TABLE "_profile_v"
      ADD COLUMN IF NOT EXISTS "version_rsvp_tier" "enum__profile_v_version_rsvp_tier" DEFAULT 'guest';

    -- payload_locked_documents_rels.ticket_orders_id + FK + index ----------
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "ticket_orders_id" uuid;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_ticket_orders_fk'
      ) THEN
        ALTER TABLE "payload_locked_documents_rels"
          ADD CONSTRAINT "payload_locked_documents_rels_ticket_orders_fk"
          FOREIGN KEY ("ticket_orders_id")
          REFERENCES "public"."ticket_orders"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ticket_orders_id_idx"
      ON "payload_locked_documents_rels" USING btree ("ticket_orders_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- FK + index on payload_locked_documents_rels --------------------------
    DROP INDEX IF EXISTS "payload_locked_documents_rels_ticket_orders_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ticket_orders_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "ticket_orders_id";

    -- profile + _profile_v additions ---------------------------------------
    ALTER TABLE "_profile_v" DROP COLUMN IF EXISTS "version_rsvp_tier";
    ALTER TABLE "profile"    DROP COLUMN IF EXISTS "rsvp_tier";

    -- ticket_orders additions ----------------------------------------------
    ALTER TABLE "ticket_orders" DROP COLUMN IF EXISTS "locale";
    ALTER TABLE "ticket_orders" DROP COLUMN IF EXISTS "mailed_at";

    -- Enums ----------------------------------------------------------------
    DROP TYPE IF EXISTS "public"."enum_ticket_orders_locale";
    DROP TYPE IF EXISTS "public"."enum__profile_v_version_rsvp_tier";
    DROP TYPE IF EXISTS "public"."enum_profile_rsvp_tier";
  `);
}
