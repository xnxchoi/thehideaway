# PortOne PG Application — Compliance Brief & Work Plan

**Goal:** Pass PortOne PG onboarding review (PG사 입점 심사) and card-company review (카드사 심사)
for card payments on hideawayseoul.com and lostinseoul.com.

**Source of requirements:** https://help.portone.io/content/requirements
Reviewers visit the production URL and check: products sold, sale prices, business info,
refund policy, and that the payment page actually invokes the PG payment module.

---

## Scope decision (2026-07-03)

**One-time card payments only.** Plans are `yearly | lifetime` — sold as one-time payments
(yearly = purchase once, re-purchase at expiry; lifetime = purchase once). 정기결제
(recurring / billing-key) review is **explicitly out of scope**; it is a fast-follow with
its own review extension. This avoids the hardest review category (visibly-recurring
product registration, billing agreement review, no 바로오픈 fast-track) at zero launch cost.

**Anti-goals:** no billing-key flow, no monthly plans, no VAT calculation engine,
no rework of the functioning lostinseoul PortOne plumbing beyond security fixes.

---

## Review requirements → status

### Hard requirements (from help.portone.io)

| Requirement | Status | Notes |
|---|---|---|
| Business info in footer, matching 사업자등록증 exactly | ✅ code / 🔴 data | `src/constants/business.ts` + Footer render it; values are env-driven placeholders |
| Business info visible **through the payment page** ("결제페이지까지 상시 노출") | 🔧 work item 1 | Verify/add colophon on checkout + payment return pages |
| 상호명, 사업자등록번호, 대표자명, 주소 | ✅ code / 🔴 data | env: `NEXT_PUBLIC_BIZ_*` |
| 전화번호 — **landline only** (휴대폰 불가) | 🔴 owner | currently "Email support" fallback |
| 통신판매업신고번호 (mandatory for KB국민카드 since 2021-08) | 🔴 owner | empty; 구매안전확인증 for filing is issued by the PG on request |
| 이용약관 | ✅ | `/terms`, en+ko |
| 개인정보취급방침 | ✅ | `/privacy`, en+ko |
| Refund info per product (physical: refund + delivery/exchange; digital: refund only) | 🔧 work item 2 | site-level `/refund` exists; per-product blocks needed |
| Physical goods: **≥3 purchasable fixed-price products** | 🔧 work item 4 | verify storefront catalog |
| Digital/content: ≥1 purchasable product | 🔧 work item 3 | plans card checkout |
| Fixed selectable prices — **no arbitrary amount entry** | 🔧 work item 4 | request-to-order / private-order quote flows must not be a card-payment path |
| No "TEST" product names, no ₩0 prices | 🔧 work item 4 | catalog audit |
| Payment page invokes the PG module | ✅ lostinseoul / 🔧 plans | `/api/lost/checkout/intent` + browser flow work today |
| Review on real production domain (no test/staging subdomains) | ✅ | both domains live behind nginx + SSL |

### Owner tasks (not code)

1. ~~사업자등록번호~~ **DONE 2026-07-03**: 753-32-01007 baked into `business.ts` defaults
   (from 사업자등록증명; trade name 리스토어드프로젝트, full Songpa address applied)
2. 통신판매업신고번호 → `NEXT_PUBLIC_BIZ_MAIL_ORDER_NO` — check ftc.go.kr for
   753-32-01007; if unfiled: 송파구청/정부24 filing, 구매안전확인증 from PG
3. Landline number → `NEXT_PUBLIC_BIZ_PHONE`
4. Reconcile service hours (ko says 주말/공휴일 12:00–24:00, en says Mon–Fri 10:00–18:00)
5. PortOne console: create store, test + live channels, set `PORTONE_*` env vars;
   webhook secret is `whsec_…` — after confirming signed deliveries, set
   `PORTONE_WEBHOOK_REQUIRE_SIGNATURE=true` (dual-mode verify landed 681f3510)
6. Confirm chosen PG channel supports the needed methods

---

## Work items (code) — ALL DONE 2026-07-03

Implemented via generator/evaluator loop (final score 8.25/10) + security review (WARN →
both MEDIUMs fixed). 77 tests green across affected suites; idempotent migration applied.

1. **Colophon through checkout** — DONE. `CheckoutColophon` (reuses `Footer.*` messages +
   `BUSINESS`) renders on `/lostinseoul/checkout`, payment success/failure/return, plans
   `/checkout` and `/checkout/return`. Verified live, both locales.
2. **Per-product commerce info** — DONE. 환불·교환·배송 block on product detail pages;
   refund blocks on `/plans` + plans checkout; all link `/refund`. `Commerce.*` /
   `Plans.commerce.*` keys in en/ko lockstep.
3. **Plans one-time card checkout** — DONE. Existing `/checkout` extended: pending
   subscription with unique `payment_ref` → PortOne V2 card window (CDN SDK, same path as
   lost checkout) → server verification (PAID, amount.total & amount.paid vs Price,
   currency, **LIVE-channel allowlist fails closed in prod**) → `paid` flips existing
   hooks. Idempotent across verify route + webhook (advisory lock + re-read). Verify route
   is auth-gated, rate-limited, ownership-checked (uniform 404, no oracle). Abandoned
   holds reused on retry + swept after 30 min (never cancels paid/active rows).
   Migration: `20260703_120000_subscription_card_payments.ts`.
4. **Catalog & fixed-price discipline** — DONE. Amounts server-resolved everywhere; quote
   flows route to `/private-quotes`, not card; ₩0/negative rejected in both checkout
   routes. Catalog: 3 fixed-price physical products, no TEST names.

### Before enabling card in production (launch gate)

1. Set PortOne env (`PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`,
   `PORTONE_WEBHOOK_SECRET`, `PORTONE_ENVIRONMENT=production`) — sandbox first.
2. **Run one real sandbox card payment** end-to-end: the PortOne V2 REST field paths
   (`status`, `amount.total/paid`, `currency`, `channel.type`) are asserted from docs,
   not yet exercised live. Verification now fails CLOSED, so a wrong path = outage,
   not a security hole — but it must be confirmed before go-live.
3. Enable `card` in `payment_methods` on the target Plans rows (admin toggle in /vault).
4. Register the webhook URL in the PortOne console.
5. Known residual (accepted, non-blocking): compound sweep + re-checkout + late-webhook
   race fails to a retryable 503, never double-grant/free access.
6. Follow-ups queued as separate tasks: webhook HMAC (Standard-Webhooks) migration for
   the legacy order branch; better-auth/nodemailer audit advisories.

### SDK decisions (research 2026-07-03)

- `@portone/browser-sdk` (V2, ^0.1.9) — client. `@portone/server-sdk` (V2, pin 0.19.0) — server + `Webhook.verify` (Standard Webhooks; verify against **raw body**).
- Existing integration lives in `src/lib/lost-commerce/portone.ts`,
  `/api/lost/checkout/intent`, `/api/lost/webhooks/portone` — reuse for plans rather than
  parallel-building.
- Canonical pattern: portone-io/portone-sample `/nextjs` (server action verify) and
  `/express-react` (webhook raw-body + idempotent syncPayment).

---

## Verification checklist (what a reviewer sees)

- [ ] Any page on either domain → business info (incl. 사업자등록번호, 통신판매업신고번호, landline) visible in footer
- [ ] Checkout and payment result pages show the same info
- [ ] ≥3 physical products with detail, fixed KRW price, refund + delivery/exchange info
- [ ] ≥1 plan purchasable with detail, fixed price, refund info
- [ ] Card checkout opens the PG payment window on production domain
- [ ] `/terms`, `/privacy`, `/refund` reachable from footer on both domains, both locales
