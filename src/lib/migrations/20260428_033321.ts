import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_invoices_payment_method_method" AS ENUM('bank_transfer', 'cash');
  CREATE TYPE "public"."enum_invoices_payment_method_currency" AS ENUM('krw', 'usd', 'eur');
  CREATE TYPE "public"."enum_invoices_currency" AS ENUM('krw', 'usd', 'eur');
  CREATE TYPE "public"."enum_invoices_status" AS ENUM('paid', 'pending', 'void');
  CREATE TABLE "invoices_payment_method" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"method" "enum_invoices_payment_method_method" NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" "enum_invoices_payment_method_currency" DEFAULT 'krw' NOT NULL,
  	"payment_date" timestamp(3) with time zone NOT NULL,
  	"reference" varchar
  );
  
  ALTER TABLE "invoices" ALTER COLUMN "invoice_number" SET NOT NULL;
  ALTER TABLE "invoices" ADD COLUMN "subscription_id" uuid NOT NULL;
  ALTER TABLE "invoices" ADD COLUMN "plan_id" uuid NOT NULL;
  ALTER TABLE "invoices" ADD COLUMN "amount" numeric NOT NULL;
  ALTER TABLE "invoices" ADD COLUMN "currency" "enum_invoices_currency" DEFAULT 'krw' NOT NULL;
  ALTER TABLE "invoices" ADD COLUMN "status" "enum_invoices_status" DEFAULT 'paid' NOT NULL;
  ALTER TABLE "invoices" ADD COLUMN "paid_at" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "cycle_start" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "cycle_end" timestamp(3) with time zone;
  ALTER TABLE "invoices" ADD COLUMN "bank_reference" varchar;
  ALTER TABLE "invoices_payment_method" ADD CONSTRAINT "invoices_payment_method_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "invoices_payment_method_order_idx" ON "invoices_payment_method" USING btree ("_order");
  CREATE INDEX "invoices_payment_method_parent_id_idx" ON "invoices_payment_method" USING btree ("_parent_id");
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "invoices_subscription_idx" ON "invoices" USING btree ("subscription_id");
  CREATE INDEX "invoices_plan_idx" ON "invoices" USING btree ("plan_id");
  CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "invoices_payment_method" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "invoices_payment_method" CASCADE;
  ALTER TABLE "invoices" DROP CONSTRAINT "invoices_subscription_id_subscriptions_id_fk";
  
  ALTER TABLE "invoices" DROP CONSTRAINT "invoices_plan_id_plans_id_fk";
  
  DROP INDEX "invoices_subscription_idx";
  DROP INDEX "invoices_plan_idx";
  DROP INDEX "invoices_status_idx";
  ALTER TABLE "invoices" ALTER COLUMN "invoice_number" DROP NOT NULL;
  ALTER TABLE "invoices" DROP COLUMN "subscription_id";
  ALTER TABLE "invoices" DROP COLUMN "plan_id";
  ALTER TABLE "invoices" DROP COLUMN "amount";
  ALTER TABLE "invoices" DROP COLUMN "currency";
  ALTER TABLE "invoices" DROP COLUMN "status";
  ALTER TABLE "invoices" DROP COLUMN "paid_at";
  ALTER TABLE "invoices" DROP COLUMN "cycle_start";
  ALTER TABLE "invoices" DROP COLUMN "cycle_end";
  ALTER TABLE "invoices" DROP COLUMN "bank_reference";
  DROP TYPE "public"."enum_invoices_payment_method_method";
  DROP TYPE "public"."enum_invoices_payment_method_currency";
  DROP TYPE "public"."enum_invoices_currency";
  DROP TYPE "public"."enum_invoices_status";`)
}
