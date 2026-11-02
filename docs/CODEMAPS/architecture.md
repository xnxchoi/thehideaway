<!-- Generated: 2026-11-02 | Files scanned: 2221 | Token estimate: ~660 -->
# Architecture

Single Next.js 16 app (`hideawayseoul` v33). Payload 3.88 CMS + Drizzle/Postgres (`theestate`). Not a monorepo. Admin at `/vault`. Storefront host `lostinseoul.com` rewrites into the same process.

```
Browser
  |  src/proxy.ts (host rewrite, /api rate limit, session-cookie gate)
  v
Next App Router
  |-- (frontend)  hideawayseoul.com  essays, radio, settings, day-n-night
  |-- /lostinseoul  LOSTINSEOUL storefront (also lostinseoul.com → rewrite)
  |-- (payload)/vault  Payload admin
  |-- (payload)/api/[...slug]  Payload REST
  |-- /api/auth/[...all]  Better Auth
  |-- /api/lost/*  storefront gate, quotes, inventory commands, PortOne webhook
  v
payload.config.ts
  collections[] + plugins[]  →  postgresAdapter (push:false, uuid, pool max 15)
  v
PostgreSQL theestate
```

## Entry points

| Path | Role |
|---|---|
| `src/payload.config.ts` | Payload boot, DB, collections, plugins, onInit seeds |
| `src/proxy.ts` | Next 16 proxy (replaces middleware) |
| `next.config.ts` | redirects, `/@user` rewrites, `output: "standalone"` |
| `src/app/(frontend)/layout.tsx` | Site shell: Header, session, radio, intl, theme |
| `src/app/(frontend)/page.tsx` | Hideaway home |
| `src/app/(payload)/vault/[[...segments]]/page.tsx` | Admin UI |
| `src/app/(payload)/api/[...slug]/route.ts` | Payload REST |
| `src/app/api/auth/[...all]/route.ts` | Better Auth |

## Boundaries

- **Editorial** — `posts`, `pages`, `surf`, `profile`, Lexical, Highlightr citations.
- **Identity** — Better Auth cookie session; Payload `users` is the admin user. Roles via locker plugin.
- **Radio** — `albums` / `tracks` / `playlists`; stream `GET /api/tracks/stream/:id`; Howler in `HideawayFM`.
- **Membership** — `MembershipPlugin`: plans, prices, subscriptions, invoices, FX.
- **LOST catalog** — `@payloadcms/plugin-ecommerce` (KRW default) + PortOne. Cart/checkout live in the plugin, not retired `/api/lost/cart`.
- **Inventory ledger** — code under `src/lib/lost-commerce/` and `src/app/api/lost/inventory/*`. `InventoryPlugin` is mounted with `enabled: false`, so those collections are not in the live config.
- **Ticketing** — `TicketingPlugin` (`events`, `ticket-orders`, `tickets`) exists and is not in `plugins[]`.
- **i18n** — next-intl, locales `en`/`ko`, copy only in `messages/`.
- **Archive** — `.attic/` is dormant. Never import it. `reference/` is local-only.

## Locales and hosts

Payload localization `en` + `ko`. Public host `hideawayseoul.com`. Lost hosts rewrite `/`, `/gate`, `/privacy`, `/terms`, `/refund` onto `/lostinseoul/*`.
