# Ecommerce

Catalog, cart, order, and transaction primitives belong to
`@payloadcms/plugin-ecommerce@3.88.0` (pin to the Payload 3.x release; do not
float `latest`). The warehouse ledger owns stock. Membership billing and
ticketing stay separate.

Plugin config: `src/payload/plugins/ecommerce/plugin.ts`, registered from
`src/payload/plugins/index.ts` as `hideawayEcommercePlugin`.

---

## Status (handoff)

| Phase | What | State | Commit |
|---|---|---|---|
| 0 | Split membership / merchandising / inventory plugins; this doc | **Done** | with 1–8 |
| 1 | Install plugin, UUID schema, `inventory: false`, KRW default | **Done** | with 1–8 |
| 2 | Product + variant overrides (modes, SKU lock, storefront fields) | **Done** | with 1–8 |
| 3 | Guest carts + `cartItemMatcher` (product/variant/mode/campaign) | **Done** | with 1–8 |
| 4 | PortOne `PaymentAdapter` (`/api/payments/portone/*`) | **Done** | with 1–8 |
| 5 | Order/transaction overrides + reservation hooks (ledger still off) | **Done** | with 1–8 |
| 6 | Seed/cutover onto plugin `products`/`variants`; drop `commerce-*` | **Done** | with 1–8 |
| 7 | Storefront `LostEcommerceProvider` + `useStoreCart` over plugin `useCart` | **Done** | with 1–8 |
| 8 | Retire proprietary product HTTP and collections | **Done** | `73d7e516` |
| 9 | Staging prove + nginx allowlist + PortOne **sandbox** webhook | **Not started** | — |

`f0e4a7b2` is a local `/lostinseoul` restore (hero import, chrome context, scroll
camera, footer shader). It is **not** Phase 9.

Do not start Phase 9 on a dirty working tree. Instant UI / storefront file
moves are a different session. Do not mix them with nginx or PortOne.

---

## Constraints (do not violate)

- Do **not** fold membership (`plans` / `prices` / `subscriptions` / invoices)
  or ticketing into the plugin.
- Do **not** enable plugin inventory (`inventory: false` stays).
- Do **not** set `InventoryPlugin({ enabled: true })` and do **not** retarget
  reservation FKs (`product-orders` / `product-variants`) unless asked. Those
  collections are unregistered; the ledger is dormant on purpose.
- Keep storefront UX. Do not import the official ecommerce template UI.
- PortOne is the product payment rail. Do not add Stripe for launch.
- Multi-currency: KRW (default, `decimals: 0`), USD, JPY (`decimals: 0`), EUR.
  Prices live on plugin `priceIn{CODE}` fields, not `unit_amount`.
- Customers are Better Auth `users` (`customers.slug = "users"`).
- Guest carts on. Cart localStorage key: `lostinseoul.plugin-cart`.
- next-intl owns every user-facing string.
- UUID Postgres, `push: false`, `migrationDir` =
  `src/lib/migrations-baseline`. Migrations must be idempotent
  (`readmes/MIGRATIONS.md`). Array-item IDs stay 24-char strings.
- Official plugin owns slug `products`. Never register a second `products`
  collection.

---

## Ownership

| Owner | Collections | Notes |
|---|---|---|
| Official plugin | `products`, `variants`, `variantTypes`, `variantOptions`, `carts`, `orders`, `transactions`, `addresses` | `src/payload/plugins/ecommerce/plugin.ts`. Plugin `inventory` is off. |
| Merchandising plugin | `product-category`, `product-sub`, `product-drops` | `MerchandisingPlugin({ enabled: true })`. Campaigns stay **unregistered** until they point at plugin `products`. |
| Inventory plugin | `stock-locations`, `inventory-*` | Ledger, lots, receipts, cycle counts, reservations. **`enabled: false`**. |
| Membership plugin | `plans`, `prices`, `subscriptions`, `invoices`, `currency`, `exchange-rate`, `holidays` | Digital membership only. Not product checkout. |
| Ticketing plugin | `events`, `ticket-orders`, `tickets` | Unrelated to storefront checkout. |

Do not register proprietary `products` / `product-variants` / `product-carts` /
`product-orders` / `product-payments`. Those slugs collide with the plugin or
were replaced by `variants` / `carts` / `orders` / `transactions`.

`commerce-products` / `commerce-orders` are retired (Phase 8). Live source must
not mention those slugs except `proxy.ts` (410) and the retirement test.

---

## HTTP

| Path | Role |
|---|---|
| `/api/carts/` | Plugin cart documents (add/update/remove/clear) |
| `/api/payments/portone/initiate` | Product checkout initiate (server amounts) |
| `/api/payments/portone/confirm-order` | Product checkout confirm |
| `/api/payments/portone/webhooks` | **Product** PortOne webhook. Gate-exempt in `src/proxy.ts`. |
| `/api/lost/webhooks/portone` | **Membership** PortOne webhook. Keep. `noticeUrls` for plans still point here. |
| `/api/lost/gate` | Storefront password gate |
| `/api/invoice`, `/api/lost/cart`, `/api/lost/checkout`, `/api/commerce` | Retired. `src/proxy.ts` returns **410**. |

Production nginx on `$is_lostinseoul_host` currently allows `/api/auth/`,
`/api/health`, `/api/lost/`, `/api/commerce/`, and 404s generic `/api/`.
`/api/carts/` and `/api/payments/` are **not** on that allowlist. That is the
Phase 9 nginx gap. `/vault/` stays 404 on the LOST host.

---

## Client wiring

- Layout wraps `LostEcommerceProvider`
  (`src/payload/plugins/ecommerce/client/provider.tsx`): KRW, variants on,
  PortOne method, Better Auth `onLogin`/`onLogout` merge.
- Storefront lines go through `useStoreCart` (`src/lib/lost-commerce/useStoreCart.tsx`),
  an adapter over plugin `useCart`. Do not re-export or shadow `useCart`.
  See `src/lostinseoul/NAMING.md`.
- Identifier names vs plugin/site hooks: `src/lostinseoul/NAMING.md`.
- Storefront chrome (bag/search/entry) is React context in
  `src/lostinseoul/page-status.tsx`, not a CustomEvent bus and not prop drilling.

---

## Phases (what landed)

### 0 — Split

`MembershipPlugin` is billing-only. Catalog merchandising is
`MerchandisingPlugin`. Inventory is its own plugin and stays disabled.

### 1 — Schema

Plugin collections exist in generated types. Currencies KRW/USD/EUR/JPY.
Migration: `src/lib/migrations-baseline/20260827_040141_ecommerce_plugin.ts`.

Local DBs were rebuilt with `migrate:fresh` during this work (accepted
downtime). Do not `migrate:fresh` a DB you care about without confirming it
uses `migrations-baseline`.

### 2 — Catalog overrides

`productsCollectionOverride` / `variantsCollectionOverride`: name, slug,
storefront, drop, category, copy blocks, mode flags, private-tier, qty limits,
SKU identity (`sku`, `option_key`, `identity_locked`). Validation:
`hideawayProductsValidation`. Migration:
`20260830_153450_catalog_overrides.ts`.

### 3 — Carts

`allowGuestCarts: true`. Extra line fields for mode/campaign snapshots.
`lostCartItemMatcher` keeps same SKU + two modes as two lines. Migration:
`20260830_165103_cart_overrides.ts`.

### 4 — PortOne adapter

`src/payload/plugins/ecommerce/portone/`. Never trust client amounts.
Webhook at `/api/payments/portone/webhooks`. Migrations:
`20260830_172932_portone_adapter.ts`,
`20260830_173500_portone_payment_id_unique.ts`.

### 5 — Orders / transactions

Extra order fields: `order_ref`, lifecycle, payment/fulfillment, campaign,
quote. Plugin `status` is the coarse state; LOSTINSEOUL lifecycle stays on
extra fields. Reservation commit/release code exists but the inventory
collections are unregistered, so this is dormant until InventoryPlugin is
enabled. Migration: `20260830_175903_order_overrides.ts`.

### 6 — Data cutover

Seeds write plugin `products` + `variants` + `priceInKRW`.
`CommerceProducts` / `CommerceOrders` unregistered. Idempotent SQL copied
then `DROP IF EXISTS`. Migration: `20260831_011714_commerce_cutover.ts`.
Array-item IDs: `20260831_063800_array_item_ids.ts`.

`product-order-campaigns` is **not** registered. Catalog queries must no-op
when the collection is absent (`src/lib/lost-commerce/queries.ts`).

### 7 — Frontend cutover

RSC still fetches catalog. Client islands use the plugin provider.
Fragrance CTA uses the same `useStoreCart`. `transpilePackages` includes
`@payloadcms/plugin-ecommerce`.

### 8 — Retirement

Attic'd / deleted live trees:

- `app/api/lost/cart/`, `app/api/lost/checkout/`, `app/api/commerce/`
- `lib/commerce/`
- `payload/collections/commerce/`
- `ProductCarts` / `ProductOrders` / `ProductPayments`

Guard: `src/payload/plugins/ecommerce/retire-proprietary.test.ts`.
Keep `src/lib/lost-commerce/` inventory helpers and membership PortOne
verify. Keep `/api/lost/webhooks/portone`.

### 9 — Deploy (next, not started)

This is **not** a production PortOne dashboard click.

1. Triage any dirty working tree (commit / stash / revert). Do not mix.
2. Prove `/lostinseoul` on staging from a clean `main` (catalog, PDP add,
   overlay, checkout initiate). Local restore was `f0e4a7b2`; production was
   previously a white screen / 404 path.
3. Nginx on `$is_lostinseoul_host` only: allow `/api/carts/` and
   `/api/payments/` the same way `/api/lost/` is allowed. Leave `/vault/` and
   generic `/api/` as 404 on that host. `/api/commerce/` can stay (410 from
   the app) or be dropped later; do not rely on it.
4. Point **sandbox** PortOne `noticeUrls` for **product** payments at
   `https://<public-origin>/api/payments/portone/webhooks`. Do not retarget
   membership plan webhooks; those stay `/api/lost/webhooks/portone`.
5. One sandbox payment. Confirm transaction + order rows. Confirm reservation
   expiry job is still scheduled (no-op while inventory is unregistered).
6. Only after that: production PortOne credentials / live webhook.

Rollback: previous image. Policy says the DB is wipeable; treat ecommerce
enablement as a staging `migrate:fresh` first if schema is in doubt.

Env: existing PortOne keys. No Stripe keys.

---

## File map

| Path | Role |
|---|---|
| `src/payload/plugins/ecommerce/plugin.ts` | Plugin config |
| `src/payload/plugins/ecommerce/*-collection.ts` | Overrides |
| `src/payload/plugins/ecommerce/portone/` | Payment adapter |
| `src/payload/plugins/ecommerce/client/` | Provider, cart line map, PortOne client helpers |
| `src/lib/lost-commerce/` | Catalog queries, `useStoreCart`, membership PortOne helpers, inventory domain |
| `src/app/(frontend)/(site)/lostinseoul/` | App Router pages |
| `src/lostinseoul/` | Storefront UI (chrome, hero, overlay) |
| `src/proxy.ts` | 410 retired prefixes; gate-exempt product + membership webhooks |
| `nginx/sites-enabled/production.conf` | LOST host allowlist — Phase 9 edits here |
| `src/lib/migrations-baseline/20260827_*` … `20260831_*` | Plugin schema + cutover |
| `messages/*.json` | Storefront / checkout copy |

---

## Out of scope unless asked

- Membership Plans/Prices/Subscriptions rewrite
- Ticketing rewrite
- Stripe as a live rail
- Shipping / tax engines
- Official template storefront
- Enabling plugin inventory or InventoryPlugin
- Remaining `src/lostinseoul/index.css` → Tailwind
- Further hero WebGL perf (separate from Phase 9)

Storefront visual leftover lives in `readmes/LOSTINSEOUL.md`, not here.
