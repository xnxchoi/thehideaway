# Ecommerce ownership

Catalog, cart, order, and transaction primitives belong to
`@payloadcms/plugin-ecommerce`. The warehouse ledger owns stock. Membership
billing and ticketing stay separate.

| Owner | Collections | Notes |
|---|---|---|
| Official plugin | `products`, `variants`, `variantTypes`, `variantOptions`, `carts`, `orders`, `transactions`, `addresses` | Registered via `src/payload/plugins/ecommerce/plugin.ts`. Plugin `inventory` is off. |
| Merchandising plugin | `product-category`, `product-sub`, `product-drops` | Storefront taxonomy and drops. Campaigns stay unregistered until they point at plugin `products`. |
| Inventory plugin | `stock-locations`, `inventory-*` | Ledger, lots, receipts, cycle counts, reservations. Disabled until relations retarget plugin `variants`. |
| Membership plugin | `plans`, `prices`, `subscriptions`, `invoices`, `currency`, `exchange-rate`, `holidays` | Digital membership only. Not product checkout. |
| Ticketing plugin | `events`, `ticket-orders`, `tickets` | Unrelated to storefront checkout. |
| Live transitional catalog | `commerce-products`, `commerce-orders` | Minimal KRW shop still registered in `src/payload/collections/index.ts` until the plugin cutover retires it. |

Do not register the proprietary `products` / `product-variants` / `product-carts` /
`product-orders` / `product-payments` collections. Those slugs collide with the
official plugin (`products`) or are replaced by `variants` / `carts` / `orders` /
`transactions`.

Plugin `products` / `variants` now carry LOSTINSEOUL catalog fields via
`productsCollectionOverride` and `variantsCollectionOverride` (name, slug, storefront,
modes, SKU identity). Prices stay on plugin `priceInKRW` fields, not `unit_amount`.
Warehouse `inventory` remains off. `/lostinseoul` home can query `products`; PDP may
still read `commerce-products` until the frontend cutover.

Schema migration: `src/lib/migrations-baseline/20260827_040141_ecommerce_plugin.ts`.
`payload migrate:status` currently reports the baseline files as unapplied on
DBs that were migrated through `src/lib/migrations`. Do not `migrate:fresh`
against a DB you care about without confirming which migration set it uses.
