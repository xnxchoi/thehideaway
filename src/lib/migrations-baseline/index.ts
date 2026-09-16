import * as migration_20260815_102815 from './20260815_102815';
import * as migration_20260827_040141_ecommerce_plugin from './20260827_040141_ecommerce_plugin';
import * as migration_20260830_153450_catalog_overrides from './20260830_153450_catalog_overrides';
import * as migration_20260830_165103_cart_overrides from './20260830_165103_cart_overrides';
import * as migration_20260830_172932_portone_adapter from './20260830_172932_portone_adapter';
import * as migration_20260830_173500_portone_payment_id_unique from './20260830_173500_portone_payment_id_unique';
import * as migration_20260830_175903_order_overrides from './20260830_175903_order_overrides';
import * as migration_20260831_011714_commerce_cutover from './20260831_011714_commerce_cutover';
import * as migration_20260831_063800_array_item_ids from './20260831_063800_array_item_ids';
import * as migration_20260831_120000_uncategorized_category from './20260831_120000_uncategorized_category';
import * as migration_20260914_012723_checkout_durable_purchase from './20260914_012723_checkout_durable_purchase';
import * as migration_20260914_073802_commerce_command_journal from './20260914_073802_commerce_command_journal';
import * as migration_20260916_074244_address_countries from './20260916_074244_address_countries';

export const migrations = [
  {
    up: migration_20260815_102815.up,
    down: migration_20260815_102815.down,
    name: '20260815_102815',
  },
  {
    up: migration_20260827_040141_ecommerce_plugin.up,
    down: migration_20260827_040141_ecommerce_plugin.down,
    name: '20260827_040141_ecommerce_plugin',
  },
  {
    up: migration_20260830_153450_catalog_overrides.up,
    down: migration_20260830_153450_catalog_overrides.down,
    name: '20260830_153450_catalog_overrides',
  },
  {
    up: migration_20260830_165103_cart_overrides.up,
    down: migration_20260830_165103_cart_overrides.down,
    name: '20260830_165103_cart_overrides',
  },
  {
    up: migration_20260830_172932_portone_adapter.up,
    down: migration_20260830_172932_portone_adapter.down,
    name: '20260830_172932_portone_adapter',
  },
  {
    up: migration_20260830_173500_portone_payment_id_unique.up,
    down: migration_20260830_173500_portone_payment_id_unique.down,
    name: '20260830_173500_portone_payment_id_unique',
  },
  {
    up: migration_20260830_175903_order_overrides.up,
    down: migration_20260830_175903_order_overrides.down,
    name: '20260830_175903_order_overrides',
  },
  {
    up: migration_20260831_011714_commerce_cutover.up,
    down: migration_20260831_011714_commerce_cutover.down,
    name: '20260831_011714_commerce_cutover',
  },
  {
    up: migration_20260831_063800_array_item_ids.up,
    down: migration_20260831_063800_array_item_ids.down,
    name: '20260831_063800_array_item_ids',
  },
  {
    up: migration_20260831_120000_uncategorized_category.up,
    down: migration_20260831_120000_uncategorized_category.down,
    name: '20260831_120000_uncategorized_category',
  },
  {
    up: migration_20260914_012723_checkout_durable_purchase.up,
    down: migration_20260914_012723_checkout_durable_purchase.down,
    name: '20260914_012723_checkout_durable_purchase',
  },
  {
    up: migration_20260914_073802_commerce_command_journal.up,
    down: migration_20260914_073802_commerce_command_journal.down,
    name: '20260914_073802_commerce_command_journal',
  },
  {
    up: migration_20260916_074244_address_countries.up,
    down: migration_20260916_074244_address_countries.down,
    name: '20260916_074244_address_countries'
  },
];
