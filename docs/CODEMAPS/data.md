<!-- Generated: 2026-11-02 | Files scanned: 2221 | Token estimate: ~770 -->
# Data

Postgres via `@payloadcms/db-postgres`. UUID v7. `push: false`. **Active migration dir:** `src/lib/migrations-baseline` (`payload.config.ts`). Older chain `src/lib/migrations` (55 files, through `99999999_000000_initial_seed`) is not the configured dir.

## Live collections

Registered in `src/payload/collections/index.ts`, then `Admins` in config:

`users`, `assets`, `categories`, `media`, `tags`, `notifications`, `pages`, `posts`, `userMedia`, `email-quota`, `deferred-emails`, `profile`, `albums`, `tracks`, `playlists`, `follows`, `bookmarks`, `userViews`, `surf`, `citations`, `comments`, `compilations`, `admins` (deprecated).

Plugin-added (enabled):

```
membership     plans, prices, subscriptions, invoices, exchange-rate, currency, holidays
merchandising  product-category, product-sub, product-drops
ecommerce      products, variants, carts, orders, transactions  (plugin defaults + overrides)
better-auth    sessions, accounts, verifications (+ passkey / twoFactor tables)
search         search
redirects      redirects
locker/likes/comments   field or join collections those plugins declare
```

## Present in source, not in the live config

```
InventoryPlugin enabled:false
  stock-locations, inventory-levels, inventory-movements, inventory-lots,
  inventory-receipts, inventory-receipt-lines, inventory-cycle-counts,
  inventory-cycle-count-lines, inventory-reservations,
  inventory-reservation-entries, inventory-reservation-operator-events
TicketingPlugin not imported by plugins/index.ts
  events, ticket-orders, tickets
Unreferenced by plugins/index.ts or collections/index.ts
  commerce-commands, commerce-provider-events, coupons,
  product-order-campaigns, artists, occupations, exMedia
  src/payload/collections/(consumption)/Products  (slug "products"; ecommerce override is the live one)
```

Tests under `src/lib/lost-commerce/*.postgres.test.ts` pass those configs into a harness. They are not proof the boot config mounts them.

## Relationships (live)

```
users 1—* posts, surf, profile, bookmarks, follows, citations, comments, notifications
users 1—* carts, orders            (ecommerce customers.slug = "users")
products 1—* variants
carts *—* variants                 (cart lines)
orders 1—* transactions            (PortOne payment method)
plans 1—* prices 1—* subscriptions
posts|pages|surf|profile|tracks|playlists|albums → search docs
media|userMedia|assets             uploads + blur data URLs
```

## Active migrations (`migrations-baseline`)

```
20260815_102815
20260827_040141_ecommerce_plugin
20260830_153450_catalog_overrides
20260830_165103_cart_overrides
20260830_172932_portone_adapter
20260830_173500_portone_payment_id_unique
20260830_175903_order_overrides
20260831_011714_commerce_cutover
20260831_063800_array_item_ids
20260831_120000_uncategorized_category
```

Seeds: `src/seed/initial.ts` captured into SQL via `pnpm seed:rebuild`. Do not `payload.create` inside `onInit` (deadlocks). Procedure: `readmes/MIGRATIONS.md`.
