<!-- Generated: 2026-11-02 | Files scanned: 2221 | Token estimate: ~820 -->
# Backend

Payload owns CRUD. Custom Next routes are the exceptions. No controller → service → repo stack; collection hooks + `src/lib/*` hold the logic.

## Proxy (`src/proxy.ts`)

1. `lostinseoul.com` → internal `/lostinseoul` paths.
2. Per-IP limit on selected `/api/*`.
3. Cookie gate (`better-auth.session_token`) for `/me`, `/prive`, `/account`, `/admin-ba`.
4. Retired prefixes 404: `/api/invoice`, `/api/lost/cart`, `/api/lost/checkout`, `/api/commerce`.

## Next routes

```
GET/POST /api/auth/[...all]          Better Auth (src/lib/auth/options.ts)
*        /api/[collection]           Payload REST via (payload)/api/[...slug]
GET      /api/search?q=             src/app/api/search/route.ts → search plugin score
GET      /api/search/users
GET      /api/places/search
GET      /api/link-preview
GET      /api/image-courier
GET      /api/dn-map
POST     /api/lost/gate             storefront password gate
POST     /api/lost/private-quotes
GET      /api/lost/inventory/reservations
POST     /api/lost/inventory/reservations/commands
POST     /api/lost/inventory/commands
POST     /api/lost/webhooks/portone src/lib/lost-commerce/portone.ts
POST     /api/invoice/pdf           still present; proxy treats /api/invoice as retired
GET/POST /api/payload-jobs/run
GET      /api/tracks/stream/:id     Radio/endpoints/stream.ts (Payload endpoint)
```

Payload notifications (collection endpoints, not Next routes): `/:id/read`, `/:id/dismiss`, `/read-all`. Client polls via `providers/Notifications`.

## Plugins (`src/payload/plugins/index.ts`)

Mounted: import-export (posts), locker, redirects, seo, search, betterAuth, image-search, blur-data-urls, user-field organizer, comments, likes, Membership (on), Merchandising (on), Inventory (**off**), `hideawayEcommercePlugin`.

Not mounted: `TicketingPlugin`, form-builder, nested-docs (deps only).

## Logic map

```
checkout / cart     src/lib/lost-commerce/{cart,orders,transitions,payment*}.ts
                    src/payload/plugins/ecommerce/*  (plugin overrides)
PortOne             src/payload/plugins/ecommerce/portone/adapter.ts
                    src/lib/lost-commerce/portone.ts + provider-events.ts
inventory commands  src/lib/lost-commerce/inventory-*.ts
                    API src/app/api/lost/inventory/**
reservations        src/lib/lost-commerce/inventory-reservation*.ts
search score        src/payload/search/calculateScore.ts
access              src/payload/plugins/locker/**
auth options        src/lib/auth/options.ts
email               src/lib/email.ts + src/lib/email/**
jobs                src/payload/jobs/expireInventoryReservations.ts
```

## Auth

Better Auth 1.7 at `/api/auth/[...all]`. Email/password (verify required), Google, Naver, Kakao, passkey, TOTP. Session cookie. Server: `payload.betterAuth` / `getServerSession`. Client: `useRPSession`. Dev lab: `src/lib/auth/dev/lab/`. onInit (deferred): `ensureUncategorized`, `seedButler`, `seedReaders`.

Roles, high → low: `admin`, `cofounder`, `editor`, `author`, `patron`, `resident`, `user` (+ `guest`). `PAID_ROLES` = resident, patron, cofounder. `STAFF_ROLES` = editor, cofounder, admin. `src/payload/plugins/locker/fields/authority/utils`.

## Globals

`Header`, `Footer`.
