import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// WHY-OVERRIDE-PAYLOAD: generated CREATE/DROP/ALTER statements are wrapped
// with IF NOT EXISTS / IF EXISTS / duplicate_object guards so this file can
// be re-run. See readmes/MIGRATIONS.md.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    CREATE TYPE "public"."enum_products_private_tier_gate" AS ENUM('anyone', 'resident', 'patron', 'cofounder', 'staff');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__products_v_version_private_tier_gate" AS ENUM('anyone', 'resident', 'patron', 'cofounder', 'staff');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "identity_locked" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "sku" varchar;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "label" varchar;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "option_key" varchar;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "barcode" varchar;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "weight_grams" numeric;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "length_mm" numeric;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "width_mm" numeric;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "height_mm" numeric;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "tax_category" varchar;
  ALTER TABLE IF EXISTS "variants" ADD COLUMN IF NOT EXISTS "sort" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_active" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_identity_locked" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_sku" varchar;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_label" varchar;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_option_key" varchar;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_barcode" varchar;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_weight_grams" numeric;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_length_mm" numeric;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_width_mm" numeric;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_height_mm" numeric;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_tax_category" varchar;
  ALTER TABLE IF EXISTS "_variants_v" ADD COLUMN IF NOT EXISTS "version_sort" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "name" varchar;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "slug" varchar;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "storefront" varchar DEFAULT 'lostinseoul';
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "drop_id" uuid;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "category_id" uuid;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "summary" varchar;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "description" jsonb;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "details" varchar;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "care" varchar;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "shipping_returns" varchar;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "hero_media_id" uuid;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "compare_at_amount" numeric;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "max_order_quantity" numeric DEFAULT 1;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "min_order_quantity" numeric DEFAULT 1;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "standard_enabled" boolean DEFAULT true;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "request_to_order_enabled" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "private_order_enabled" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "private_preset_price_enabled" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "private_unit_amount" numeric;
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "private_tier_gate" "enum_products_private_tier_gate" DEFAULT 'anyone';
  ALTER TABLE IF EXISTS "products" ADD COLUMN IF NOT EXISTS "sort" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "products_rels" ADD COLUMN IF NOT EXISTS "media_id" uuid;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_name" varchar;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_slug" varchar;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_active" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_storefront" varchar DEFAULT 'lostinseoul';
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_drop_id" uuid;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_category_id" uuid;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_summary" varchar;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_description" jsonb;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_details" varchar;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_care" varchar;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_shipping_returns" varchar;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_hero_media_id" uuid;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_compare_at_amount" numeric;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_max_order_quantity" numeric DEFAULT 1;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_min_order_quantity" numeric DEFAULT 1;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_standard_enabled" boolean DEFAULT true;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_request_to_order_enabled" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_private_order_enabled" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_private_preset_price_enabled" boolean DEFAULT false;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_private_unit_amount" numeric;
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_private_tier_gate" "enum__products_v_version_private_tier_gate" DEFAULT 'anyone';
  ALTER TABLE IF EXISTS "_products_v" ADD COLUMN IF NOT EXISTS "version_sort" numeric DEFAULT 0;
  ALTER TABLE IF EXISTS "_products_v_rels" ADD COLUMN IF NOT EXISTS "media_id" uuid;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_drop_id_product_drops_id_fk') THEN
      ALTER TABLE "products" ADD CONSTRAINT "products_drop_id_product_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "public"."product_drops"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_product_category_id_fk') THEN
      ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_category"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_hero_media_id_media_id_fk') THEN
      ALTER TABLE "products" ADD CONSTRAINT "products_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_media_fk') THEN
      ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_version_drop_id_product_drops_id_fk') THEN
      ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_drop_id_product_drops_id_fk" FOREIGN KEY ("version_drop_id") REFERENCES "public"."product_drops"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_version_category_id_product_category_id_fk') THEN
      ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_category_id_product_category_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."product_category"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_version_hero_media_id_media_id_fk') THEN
      ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
  END $$;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_products_v_rels_media_fk') THEN
      ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE INDEX IF NOT EXISTS "variants_active_idx" ON "variants" USING btree ("active");
  CREATE UNIQUE INDEX IF NOT EXISTS "variants_sku_idx" ON "variants" USING btree ("sku");
  CREATE UNIQUE INDEX IF NOT EXISTS "variants_option_key_idx" ON "variants" USING btree ("option_key");
  CREATE UNIQUE INDEX IF NOT EXISTS "variants_barcode_idx" ON "variants" USING btree ("barcode");
  CREATE INDEX IF NOT EXISTS "variants_sort_idx" ON "variants" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_active_idx" ON "_variants_v" USING btree ("version_active");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_sku_idx" ON "_variants_v" USING btree ("version_sku");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_option_key_idx" ON "_variants_v" USING btree ("version_option_key");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_barcode_idx" ON "_variants_v" USING btree ("version_barcode");
  CREATE INDEX IF NOT EXISTS "_variants_v_version_version_sort_idx" ON "_variants_v" USING btree ("version_sort");
  CREATE UNIQUE INDEX IF NOT EXISTS "products_name_idx" ON "products" USING btree ("name");
  CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "products_active_idx" ON "products" USING btree ("active");
  CREATE INDEX IF NOT EXISTS "products_storefront_idx" ON "products" USING btree ("storefront");
  CREATE INDEX IF NOT EXISTS "products_drop_idx" ON "products" USING btree ("drop_id");
  CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "products_hero_media_idx" ON "products" USING btree ("hero_media_id");
  CREATE INDEX IF NOT EXISTS "products_max_order_quantity_idx" ON "products" USING btree ("max_order_quantity");
  CREATE INDEX IF NOT EXISTS "products_min_order_quantity_idx" ON "products" USING btree ("min_order_quantity");
  CREATE INDEX IF NOT EXISTS "products_standard_enabled_idx" ON "products" USING btree ("standard_enabled");
  CREATE INDEX IF NOT EXISTS "products_request_to_order_enabled_idx" ON "products" USING btree ("request_to_order_enabled");
  CREATE INDEX IF NOT EXISTS "products_private_order_enabled_idx" ON "products" USING btree ("private_order_enabled");
  CREATE INDEX IF NOT EXISTS "products_private_tier_gate_idx" ON "products" USING btree ("private_tier_gate");
  CREATE INDEX IF NOT EXISTS "products_sort_idx" ON "products" USING btree ("sort");
  CREATE INDEX IF NOT EXISTS "products_rels_media_id_idx" ON "products_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_name_idx" ON "_products_v" USING btree ("version_name");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_active_idx" ON "_products_v" USING btree ("version_active");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_storefront_idx" ON "_products_v" USING btree ("version_storefront");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_drop_idx" ON "_products_v" USING btree ("version_drop_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_category_idx" ON "_products_v" USING btree ("version_category_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_hero_media_idx" ON "_products_v" USING btree ("version_hero_media_id");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_max_order_quantity_idx" ON "_products_v" USING btree ("version_max_order_quantity");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_min_order_quantity_idx" ON "_products_v" USING btree ("version_min_order_quantity");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_standard_enabled_idx" ON "_products_v" USING btree ("version_standard_enabled");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_request_to_order_enabled_idx" ON "_products_v" USING btree ("version_request_to_order_enabled");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_private_order_enabled_idx" ON "_products_v" USING btree ("version_private_order_enabled");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_private_tier_gate_idx" ON "_products_v" USING btree ("version_private_tier_gate");
  CREATE INDEX IF NOT EXISTS "_products_v_version_version_sort_idx" ON "_products_v" USING btree ("version_sort");
  CREATE INDEX IF NOT EXISTS "_products_v_rels_media_id_idx" ON "_products_v_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "products" DROP CONSTRAINT IF EXISTS "products_drop_id_product_drops_id_fk";
  
  ALTER TABLE IF EXISTS "products" DROP CONSTRAINT IF EXISTS "products_category_id_product_category_id_fk";
  
  ALTER TABLE IF EXISTS "products" DROP CONSTRAINT IF EXISTS "products_hero_media_id_media_id_fk";
  
  ALTER TABLE IF EXISTS "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_media_fk";
  
  ALTER TABLE IF EXISTS "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_drop_id_product_drops_id_fk";
  
  ALTER TABLE IF EXISTS "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_category_id_product_category_id_fk";
  
  ALTER TABLE IF EXISTS "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_hero_media_id_media_id_fk";
  
  ALTER TABLE IF EXISTS "_products_v_rels" DROP CONSTRAINT IF EXISTS "_products_v_rels_media_fk";
  
  DROP INDEX IF EXISTS "variants_active_idx";
  DROP INDEX IF EXISTS "variants_sku_idx";
  DROP INDEX IF EXISTS "variants_option_key_idx";
  DROP INDEX IF EXISTS "variants_barcode_idx";
  DROP INDEX IF EXISTS "variants_sort_idx";
  DROP INDEX IF EXISTS "_variants_v_version_version_active_idx";
  DROP INDEX IF EXISTS "_variants_v_version_version_sku_idx";
  DROP INDEX IF EXISTS "_variants_v_version_version_option_key_idx";
  DROP INDEX IF EXISTS "_variants_v_version_version_barcode_idx";
  DROP INDEX IF EXISTS "_variants_v_version_version_sort_idx";
  DROP INDEX IF EXISTS "products_name_idx";
  DROP INDEX IF EXISTS "products_slug_idx";
  DROP INDEX IF EXISTS "products_active_idx";
  DROP INDEX IF EXISTS "products_storefront_idx";
  DROP INDEX IF EXISTS "products_drop_idx";
  DROP INDEX IF EXISTS "products_category_idx";
  DROP INDEX IF EXISTS "products_hero_media_idx";
  DROP INDEX IF EXISTS "products_max_order_quantity_idx";
  DROP INDEX IF EXISTS "products_min_order_quantity_idx";
  DROP INDEX IF EXISTS "products_standard_enabled_idx";
  DROP INDEX IF EXISTS "products_request_to_order_enabled_idx";
  DROP INDEX IF EXISTS "products_private_order_enabled_idx";
  DROP INDEX IF EXISTS "products_private_tier_gate_idx";
  DROP INDEX IF EXISTS "products_sort_idx";
  DROP INDEX IF EXISTS "products_rels_media_id_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_name_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_slug_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_active_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_storefront_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_drop_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_category_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_hero_media_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_max_order_quantity_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_min_order_quantity_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_standard_enabled_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_request_to_order_enabled_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_private_order_enabled_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_private_tier_gate_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_sort_idx";
  DROP INDEX IF EXISTS "_products_v_rels_media_id_idx";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "active";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "identity_locked";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "sku";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "label";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "option_key";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "barcode";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "weight_grams";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "length_mm";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "width_mm";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "height_mm";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "tax_category";
  ALTER TABLE IF EXISTS "variants" DROP COLUMN IF EXISTS "sort";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_active";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_identity_locked";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_sku";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_label";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_option_key";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_barcode";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_weight_grams";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_length_mm";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_width_mm";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_height_mm";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_tax_category";
  ALTER TABLE IF EXISTS "_variants_v" DROP COLUMN IF EXISTS "version_sort";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "name";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "slug";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "active";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "storefront";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "drop_id";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "category_id";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "summary";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "description";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "details";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "care";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "shipping_returns";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "hero_media_id";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "compare_at_amount";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "max_order_quantity";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "min_order_quantity";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "standard_enabled";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "request_to_order_enabled";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "private_order_enabled";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "private_preset_price_enabled";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "private_unit_amount";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "private_tier_gate";
  ALTER TABLE IF EXISTS "products" DROP COLUMN IF EXISTS "sort";
  ALTER TABLE IF EXISTS "products_rels" DROP COLUMN IF EXISTS "media_id";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_name";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_slug";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_active";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_storefront";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_drop_id";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_category_id";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_summary";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_description";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_details";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_care";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_shipping_returns";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_hero_media_id";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_compare_at_amount";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_max_order_quantity";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_min_order_quantity";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_standard_enabled";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_request_to_order_enabled";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_private_order_enabled";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_private_preset_price_enabled";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_private_unit_amount";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_private_tier_gate";
  ALTER TABLE IF EXISTS "_products_v" DROP COLUMN IF EXISTS "version_sort";
  ALTER TABLE IF EXISTS "_products_v_rels" DROP COLUMN IF EXISTS "media_id";
  DROP TYPE IF EXISTS "public"."enum_products_private_tier_gate";
  DROP TYPE IF EXISTS "public"."enum__products_v_version_private_tier_gate";`)
}
