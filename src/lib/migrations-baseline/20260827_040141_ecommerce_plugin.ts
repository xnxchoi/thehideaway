import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: generated CREATE/DROP/ALTER statements are wrapped
// with IF NOT EXISTS / IF EXISTS / duplicate_object guards so this file can
// be re-run. See readmes/MIGRATIONS.md.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_plans_payment_methods" AS ENUM('card', 'bank_transfer', 'cash');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_plans_tier" AS ENUM('resident', 'patron', 'cofounder');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_plans_validity" AS ENUM('yearly', 'lifetime');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_plans_type" AS ENUM('one_time');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_plans_state" AS ENUM('active', 'ended');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_invoices_payment_method_method" AS ENUM('bank_transfer', 'cash');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_invoices_status" AS ENUM('draft', 'open', 'paid', 'void', 'pending');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_prices_type" AS ENUM('one_time', 'recurring');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_prices_recurring_interval" AS ENUM('day', 'week', 'month', 'year');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_subscriptions_subscription_status" AS ENUM('pending', 'active', 'expired', 'canceled');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_subscriptions_request_method" AS ENUM('bank_transfer', 'cash', 'card');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_subscriptions_provider" AS ENUM('manual', 'portone');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_addresses_country" AS ENUM('US', 'GB', 'CA', 'AU', 'AT', 'BE', 'BR', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HK', 'HU', 'IN', 'IE', 'IT', 'JP', 'LV', 'LT', 'LU', 'MY', 'MT', 'MX', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE', 'CH');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_variants_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__variants_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__variants_v_published_locale" AS ENUM('en', 'ko');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__products_v_published_locale" AS ENUM('en', 'ko');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_carts_currency" AS ENUM('KRW', 'USD', 'EUR', 'JPY');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_orders_status" AS ENUM('processing', 'completed', 'cancelled', 'refunded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_orders_currency" AS ENUM('KRW', 'USD', 'EUR', 'JPY');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_transactions_status" AS ENUM('pending', 'succeeded', 'failed', 'cancelled', 'expired', 'refunded');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_transactions_currency" AS ENUM('KRW', 'USD', 'EUR', 'JPY');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE TABLE IF NOT EXISTS "plans_payment_methods" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_plans_payment_methods",
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "plans_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"label" varchar NOT NULL,
  	"included" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "plans" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"tier" "enum_plans_tier" DEFAULT 'resident' NOT NULL,
  	"tier_label" varchar DEFAULT '' NOT NULL,
  	"validity" "enum_plans_validity" DEFAULT 'yearly' NOT NULL,
  	"type" "enum_plans_type" DEFAULT 'one_time' NOT NULL,
  	"description" varchar,
  	"seat_limit" numeric,
  	"discount_label" varchar,
  	"sort" numeric DEFAULT 0,
  	"state" "enum_plans_state" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "invoices_payment_method" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"method" "enum_invoices_payment_method_method" NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency_id" uuid NOT NULL,
  	"payment_date" timestamp(3) with time zone NOT NULL,
  	"reference" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "invoices" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"invoice_number" numeric NOT NULL,
  	"client_id" uuid NOT NULL,
  	"subscription_id" uuid NOT NULL,
  	"plan_id" uuid NOT NULL,
  	"price_id" uuid NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency_id" uuid NOT NULL,
  	"fx_rate_used" numeric,
  	"status" "enum_invoices_status" DEFAULT 'draft' NOT NULL,
  	"paid_at" timestamp(3) with time zone,
  	"cycle_start" timestamp(3) with time zone,
  	"cycle_end" timestamp(3) with time zone,
  	"bank_reference" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "prices" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"nickname" varchar NOT NULL,
  	"plan_id" uuid NOT NULL,
  	"currency_id" uuid NOT NULL,
  	"unit_amount" numeric NOT NULL,
  	"type" "enum_prices_type" DEFAULT 'one_time' NOT NULL,
  	"recurring_interval" "enum_prices_recurring_interval" DEFAULT 'month',
  	"recurring_interval_count" numeric DEFAULT 1,
  	"recurring_trial_period_days" numeric DEFAULT 0,
  	"active" boolean DEFAULT true NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "subscriptions" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"user_id" uuid NOT NULL,
  	"plan_id" uuid NOT NULL,
  	"price_id" uuid NOT NULL,
  	"amount" numeric DEFAULT 0 NOT NULL,
  	"currency_id" uuid NOT NULL,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"expires_at" timestamp(3) with time zone,
  	"subscription_status" "enum_subscriptions_subscription_status" DEFAULT 'pending' NOT NULL,
  	"paid" boolean DEFAULT false,
  	"validity_waived" boolean DEFAULT false,
  	"last_waiver_check" timestamp(3) with time zone,
  	"request_method" "enum_subscriptions_request_method" DEFAULT 'bank_transfer' NOT NULL,
  	"provider" "enum_subscriptions_provider" DEFAULT 'manual' NOT NULL,
  	"payment_ref" varchar,
  	"portone_transaction_ref" varchar,
  	"request_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "exchange_rate_rates" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"currency_id" uuid NOT NULL,
  	"rate" numeric NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "exchange_rate" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "currency" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug_key" varchar,
  	"hash_id" varchar(11) DEFAULT nanoid(11) NOT NULL,
  	"slug_lock" boolean NOT NULL,
  	"slug" varchar NOT NULL,
  	"kr_nm" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "holidays_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "holidays" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"period" numeric NOT NULL,
  	"country" varchar DEFAULT 'kr' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "product_category" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "product_sub" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "product_drops" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT false NOT NULL,
  	"kicker" varchar,
  	"lede" varchar,
  	"hero_media_id" uuid,
  	"sort" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "addresses" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"customer_id" uuid,
  	"title" varchar,
  	"first_name" varchar,
  	"last_name" varchar,
  	"company" varchar,
  	"address_line1" varchar,
  	"address_line2" varchar,
  	"city" varchar,
  	"state" varchar,
  	"postal_code" varchar,
  	"country" "enum_addresses_country" NOT NULL,
  	"phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "variants" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"title" varchar,
  	"product_id" uuid,
  	"price_in_k_r_w_enabled" boolean,
  	"price_in_k_r_w" numeric,
  	"price_in_u_s_d_enabled" boolean,
  	"price_in_u_s_d" numeric,
  	"price_in_e_u_r_enabled" boolean,
  	"price_in_e_u_r" numeric,
  	"price_in_j_p_y_enabled" boolean,
  	"price_in_j_p_y" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_variants_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "variants_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"variant_options_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_variants_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_product_id" uuid,
  	"version_price_in_k_r_w_enabled" boolean,
  	"version_price_in_k_r_w" numeric,
  	"version_price_in_u_s_d_enabled" boolean,
  	"version_price_in_u_s_d" numeric,
  	"version_price_in_e_u_r_enabled" boolean,
  	"version_price_in_e_u_r" numeric,
  	"version_price_in_j_p_y_enabled" boolean,
  	"version_price_in_j_p_y" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__variants_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__variants_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_variants_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"variant_options_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "variant_types" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"label" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "variant_options" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"_variantoptions_options_order" varchar,
  	"variant_type_id" uuid NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "products" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"enable_variants" boolean,
  	"price_in_k_r_w_enabled" boolean,
  	"price_in_k_r_w" numeric,
  	"price_in_u_s_d_enabled" boolean,
  	"price_in_u_s_d" numeric,
  	"price_in_e_u_r_enabled" boolean,
  	"price_in_e_u_r" numeric,
  	"price_in_j_p_y_enabled" boolean,
  	"price_in_j_p_y" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_products_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"variant_types_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "_products_v" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"parent_id" uuid,
  	"version_enable_variants" boolean,
  	"version_price_in_k_r_w_enabled" boolean,
  	"version_price_in_k_r_w" numeric,
  	"version_price_in_u_s_d_enabled" boolean,
  	"version_price_in_u_s_d" numeric,
  	"version_price_in_e_u_r_enabled" boolean,
  	"version_price_in_e_u_r" numeric,
  	"version_price_in_j_p_y_enabled" boolean,
  	"version_price_in_j_p_y" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__products_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__products_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"variant_types_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "carts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"product_id" uuid,
  	"variant_id" uuid,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "carts" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"secret" varchar,
  	"customer_id" uuid,
  	"purchased_at" timestamp(3) with time zone,
  	"subtotal" numeric,
  	"currency" "enum_carts_currency" DEFAULT 'KRW',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"product_id" uuid,
  	"variant_id" uuid,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"shipping_address_title" varchar,
  	"shipping_address_first_name" varchar,
  	"shipping_address_last_name" varchar,
  	"shipping_address_company" varchar,
  	"shipping_address_address_line1" varchar,
  	"shipping_address_address_line2" varchar,
  	"shipping_address_city" varchar,
  	"shipping_address_state" varchar,
  	"shipping_address_postal_code" varchar,
  	"shipping_address_country" varchar,
  	"shipping_address_phone" varchar,
  	"customer_id" uuid,
  	"customer_email" varchar,
  	"status" "enum_orders_status" DEFAULT 'processing',
  	"amount" numeric,
  	"currency" "enum_orders_currency" DEFAULT 'KRW',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "orders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"transactions_id" uuid
  );
  
  CREATE TABLE IF NOT EXISTS "transactions_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"product_id" uuid,
  	"variant_id" uuid,
  	"quantity" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "transactions" (
  	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  	"billing_address_title" varchar,
  	"billing_address_first_name" varchar,
  	"billing_address_last_name" varchar,
  	"billing_address_company" varchar,
  	"billing_address_address_line1" varchar,
  	"billing_address_address_line2" varchar,
  	"billing_address_city" varchar,
  	"billing_address_state" varchar,
  	"billing_address_postal_code" varchar,
  	"billing_address_country" varchar,
  	"billing_address_phone" varchar,
  	"status" "enum_transactions_status" DEFAULT 'pending' NOT NULL,
  	"customer_id" uuid,
  	"customer_email" varchar,
  	"order_id" uuid,
  	"cart_id" uuid,
  	"amount" numeric,
  	"currency" "enum_transactions_currency" DEFAULT 'KRW',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "plans_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "invoices_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "prices_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscriptions_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "exchange_rate_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "currency_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "holidays_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_category_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_sub_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "product_drops_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "addresses_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "variants_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "variant_types_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "variant_options_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "products_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "carts_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "orders_id" uuid;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "transactions_id" uuid;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_payment_methods_parent_fk') THEN
      ALTER TABLE "plans_payment_methods" ADD CONSTRAINT "plans_payment_methods_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_features_parent_id_fk') THEN
      ALTER TABLE "plans_features" ADD CONSTRAINT "plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_payment_method_currency_id_currency_id_fk') THEN
      ALTER TABLE "invoices_payment_method" ADD CONSTRAINT "invoices_payment_method_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_payment_method_parent_id_fk') THEN
      ALTER TABLE "invoices_payment_method" ADD CONSTRAINT "invoices_payment_method_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_client_id_users_id_fk') THEN
      ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_subscription_id_subscriptions_id_fk') THEN
      ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_plan_id_plans_id_fk') THEN
      ALTER TABLE "invoices" ADD CONSTRAINT "invoices_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_price_id_prices_id_fk') THEN
      ALTER TABLE "invoices" ADD CONSTRAINT "invoices_price_id_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_currency_id_currency_id_fk') THEN
      ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prices_plan_id_plans_id_fk') THEN
      ALTER TABLE "prices" ADD CONSTRAINT "prices_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prices_currency_id_currency_id_fk') THEN
      ALTER TABLE "prices" ADD CONSTRAINT "prices_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_users_id_fk') THEN
      ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_id_plans_id_fk') THEN
      ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_price_id_prices_id_fk') THEN
      ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_price_id_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_currency_id_currency_id_fk') THEN
      ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exchange_rate_rates_currency_id_currency_id_fk') THEN
      ALTER TABLE "exchange_rate_rates" ADD CONSTRAINT "exchange_rate_rates_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exchange_rate_rates_parent_id_fk') THEN
      ALTER TABLE "exchange_rate_rates" ADD CONSTRAINT "exchange_rate_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."exchange_rate"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'holidays_dates_parent_id_fk') THEN
      ALTER TABLE "holidays_dates" ADD CONSTRAINT "holidays_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."holidays"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_drops_hero_media_id_media_id_fk') THEN
      ALTER TABLE "product_drops" ADD CONSTRAINT "product_drops_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addresses_customer_id_users_id_fk') THEN
      ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'variants_product_id_products_id_fk') THEN
      ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'variants_rels_parent_fk') THEN
      ALTER TABLE "variants_rels" ADD CONSTRAINT "variants_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'variants_rels_variant_options_fk') THEN
      ALTER TABLE "variants_rels" ADD CONSTRAINT "variants_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_variants_v_parent_id_variants_id_fk') THEN
      ALTER TABLE "_variants_v" ADD CONSTRAINT "_variants_v_parent_id_variants_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_variants_v_version_product_id_products_id_fk') THEN
      ALTER TABLE "_variants_v" ADD CONSTRAINT "_variants_v_version_product_id_products_id_fk" FOREIGN KEY ("version_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_variants_v_rels_parent_fk') THEN
      ALTER TABLE "_variants_v_rels" ADD CONSTRAINT "_variants_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_variants_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_variants_v_rels_variant_options_fk') THEN
      ALTER TABLE "_variants_v_rels" ADD CONSTRAINT "_variants_v_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'variant_options_variant_type_id_variant_types_id_fk') THEN
      ALTER TABLE "variant_options" ADD CONSTRAINT "variant_options_variant_type_id_variant_types_id_fk" FOREIGN KEY ("variant_type_id") REFERENCES "public"."variant_types"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_parent_fk') THEN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_variant_types_fk') THEN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_parent_id_products_id_fk') THEN
      ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_rels_parent_fk') THEN
      ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_rels_variant_types_fk') THEN
      ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_items_product_id_products_id_fk') THEN
      ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_items_variant_id_variants_id_fk') THEN
      ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_items_parent_id_fk') THEN
      ALTER TABLE "carts_items" ADD CONSTRAINT "carts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_customer_id_users_id_fk') THEN
      ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_items_product_id_products_id_fk') THEN
      ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_items_variant_id_variants_id_fk') THEN
      ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_items_parent_id_fk') THEN
      ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customer_id_users_id_fk') THEN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_rels_parent_fk') THEN
      ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_rels_transactions_fk') THEN
      ALTER TABLE "orders_rels" ADD CONSTRAINT "orders_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_items_product_id_products_id_fk') THEN
      ALTER TABLE "transactions_items" ADD CONSTRAINT "transactions_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_items_variant_id_variants_id_fk') THEN
      ALTER TABLE "transactions_items" ADD CONSTRAINT "transactions_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_items_parent_id_fk') THEN
      ALTER TABLE "transactions_items" ADD CONSTRAINT "transactions_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_customer_id_users_id_fk') THEN
      ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_order_id_orders_id_fk') THEN
      ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_cart_id_carts_id_fk') THEN
      ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "plans_payment_methods_order_idx" ON "plans_payment_methods" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "plans_payment_methods_parent_idx" ON "plans_payment_methods" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "plans_features_order_idx" ON "plans_features" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "plans_features_parent_id_idx" ON "plans_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "plans_name_idx" ON "plans" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "plans_sort_idx" ON "plans" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "plans_updated_at_idx" ON "plans" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "plans_created_at_idx" ON "plans" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "invoices_payment_method_order_idx" ON "invoices_payment_method" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "invoices_payment_method_parent_id_idx" ON "invoices_payment_method" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "invoices_payment_method_currency_idx" ON "invoices_payment_method" USING btree ("currency_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");
  CREATE INDEX IF NOT EXISTS "invoices_client_idx" ON "invoices" USING btree ("client_id");
  CREATE INDEX IF NOT EXISTS "invoices_subscription_idx" ON "invoices" USING btree ("subscription_id");
  CREATE INDEX IF NOT EXISTS "invoices_plan_idx" ON "invoices" USING btree ("plan_id");
  CREATE INDEX IF NOT EXISTS "invoices_price_idx" ON "invoices" USING btree ("price_id");
  CREATE INDEX IF NOT EXISTS "invoices_currency_idx" ON "invoices" USING btree ("currency_id");
  CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "invoices_updated_at_idx" ON "invoices" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "invoices_created_at_idx" ON "invoices" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "prices_plan_idx" ON "prices" USING btree ("plan_id");
  CREATE INDEX IF NOT EXISTS "prices_currency_idx" ON "prices" USING btree ("currency_id");
  CREATE INDEX IF NOT EXISTS "prices_active_idx" ON "prices" USING btree ("active");
  CREATE INDEX IF NOT EXISTS "prices_updated_at_idx" ON "prices" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "prices_created_at_idx" ON "prices" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan_id");
  CREATE INDEX IF NOT EXISTS "subscriptions_price_idx" ON "subscriptions" USING btree ("price_id");
  CREATE INDEX IF NOT EXISTS "subscriptions_currency_idx" ON "subscriptions" USING btree ("currency_id");
  CREATE INDEX IF NOT EXISTS "subscriptions_expires_at_idx" ON "subscriptions" USING btree ("expires_at");
  CREATE INDEX IF NOT EXISTS "subscriptions_subscription_status_idx" ON "subscriptions" USING btree ("subscription_status");
  CREATE INDEX IF NOT EXISTS "subscriptions_provider_idx" ON "subscriptions" USING btree ("provider");
  CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_payment_ref_idx" ON "subscriptions" USING btree ("payment_ref");
  CREATE INDEX IF NOT EXISTS "subscriptions_portone_transaction_ref_idx" ON "subscriptions" USING btree ("portone_transaction_ref");
  CREATE INDEX IF NOT EXISTS "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "exchange_rate_rates_order_idx" ON "exchange_rate_rates" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "exchange_rate_rates_parent_id_idx" ON "exchange_rate_rates" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "exchange_rate_rates_currency_idx" ON "exchange_rate_rates" USING btree ("currency_id");
  CREATE INDEX IF NOT EXISTS "exchange_rate_rates_rate_idx" ON "exchange_rate_rates" USING btree ("rate");
  CREATE UNIQUE INDEX IF NOT EXISTS "exchange_rate_date_idx" ON "exchange_rate" USING btree ("date");
  CREATE INDEX IF NOT EXISTS "exchange_rate_updated_at_idx" ON "exchange_rate" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "exchange_rate_created_at_idx" ON "exchange_rate" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "currency_name_idx" ON "currency" USING btree ("name");
  CREATE INDEX IF NOT EXISTS "currency_slug_key_idx" ON "currency" USING btree ("slug_key");
  CREATE INDEX IF NOT EXISTS "currency_hash_id_idx" ON "currency" USING btree ("hash_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "currency_kr_nm_idx" ON "currency" USING btree ("kr_nm");
  CREATE INDEX IF NOT EXISTS "currency_updated_at_idx" ON "currency" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "currency_created_at_idx" ON "currency" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "holidays_dates_order_idx" ON "holidays_dates" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "holidays_dates_parent_id_idx" ON "holidays_dates" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "holidays_dates_date_idx" ON "holidays_dates" USING btree ("date");
  CREATE INDEX IF NOT EXISTS "holidays_dates_name_idx" ON "holidays_dates" USING btree ("name");
  CREATE UNIQUE INDEX IF NOT EXISTS "holidays_period_idx" ON "holidays" USING btree ("period");
  CREATE INDEX IF NOT EXISTS "holidays_country_idx" ON "holidays" USING btree ("country");
  CREATE INDEX IF NOT EXISTS "holidays_updated_at_idx" ON "holidays" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "holidays_created_at_idx" ON "holidays" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_category_slug_idx" ON "product_category" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "product_category_sort_idx" ON "product_category" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "product_category_updated_at_idx" ON "product_category" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "product_category_created_at_idx" ON "product_category" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_sub_slug_idx" ON "product_sub" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "product_sub_updated_at_idx" ON "product_sub" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "product_sub_created_at_idx" ON "product_sub" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "product_drops_slug_idx" ON "product_drops" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "product_drops_active_idx" ON "product_drops" USING btree ("active");
  CREATE INDEX IF NOT EXISTS "product_drops_hero_media_idx" ON "product_drops" USING btree ("hero_media_id");
  CREATE INDEX IF NOT EXISTS "product_drops_sort_idx" ON "product_drops" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "product_drops_updated_at_idx" ON "product_drops" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "product_drops_created_at_idx" ON "product_drops" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "addresses_customer_idx" ON "addresses" USING btree ("customer_id");
  CREATE INDEX IF NOT EXISTS "addresses_updated_at_idx" ON "addresses" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "addresses_created_at_idx" ON "addresses" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "variants_product_idx" ON "variants" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "variants_updated_at_idx" ON "variants" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "variants_created_at_idx" ON "variants" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "variants_deleted_at_idx" ON "variants" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "variants__status_idx" ON "variants" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "variants_rels_order_idx" ON "variants_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "variants_rels_parent_idx" ON "variants_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "variants_rels_path_idx" ON "variants_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "variants_rels_variant_options_id_idx" ON "variants_rels" USING btree ("variant_options_id");
  CREATE INDEX IF NOT EXISTS "_variants_v_parent_idx" ON "_variants_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_product_idx" ON "_variants_v" USING btree ("version_product_id");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_updated_at_idx" ON "_variants_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_created_at_idx" ON "_variants_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_deleted_at_idx" ON "_variants_v" USING btree ("version_deleted_at");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version__status_idx" ON "_variants_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_variants_v_created_at_idx" ON "_variants_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_variants_v_updated_at_idx" ON "_variants_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_variants_v_snapshot_idx" ON "_variants_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_variants_v_published_locale_idx" ON "_variants_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_variants_v_latest_idx" ON "_variants_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_variants_v_autosave_idx" ON "_variants_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_variants_v_rels_order_idx" ON "_variants_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_variants_v_rels_parent_idx" ON "_variants_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_variants_v_rels_path_idx" ON "_variants_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_variants_v_rels_variant_options_id_idx" ON "_variants_v_rels" USING btree ("variant_options_id");
  CREATE INDEX IF NOT EXISTS "variant_types_updated_at_idx" ON "variant_types" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "variant_types_created_at_idx" ON "variant_types" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "variant_types_deleted_at_idx" ON "variant_types" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "variant_options__variantoptions_options_order_idx" ON "variant_options" USING btree ("_variantoptions_options_order");
  CREATE INDEX IF NOT EXISTS "variant_options_variant_type_idx" ON "variant_options" USING btree ("variant_type_id");
  CREATE INDEX IF NOT EXISTS "variant_options_updated_at_idx" ON "variant_options" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "variant_options_created_at_idx" ON "variant_options" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "variant_options_deleted_at_idx" ON "variant_options" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "products_deleted_at_idx" ON "products" USING btree ("deleted_at");
  CREATE INDEX IF NOT EXISTS "products__status_idx" ON "products" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "products_rels_variant_types_id_idx" ON "products_rels" USING btree ("variant_types_id");
  CREATE INDEX IF NOT EXISTS "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_deleted_at_idx" ON "_products_v" USING btree ("version_deleted_at");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version__status_idx" ON "_products_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_products_v_snapshot_idx" ON "_products_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_products_v_published_locale_idx" ON "_products_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_products_v_latest_idx" ON "_products_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_products_v_autosave_idx" ON "_products_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_products_v_rels_variant_types_id_idx" ON "_products_v_rels" USING btree ("variant_types_id");
  CREATE INDEX IF NOT EXISTS "carts_items_order_idx" ON "carts_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "carts_items_parent_id_idx" ON "carts_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "carts_items_product_idx" ON "carts_items" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "carts_items_variant_idx" ON "carts_items" USING btree ("variant_id");
  CREATE INDEX IF NOT EXISTS "carts_secret_idx" ON "carts" USING btree ("secret");
  CREATE INDEX IF NOT EXISTS "carts_customer_idx" ON "carts" USING btree ("customer_id");
  CREATE INDEX IF NOT EXISTS "carts_updated_at_idx" ON "carts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "carts_created_at_idx" ON "carts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "orders_items_variant_idx" ON "orders_items" USING btree ("variant_id");
  CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX IF NOT EXISTS "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "orders_rels_order_idx" ON "orders_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "orders_rels_parent_idx" ON "orders_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "orders_rels_path_idx" ON "orders_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "orders_rels_transactions_id_idx" ON "orders_rels" USING btree ("transactions_id");
  CREATE INDEX IF NOT EXISTS "transactions_items_order_idx" ON "transactions_items" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "transactions_items_parent_id_idx" ON "transactions_items" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "transactions_items_product_idx" ON "transactions_items" USING btree ("product_id");
  CREATE INDEX IF NOT EXISTS "transactions_items_variant_idx" ON "transactions_items" USING btree ("variant_id");
  CREATE INDEX IF NOT EXISTS "transactions_customer_idx" ON "transactions" USING btree ("customer_id");
  CREATE INDEX IF NOT EXISTS "transactions_order_idx" ON "transactions" USING btree ("order_id");
  CREATE INDEX IF NOT EXISTS "transactions_cart_idx" ON "transactions" USING btree ("cart_id");
  CREATE INDEX IF NOT EXISTS "transactions_updated_at_idx" ON "transactions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions" USING btree ("created_at");
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_plans_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plans_fk" FOREIGN KEY ("plans_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_invoices_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invoices_fk" FOREIGN KEY ("invoices_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_prices_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prices_fk" FOREIGN KEY ("prices_id") REFERENCES "public"."prices"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_subscriptions_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscriptions_fk" FOREIGN KEY ("subscriptions_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_exchange_rate_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exchange_rate_fk" FOREIGN KEY ("exchange_rate_id") REFERENCES "public"."exchange_rate"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_currency_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_currency_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currency"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_holidays_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_holidays_fk" FOREIGN KEY ("holidays_id") REFERENCES "public"."holidays"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_product_category_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_category_fk" FOREIGN KEY ("product_category_id") REFERENCES "public"."product_category"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_product_sub_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_sub_fk" FOREIGN KEY ("product_sub_id") REFERENCES "public"."product_sub"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_product_drops_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_drops_fk" FOREIGN KEY ("product_drops_id") REFERENCES "public"."product_drops"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_addresses_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_addresses_fk" FOREIGN KEY ("addresses_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_variants_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_variant_types_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_variant_options_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variant_options_fk" FOREIGN KEY ("variant_options_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_products_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_carts_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carts_fk" FOREIGN KEY ("carts_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_orders_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_transactions_fk') THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_transactions_fk" FOREIGN KEY ("transactions_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("plans_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_invoices_id_idx" ON "payload_locked_documents_rels" USING btree ("invoices_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_prices_id_idx" ON "payload_locked_documents_rels" USING btree ("prices_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("subscriptions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_exchange_rate_id_idx" ON "payload_locked_documents_rels" USING btree ("exchange_rate_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_currency_id_idx" ON "payload_locked_documents_rels" USING btree ("currency_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_holidays_id_idx" ON "payload_locked_documents_rels" USING btree ("holidays_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_category_id_idx" ON "payload_locked_documents_rels" USING btree ("product_category_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_sub_id_idx" ON "payload_locked_documents_rels" USING btree ("product_sub_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_product_drops_id_idx" ON "payload_locked_documents_rels" USING btree ("product_drops_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_addresses_id_idx" ON "payload_locked_documents_rels" USING btree ("addresses_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_variant_types_id_idx" ON "payload_locked_documents_rels" USING btree ("variant_types_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_variant_options_id_idx" ON "payload_locked_documents_rels" USING btree ("variant_options_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_carts_id_idx" ON "payload_locked_documents_rels" USING btree ("carts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("transactions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF to_regclass('public.plans_payment_methods') IS NOT NULL THEN
      ALTER TABLE "plans_payment_methods" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.plans_features') IS NOT NULL THEN
      ALTER TABLE "plans_features" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.plans') IS NOT NULL THEN
      ALTER TABLE "plans" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.invoices_payment_method') IS NOT NULL THEN
      ALTER TABLE "invoices_payment_method" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.invoices') IS NOT NULL THEN
      ALTER TABLE "invoices" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.prices') IS NOT NULL THEN
      ALTER TABLE "prices" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.subscriptions') IS NOT NULL THEN
      ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.exchange_rate_rates') IS NOT NULL THEN
      ALTER TABLE "exchange_rate_rates" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.exchange_rate') IS NOT NULL THEN
      ALTER TABLE "exchange_rate" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.currency') IS NOT NULL THEN
      ALTER TABLE "currency" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.holidays_dates') IS NOT NULL THEN
      ALTER TABLE "holidays_dates" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.holidays') IS NOT NULL THEN
      ALTER TABLE "holidays" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.product_category') IS NOT NULL THEN
      ALTER TABLE "product_category" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.product_sub') IS NOT NULL THEN
      ALTER TABLE "product_sub" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.product_drops') IS NOT NULL THEN
      ALTER TABLE "product_drops" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.addresses') IS NOT NULL THEN
      ALTER TABLE "addresses" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.variants') IS NOT NULL THEN
      ALTER TABLE "variants" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.variants_rels') IS NOT NULL THEN
      ALTER TABLE "variants_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public._variants_v') IS NOT NULL THEN
      ALTER TABLE "_variants_v" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public._variants_v_rels') IS NOT NULL THEN
      ALTER TABLE "_variants_v_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.variant_types') IS NOT NULL THEN
      ALTER TABLE "variant_types" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.variant_options') IS NOT NULL THEN
      ALTER TABLE "variant_options" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.products') IS NOT NULL THEN
      ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.products_rels') IS NOT NULL THEN
      ALTER TABLE "products_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public._products_v') IS NOT NULL THEN
      ALTER TABLE "_products_v" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public._products_v_rels') IS NOT NULL THEN
      ALTER TABLE "_products_v_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.carts_items') IS NOT NULL THEN
      ALTER TABLE "carts_items" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.carts') IS NOT NULL THEN
      ALTER TABLE "carts" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.orders_items') IS NOT NULL THEN
      ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
      ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.orders_rels') IS NOT NULL THEN
      ALTER TABLE "orders_rels" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.transactions_items') IS NOT NULL THEN
      ALTER TABLE "transactions_items" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DO $$ BEGIN
    IF to_regclass('public.transactions') IS NOT NULL THEN
      ALTER TABLE "transactions" DISABLE ROW LEVEL SECURITY;
    END IF;
  END $$;
  DROP TABLE IF EXISTS "plans_payment_methods" CASCADE;
  DROP TABLE IF EXISTS "plans_features" CASCADE;
  DROP TABLE IF EXISTS "plans" CASCADE;
  DROP TABLE IF EXISTS "invoices_payment_method" CASCADE;
  DROP TABLE IF EXISTS "invoices" CASCADE;
  DROP TABLE IF EXISTS "prices" CASCADE;
  DROP TABLE IF EXISTS "subscriptions" CASCADE;
  DROP TABLE IF EXISTS "exchange_rate_rates" CASCADE;
  DROP TABLE IF EXISTS "exchange_rate" CASCADE;
  DROP TABLE IF EXISTS "currency" CASCADE;
  DROP TABLE IF EXISTS "holidays_dates" CASCADE;
  DROP TABLE IF EXISTS "holidays" CASCADE;
  DROP TABLE IF EXISTS "product_category" CASCADE;
  DROP TABLE IF EXISTS "product_sub" CASCADE;
  DROP TABLE IF EXISTS "product_drops" CASCADE;
  DROP TABLE IF EXISTS "addresses" CASCADE;
  DROP TABLE IF EXISTS "variants" CASCADE;
  DROP TABLE IF EXISTS "variants_rels" CASCADE;
  DROP TABLE IF EXISTS "_variants_v" CASCADE;
  DROP TABLE IF EXISTS "_variants_v_rels" CASCADE;
  DROP TABLE IF EXISTS "variant_types" CASCADE;
  DROP TABLE IF EXISTS "variant_options" CASCADE;
  DROP TABLE IF EXISTS "products" CASCADE;
  DROP TABLE IF EXISTS "products_rels" CASCADE;
  DROP TABLE IF EXISTS "_products_v" CASCADE;
  DROP TABLE IF EXISTS "_products_v_rels" CASCADE;
  DROP TABLE IF EXISTS "carts_items" CASCADE;
  DROP TABLE IF EXISTS "carts" CASCADE;
  DROP TABLE IF EXISTS "orders_items" CASCADE;
  DROP TABLE IF EXISTS "orders" CASCADE;
  DROP TABLE IF EXISTS "orders_rels" CASCADE;
  DROP TABLE IF EXISTS "transactions_items" CASCADE;
  DROP TABLE IF EXISTS "transactions" CASCADE;
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_plans_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_invoices_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_prices_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscriptions_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_exchange_rate_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_currency_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_holidays_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_category_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_sub_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_product_drops_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_addresses_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_variants_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_variant_types_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_variant_options_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_products_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_carts_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_transactions_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_plans_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_invoices_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_prices_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_subscriptions_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_exchange_rate_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_currency_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_holidays_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_product_category_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_product_sub_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_product_drops_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_addresses_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_variants_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_variant_types_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_variant_options_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_products_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_carts_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_transactions_id_idx";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "plans_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "invoices_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "prices_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscriptions_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "exchange_rate_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "currency_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "holidays_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_category_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_sub_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "product_drops_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "addresses_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "variants_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "variant_types_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "variant_options_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "products_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "carts_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "orders_id";
  ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "transactions_id";
  DROP TYPE IF EXISTS "public"."enum_plans_payment_methods";
  DROP TYPE IF EXISTS "public"."enum_plans_tier";
  DROP TYPE IF EXISTS "public"."enum_plans_validity";
  DROP TYPE IF EXISTS "public"."enum_plans_type";
  DROP TYPE IF EXISTS "public"."enum_plans_state";
  DROP TYPE IF EXISTS "public"."enum_invoices_payment_method_method";
  DROP TYPE IF EXISTS "public"."enum_invoices_status";
  DROP TYPE IF EXISTS "public"."enum_prices_type";
  DROP TYPE IF EXISTS "public"."enum_prices_recurring_interval";
  DROP TYPE IF EXISTS "public"."enum_subscriptions_subscription_status";
  DROP TYPE IF EXISTS "public"."enum_subscriptions_request_method";
  DROP TYPE IF EXISTS "public"."enum_subscriptions_provider";
  DROP TYPE IF EXISTS "public"."enum_addresses_country";
  DROP TYPE IF EXISTS "public"."enum_variants_status";
  DROP TYPE IF EXISTS "public"."enum__variants_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__variants_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_products_status";
  DROP TYPE IF EXISTS "public"."enum__products_v_version_status";
  DROP TYPE IF EXISTS "public"."enum__products_v_published_locale";
  DROP TYPE IF EXISTS "public"."enum_carts_currency";
  DROP TYPE IF EXISTS "public"."enum_orders_status";
  DROP TYPE IF EXISTS "public"."enum_orders_currency";
  DROP TYPE IF EXISTS "public"."enum_transactions_status";
  DROP TYPE IF EXISTS "public"."enum_transactions_currency";`)
}
