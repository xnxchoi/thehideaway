<!-- Generated: 2026-11-02 from .env.production.template (source: src/lib/env.ts). -->
# Environment

Canonical list is `.env.production.template`, generated from `src/lib/env.ts`.
Change a variable there, then run `pnpm env:template:gen`.
Production values live in `.env.production.enc` (`pnpm env:edit`).
Local dev uses `.env` and `.env.local`. Do not commit either.

`src/lib/env.ts` throws on boot in production when a required value is missing, shorter than 16 characters for a secret, or still set to a `CHANGE_ME` placeholder.

<!-- AUTO-GENERATED -->
| Variable | Required | Description | Example |
|---|---|---|---|
| `PAYLOAD_SECRET` | Yes | Server-side secret signing JWTs and CSRF tokens. | openssl rand -hex 32 |
| `BETTER_AUTH_SECRET` | Yes | Better Auth signing secret. | openssl rand -hex 32 |
| `LOSTINSEOUL_GATE_PASSWORD_SHA256` | Yes | SHA-256 digest of the temporary LOSTINSEOUL preview password. | printf %s 'strong-password' \| shasum -a 256 |
| `PREVIEW_SECRET` | Yes | Preview-mode shared secret (URL token for draft posts). | openssl rand -hex 16 |
| `CRON_SECRET` | Yes | Auth token for cron-triggered endpoints. | openssl rand -hex 16 |
| `DATABASE_URI` | Yes | Postgres connection string. In prod, compose constructs this from POSTGRES_* below. | postgresql://USER:PASSWORD@postgres:5432/DB |
| `POSTGRES_USER` | Deploy only | Username for the postgres container and compose-built DATABASE_URI. | postgres |
| `POSTGRES_PASSWORD` | Deploy only | Password for the postgres container. Must contain no URI-reserved characters (@ : / ? # [ ]). |  |
| `POSTGRES_DB` | Deploy only | Database name. Must match the schema your migrations target. | theestate |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID for end-user sign-in. | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. | https://console.cloud.google.com/apis/credentials |
| `AUTH_NAVER_ID` | Yes | Naver OAuth client ID. | https://developers.naver.com/apps/ |
| `AUTH_NAVER_SECRET` | Yes | Naver OAuth client secret. | https://developers.naver.com/apps/ |
| `AUTH_KAKAO_ID` | Yes | Kakao OAuth REST API key for end-user sign-in. | https://developers.kakao.com/console/app |
| `AUTH_KAKAO_SECRET` | Yes | Kakao OAuth client secret. | https://developers.kakao.com/console/app |
| `COOKIE_DOMAIN` | No | Cookie domain for cross-subdomain session sharing. | hideawayseoul.com |
| `AUTH_ADMINS_GOOGLE_ID` | No | Admin-only Google OAuth client ID (separate GCP project recommended). |  |
| `AUTH_ADMINS_GOOGLE_SECRET` | No | Admin-only Google OAuth client secret. |  |
| `NEXT_PUBLIC_SERVER_URL` | Yes | Canonical site origin used for absolute URL construction. | https://hideawayseoul.com |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Yes | Better Auth base URL (typically same as NEXT_PUBLIC_SERVER_URL). | https://hideawayseoul.com |
| `NEXT_PUBLIC_PRODUCTION_URL` | No | Extra trusted origin for Better Auth (only set when staging/preview hosts share prod cookies). | https://example.com |
| `NEXT_PUBLIC_LOSTINSEOUL_URL` | No | LOSTINSEOUL storefront origin routed into the same Next/Payload app. | https://lostinseoul.com |
| `PAYLOAD_PUBLIC_SERVER_URL` | No | Legacy Payload fallback for absolute URL composition in admin meta. Defaults to NEXT_PUBLIC_SERVER_URL. | https://example.com |
| `BASE_URL` | No | Email-template absolute-URL fallback. Only set if the renderer can't reach NEXT_PUBLIC_SERVER_URL. | https://example.com |
| `NEXT_PUBLIC_BASE_URL` | No | Client-side fallback used by the email-template preview UI. | https://example.com |
| `EXCHANGE_RATE_API_KEY` | Yes | Korea Eximbank FX API auth key. | https://www.koreaexim.go.kr/ |
| `HOLIDAY_API_KEY` | Yes | Korean public-holiday data.go.kr service key. | https://www.data.go.kr/ |
| `NEXT_PUBLIC_EXCHANGE_RATE_URL` | Yes | Eximbank FX endpoint URL. Baked into the client bundle. | https://example.com/api |
| `NEXT_PUBLIC_HOLIDAY_API_URL` | Yes | Holiday API base URL. Baked into the client bundle. | https://example.com/api |
| `MAPBOX_API_KEY` | No | Mapbox token for /api/places/search autocomplete. | https://account.mapbox.com/access-tokens |
| `PORTONE_CLIENT_KEY` | No | PortOne Global client key for LOSTINSEOUL checkout. | https://admin.portone.cloud/ |
| `PORTONE_SECRET_KEY` | No | PortOne Global server secret for signing and webhook reconciliation. | https://admin.portone.cloud/ |
| `PORTONE_API_JWT` | No | Bearer JWT for PortOne server APIs such as refunds. | https://docs.portone.cloud/reference/post_api-refund-portone-order-ref |
| `PORTONE_STORE_ID` | No | PortOne V2 Store ID for LOSTINSEOUL checkout. | https://developers.portone.io/opi/ko/integration/start/v2/checkout?v=v2 |
| `PORTONE_CHANNEL_KEY` | No | PortOne V2 channel key for LOSTINSEOUL checkout. | https://developers.portone.io/opi/ko/integration/start/v2/checkout?v=v2 |
| `PORTONE_API_SECRET` | No | PortOne V2 API Secret for server-side payment verification. | https://developers.portone.io/opi/ko/quick-guide/payment?v=v2 |
| `PORTONE_ENVIRONMENT` | No | PortOne checkout environment. Defaults to sandbox when unset. |  |
| `PORTONE_DEFAULT_CHANNEL` | No | Default PortOne payment channel key for checkout payloads. |  |
| `PORTONE_DEFAULT_METHOD` | No | Default PortOne payment method for checkout payloads. |  |
| `PORTONE_WEBHOOK_SECRET` | required when PortOne is enabled | Shared secret accepted by the LOSTINSEOUL PortOne webhook endpoint. For Standard-Webhooks signature verification use the whsec_… secret from the PortOne console. |  |
| `PORTONE_WEBHOOK_REQUIRE_SIGNATURE` | required when PortOne is enabled | When "true", the PortOne webhook rejects requests without Standard-Webhooks signature headers (disables the legacy shared-secret header fallback). | true |
| `PORTONE_WEBHOOK_ALLOW_LEGACY` | No | Sandbox-only unsigned legacy compatibility. Never enable in production. | false |
| `PORTONE_CARD_CHECKOUT_LIVE` | No | Master gate for card checkout. Card options stay hidden and card routes reject unless this is exactly "true", even when PortOne keys are present. Keep unset/false until a sandbox card payment has round-tripped successfully — see plans/commerce/operations.md. |  |
| `LOST_INVENTORY_RESERVATIONS_LIVE` | No | Master gate for stocked checkout reservations. Enabled only when exactly "true". | false |
| `LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE` | No | Gate for manual reservation mutations. Enabled only when exactly "true". |  |
| `LOST_INVENTORY_RESERVATION_TTL_MINUTES` | No | Positive reservation lifetime in minutes. |  |
| `LOST_INVENTORY_RESERVATION_LOCATION_CODE` | No | Explicit stock-location code used by checkout. |  |
| `LOST_INVENTORY_SAFETY_STOCK` | No | Nonnegative stock held outside available-to-promise. | 0 |
| `LOST_INVENTORY_RESERVATION_CONSUME_POINT` | No | Reservation consumption point. | payment_confirmed |
| `LOST_INVENTORY_EXPIRY_BOUNDARY` | No | Reservation expiry boundary rule. | at_or_after |
| `LOST_INVENTORY_PAYMENT_TIME_SOURCE` | No | Authoritative payment timestamp source. | provider_paid_at |
| `LOST_INVENTORY_LATE_PAYMENT_POLICY` | No | Late-payment handling policy. | manual_review |
| `LOST_INVENTORY_BACKORDER_MODE` | No | Backorder policy for stocked checkout. | disabled |
| `BREVO_SMTP_USER` | No | Brevo SMTP username (transactional email). | https://app.brevo.com/settings/keys/smtp |
| `BREVO_SMTP_PASS` | No | Brevo SMTP password / API key. |  |
| `EMAIL_FROM` | No | Default From: address on outgoing transactional mail. | you@example.com |
| `EMAIL_FROM_NAME` | No | Default sender display name. | Your Site |
| `ADMIN_EMAIL` | No | Admin notification recipient (signup alerts, errors). | you@example.com |
| `UNSPLASH_ACCESS_KEY` | No | Unsplash access key, mandatory since the site technically relies on unsplash to maintain a image-richlayout | https://unsplash.com/developers |
| `UNSPLASH_COLLECTION_ID` | No | Default Unsplash collection ID used by image-search. |  |
| `SPOTIFY_CLIENT_ID` | No | Spotify API client ID for the Radio collection metadata enrichment. |  |
| `SPOTIFY_SECRET` | No | Spotify API client secret. |  |
| `SITE_NAME` | No | Server-side site name used in email templates. Defaults to project literal. |  |
| `NEXT_PUBLIC_SITE_NAME` | No | Client-side site name (mirrors SITE_NAME for the email preview UI). |  |
| `NEXT_PUBLIC_IMAGE_MAX_FILE_SIZE` | No | Per-upload byte cap, parsed as Number(). Example: 10485760 = 10 MB. |  |
| `NEXT_PUBLIC_BANK_ACCOUNT` | No | Bank-transfer detail string shown on the manual-checkout success screen. |  |
| `DEV_BUTLER_PASSWORD` | Dev only | Dev-only password for the butler-login backdoor on /sign-in. Must be unset in prod. |  |
| `DEV_READER_PASSWORD` | Dev only | Dev-only password for the readers-seed fixture login. |  |
| `NODE_ENV` | No | Node environment. Compose sets this to `production` in prod. | production |
<!-- /AUTO-GENERATED -->

Deploy-only variables are read by Compose and the Postgres container, not by the Next.js schema check as application config.
`[dev]` variables must stay unset on the production VPS.
