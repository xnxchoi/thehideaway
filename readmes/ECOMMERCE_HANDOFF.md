# Ecommerce continuation — 2026-09-26

## Interactive local preview — September 26

The immediate priority is a browser preview the owner can use. The reviewed
isolated clone was restored and Next started on `http://127.0.0.1:3100` at
19:02 KST, with automatic shutdown at 20:02 KST on September 26. Check the
listener before relying on this dated status. Do not start ordinary `pnpm dev`
for this fixture.

- Storefront: `/lostinseoul`.
- Published test product: `/lostinseoul/products/readiness-shirt`.
- Shopping flow: `/lostinseoul/cart` → `/lostinseoul/checkout`.
- Customer history: `/lostinseoul/orders`.
- Operator orders: `/vault/collections/orders`.

Use synthetic fixture identities only. Credentials and exact order links are in
`.git-support/ecommerce-fulfillment-2026-09-25/private-data/PREVIEW_ACCESS.private.md`
(ignored, mode 600). A separate interactive order was seeded directly as paid
and unfulfilled for owner prepare → dispatch → deliver testing. Its private
journal/receipt are separate from the three retained delivered examples. Creation
and a repeat verification passed without changing those examples; preserve their
histories. The new order is fixture data, not evidence of a provider payment.

Live browser evaluation passed 7.25/10 for catalog, guest cart and address-form
testing: add, quantity changes, reload persistence, remove/empty state, EN/KO
responsive form, required-field focus and length limits. A product policy link
incorrectly opened the membership/ticket policy; its target was corrected to
`/lostinseoul/refund`; a real mobile click verified the destination. Customer and
operator sign-in passed through the actual forms, reaching customer order detail
and the Vault orders table. Both verification sessions were signed out. Private
login evidence is `private-data/user-login-1790417553559/report.json` in the
fulfillment evidence directory. Private storefront captures/feedback are under
`.git-support/ecommerce-kr-address-2026-09-25/private-data/interactive-preview-eval/`.

Card payment remains disabled; no sandbox-card purchase is established. Shipping
fees remain unresolved. This is a local development preview, with outbound
server restrictions and blank provider/mail credentials, not public ingress or
a release. The one-hour runner and 03:00 UTC job exclusion still apply; use the
private restart procedure below instead of bypassing those guards.

KR destination commit: `c3324bb2` (pushed). Earlier fulfillment and unrelated work remain local.

## Current KR destination checkpoint

This commit contains only the KR delivery-address slice and its public verification
record on `codex/ecommerce-phase9`. Earlier manual-fulfillment implementation,
documentation consolidation and unrelated work remain outside this commit.
Private test credentials, browser captures and runner logs are ignored and not pushed.

The full local candidate evidence below includes earlier uncommitted work; the
isolated commit verification is recorded in the public validation record. Source
push is not deployment or permission for production payments.

Next: server-authoritative shipping-fee configuration and reviewed checkout totals.
Do not invent fee amounts, carrier policies or unresolved D4–D10 decisions.

### KR destination slice

The follow-on change implements the destination/address portion of D3/C07:

- New goods checkout requires an explicit `KR` destination, recipient name,
  phone, street address and postal code. Text is bounded, control characters
  are rejected and whitespace is normalized into the immutable snapshot.
  Optional address line 2 and delivery note are retained. No carrier lookup,
  deliverability guarantee or restrictive phone/postal format is implied.
- Cart ownership is checked first; invalid destinations return safe 400 codes
  before the payment adapter or purchase/attempt writes. Billing addresses may
  still be foreign. Saved-address countries and supported currencies are unchanged.
- The existing checkout form has EN/KO destination copy, required fields,
  persistent labels and focus indication. Validation runs before loading the SDK;
  safe server errors preserve entered values and the cart. The official client's
  JSON-text error transport is covered. Existing purchase recovery/confirmation
  remains independent of the new address form and validation.
- No migration, generated artifact, fulfillment transition or payment-provider
  configuration changed. The registered HTTP/PostgreSQL suite uses a fresh
  guarded disposable database and local provider simulator, never the retained
  browser database or primary PostgreSQL.

Source: `checkout-snapshot.ts`, `payment-endpoints.ts`, their tests and native
fixtures under `src/payload/plugins/ecommerce/`; checkout `page.client.tsx` and
DOM tests; `client/purchase-confirmation.ts`; EN/KO checkout keys. Current evidence
is in `.git-support/ecommerce-kr-address-2026-09-25/`; credentials, screenshots,
runner logs and temporary coverage tooling references stay in ignored `private-data/`.

Verification: 54 non-PG files / 428 tests passed; the four-source scope has 91.22%
statements, 85.74% branches, 98.41% functions and 93.24% lines. The registered
checkout HTTP/PostgreSQL suite passed 16 tests separately. Code, React and
security reviews found no blockers. The TypeScript specialist stopped at global
configuration gates; a separate final compiler run with the documented TS6
option found 505 existing diagnostics and none in this slice. Global lint remains
blocked by existing ESLint/plugin failures. No clean whole-project check is claimed.

Independent GAN field-UI evaluation passed 7.45/10: EN/KO at 1440, 768 and 375,
plus mobile keyboard/invalid-field focus. Pay remained disabled; enabled submit,
provider payment, custom server-error display and historical recovery were not
proved live. The first browser run blocked one Next dev diagnostic request; its
report is retained. The supplement had no page errors/unknown local requests.
All 167 source-table fingerprints and delivered order histories/snapshots stayed
unchanged; no sessions remained. Owned Next3100 and isolated PostgreSQL are stopped.
Read `validation.json` and `browser-gan-report.json` in the evidence directory;
these overlap prior evidence and must not be summed into a release test total.

Exact commit verification: 51 non-PG files / 395 tests and 16 registered HTTP/PostgreSQL
tests passed in a separate HEAD-based tree, with the same four-source coverage
above. The refreshed production dependency audit still reports one critical and
two moderate advisories; dependency files are unchanged. The standard Git hook
runs with command-scoped `verifyDepsBeforeRun=false` to avoid pnpm 11 automatically
installing dependencies during a source commit.

**C07 is still partial.** `shippingAmount` remains unknown (`null`) and checkout
still uses the merchandise subtotal. Do not interpret this slice as free shipping
or sales readiness. Configure fees and review authoritative totals before sales
open; tax/policy/provider/launch gates remain as documented. Existing historical
snapshots are not rewritten or revalidated by confirmation.


## Earlier checkpoints — historical

The older entries below are retained for provenance and do not override the current checkpoint.

# Ecommerce pause and resume handoff — 2026-09-16

## Active pause checkpoint — 2026-09-16

Work is isolated in `codex/ecommerce-phase9`. Five reviewed source slices are
committed and pushed. Their remote HEAD was verified as
`30566d53409bfe7dec624179944f4503b0487d9f`:
- `933675a`: private customer cart discovery.
- `e2daed9`: authoritative cart hydration, operation confirmation and startup readiness.
- `57dd2d6`: translated purchase-mode labels in both cart surfaces.
- `bbe31bc`: KR saved-address support and the native-generated country enum migration.
- `30566d5`: order-history privacy headers through the required nginx ingress.

The primary checkout remains on main with its unrelated dirty files/research
preserved. Its handoff points to this candidate. No deployment, provider payment,
webhook change or external email has occurred.

### Pause boundary and next action

User explicitly paused. All implementation workers, tests and owned browsers are
stopped; Next3100 was stopped. Keep the isolated PostgreSQL fixture for resumption.
The five reviewed source commits above are pushed. The user then requested a
commit/push of the paused session slice: routing WIP is checkpointed in `7315f0b`,
followed by this documentation commit. See branch HEAD for the final checkpoint.
No deployment or implementation restart is authorized by that commit request.

Routing WIP owns six files: `src/proxy.ts`, `src/proxy.test.ts`,
`src/lib/lostinseoul/domain.ts`, `src/lib/lostinseoul/domain.test.ts`,
`src/proxy.nginx.test.ts`, and `nginx/sites-enabled/production.conf`.
It permits the one-segment guest detail page after the unchanged launch gate and
adds the canonical LOST `/orders` account-list route with exact nginx access.
List authentication and server-side detail authorization remain required.
Guest-detail-only checks passed 162 tests. Expanded canonical-list checks are
**193/194 PASS**: one trailing-slash rewrite expectation remains unresolved
(`/lostinseoul/orders?page=2` expected, `/lostinseoul/orders/?page=2` observed).
The worker suspects installed Next serialization, but verify before changing the
test. Scoped ESLint9 and whitespace checks passed. Independent code and security
reviews found no blocker to preserving this as a WIP checkpoint; they did not
approve release. Current browser proof and the unresolved assertion remain open.

On resume: resolve that single assertion, review any resulting routing diff, restart
the guarded app, then rerun the existing history harness without reseeding.
Revocation requires a reliable native visibility transition first; see below.

### Completed in this resume

The version-pinned 3.88.0 patch adds initialization/hydration/error signals to the
official provider without replacing its cart state or actions. Preparation and
final user/cart/address hydration are gated; streamed server children remain.
Localized recovery retains guest proof. Session-scoped operation metadata above
the drawer keeps uncertain writes blocked across drawer closure; successful Add,
Buy now and checkout require a fresh matching official cart.

Quantity controls retain keyboard focus before disabling; Floating UI handles
Escape. The first apparent Tab failure was a transient focus-guard test timing
issue. A separate real startup race was found: the same customer's cart became
interactive before TransitionProvider inserted its final wrappers, then remounted.
The initial streamed tree is now inert and explicit startup readiness defers cart
preparation. TransitionManager remains client-gated; ordinary navigation does not
toggle this readiness signal.

The official plugin expects `user.cart.docs` but does not add that customer field.
The new owner-only virtual Users.cart join discovers the latest unpurchased cart.
Officially generated types changed only the join-related semantics; unrelated
interface relocation is generator output. This join required no physical migration.

Evidence (overlapping scopes; do not add counts):
- Latest combined readiness/cart run: 13 files / 110 tests PASS.
- Native discovery/access/prior cart-history-checkout run: 5 files / 35 tests PASS.
- Copy follow-up: 4 files / 53 existing tests PASS; compatible ESLint9 clean.
- Full TypeScript remains at 652 baseline diagnostics, none in the new readiness
  or copy scope. Canonical Next lint/ESLint10 remain broken baseline tooling.
- Paired independent source reviews PASS for cart operations/hydration, account
  discovery, startup readiness and copy. A specialized copy reviewer stopped at
  the baseline type preflight; it did not approve source. A separate fresh source
  reviewer completed the paired copy review. Security scope passed with unchanged
  release-blocking audit findings (MapLibre critical; Payload/csv-parse moderate).
- Frozen offline install with scripts disabled proved patch reproducibility.
  Earlier coverage: hydration100% lines/97.22% branches; operations95.78%/89.83%,
  measured before the final focus/startup additions.

Local browser proof after the startup fix:
- Native inert focus rejection and no cart reads before final ancestry.
- Real email/password UI sign-in, return to PDP, guest+account merge and proof cleanup.
- Six API-backed identity/isolation cases (separate from UI sign-in evidence).
- Full EN and KO cart flows: 11 cases each, including delayed restore, uncertain
  committed writes, reload recovery, keyboard,375px layout and checkout/back.
- Two-tab real merge contention: one merge, matching quantities, reload and logout isolation.
- Settled desktop/mobile visuals; follow-up KO overlay and full cart mode copy:4 checks.

Sanitized cart evidence is in
`/private/tmp/hideaway-readiness/cart-verified-final-20260916/`.
The mode-copy follow-up is `cart-ko-copy-*` in the same parent directory.
The old whole-storefront GAN FAIL5.6 is unchanged. These checks are local, not
staging, built-app, provider or complete C04/E19 release evidence.

### Address and history-header follow-up

The official `supportedCountries` option now includes KR while preserving all
40 vendor countries. A Payload-native generated, idempotent enum migration is
registered. Fresh isolated validation passed the 13-migration chain and 13 tests;
five native tests passed again after the type fix. Full TypeScript returned to
the 652-diagnostic baseline, with zero scoped errors. Paired source/database
reviews passed. Migration of the retained browser database completed with counts
unchanged at 24 orders, 18 carts and zero addresses at that checkpoint.

This enables KR saved addresses; it does **not** enforce KR-only physical shipping
or calculate configured shipping fees. Inspection of active checkout found both
missing, so C07 remains open. Both inventory flags, UUIDs and `push: false` remain
unchanged; preserving billing/contact countries does not authorize international
physical shipping.

The order-history header correction covers the canonical API path and trailing
slash in Next configuration and nginx. Paired source reviews passed with nginx
as a **required public ingress**. Actual direct Next exact/query requests return
401 with `no-referrer`, `no-store` and `Vary: Cookie`. Next's automatic direct 308
still lacks the referrer-policy header: the config helper does not prove that
redirect protected. Actual nginx → Next checks on both hosts protect the 401 and
308 responses; 12 HTTP/www ingress redirect cases also passed. Negative API/vault
requests remain 404. Owned validation nginx containers were removed; no production
reload or deployment occurred.

Header evidence is under `/private/tmp/hideaway-order-history-headers/`:
`next-chain-results.json`, `next-chain-negative-results.json` and
`ingress-redirect-results.json`. Earlier `results.json` predates the slash fix.
Deployment must preserve the nginx boundary described in `readmes/DEPLOY.md`.

### Active browser gates

1. **History browser:** the guarded seeder committed 24 synthetic pending orders
   (21 Daria, 1 Miles, 2 guests) to the browser fixture. No payment, receipt job,
   cart mutation or email. Capability metadata is private mode 600. After the
   header correction, the run stopped at `en:guestlookup`: the protected orders
   prefix in the then-tested `src/proxy.ts` sent anonymous detail requests to sign-in (307)
   before guest lookup can render. Anonymous account-list 401/privacy passed;
   the checkpointed routing fix and its remaining assertion are recorded above.
   The run is **not PASS**. Do not mark pagination, guest success/denial, all immutable
   lines, cross-owner/logout, KO or mobile gates closed from this partial run.
   Refund/tracking projection and guest-to-account association are not implemented
   by this history slice, so browser history alone cannot close all E19.
2. **Revocation:** KR address creation returned 201; owned cart/address reads and
   visible quantity 2 passed. The harness deleted its synthetic address afterward.
   **No session was revoked.** It stopped waiting for the original tab to become
   hidden. Blank-only Chromium diagnostics found that disabling Playwright focus
   emulation restores focus changes, but both tabs remain visible; a minimize
   request also left the window normal/visible. Do not fake a visibility event and
   call it natural refresh proof. All browsers are closed. Retain the reviewed
   private harness and investigate native visibility before retrying. Registration
   and natural session expiry remain unproved.

Private history scripts have passed static safety review. They forbid schema
push/drop/create/migrations, auto-generation, initialization seeds, jobs and
nonlocal networking. The seeder retains recovery metadata across commit/write
failures. It must not be rerun over existing fixture orders. Its successful first
process lingered after commit and was stopped narrowly; future cleanup is bounded.
Do not import the destructive native checkout fixture into the browser database.

Next3100 is stopped at the user pause. Isolated PG18 on
127.0.0.1:55439 remains running (`hideaway-readiness-pg`); main5432 is untouched.
Browser DB: `hideaway_readiness`; native tests use a separate guarded
`ecommerce_checkout_test_*` database. Private runner/envs are under
`/private/tmp/hideaway-readiness/`; never print credentials or raw Next logs.
Coordinate generation/migrations/browser runs; do not start a second Next process.

Next, when asked to resume: finish and review the routing WIP, then history and
revocation evidence. Continue committing reviewed work in slices. Manual fulfillment remains the
next implementation milestone after the shared foundation gates. D4–D10 policies,
release audit/tooling/migration rehearsal and production authorization are still
open as described below.

## Historical checkpoints — superseded by the active resume above

The remainder preserves prior checkpoint evidence and plans. Runtime, commit and
unresolved-finding statements below describe their recorded dates, not the current
state. Use the active September 16 section above for resumption and current limits.

## Earlier resume attempt paused — 2026-09-16 (historical)

User explicitly paused again. All implementation/browser workers stopped. Branch
HEAD remains `ae7657d0`; no new commit or push occurred. Preserve current test WIP.
The two cart findings below remain unresolved; production implementation is
unchanged. `cart-session.test.tsx` has six new failing hydration regressions
(latest run: 6 failed / 10 passed, expected RED). `cart-line-controls.test.tsx`
has failing drawer-remount and adapter-bypass regressions (2 failed / 5 passed); no fix is installed.

Installed plugin3.88.0 exposes no reliable initial hydration-completion signal.
A minimal version-pinned pnpm patch was selected to expose hydration status/error
while retaining the official provider/actions; a neutral preparation instance
must not perform eager initialization. An **uninstalled, unreviewed draft** exists
in `/private/tmp/hideaway-ecommerce-hydration-patch`, and its two edited vendor
files are backed up in ignored candidate
`.git-support/ecommerce-restart-2026-09-10/resume-2026-09-16/dist/`.
Do not apply it blindly: callback/dependency replay, address loading, StrictMode,
unmount/error handling and localized reload recovery still require implementation
and tests. No patch metadata, lockfile or package version was changed. The planned
quantity fix keeps only operation metadata in identity-scoped context above the
drawer (never a duplicate cart); synchronous locking must survive drawer remount.

The old temporary runtime files had disappeared. Docker Desktop was started;
the retained fixture DB/container and readiness-shirt/migrations were confirmed.
Only fixture role credentials were regenerated into private mode600 envs; no
production settings or data were used. App3100 was briefly started for baseline
root inspection, then stopped before patch work; no listener remains. Root had
no browser console errors during that baseline, but this is not a cart-fix gate.
HTML lang remains absent. Disposable PostgreSQL55439 remains running; Docker also
started its configured main5432 container, which this work did not query or modify.

Reconstructed `/private/tmp/hideaway-readiness/run-next-resume.mjs` loads guarded
app.env and resume-local.env. A private DEV_READER_PASSWORD is prepared for the
next boot to seed ordinary Daria/Miles fixture users, but that boot has not run.
Payment/mail secrets remain absent. The browser regression harness
`cart-browser-probe.cjs` and `cart-browser-regression.cjs` are prepared only, **not executed**. Selector validation, bounded delays, Korean coverage and real account transitions still need work. Do not claim actual
login/cart-merge or new post-fix browser evidence.

Verification tooling exists temporarily under `/private/tmp/hideaway-verification`:
ESLint9.39.5 and matching Vitest/coverage4.1.11. Scoped ESLint9 on the four existing
cart implementation files passed; this does not fix the repo ESLint10 toolchain.
Full TypeScript still has652 diagnostics, zero in the current cart scope. No repo
dependency upgrade was made. Resume at the RED tests and draft-design review,
then install a reproducible narrow patch, finish recovery behavior, run mounted
regressions, fresh paired reviews and bounded browser verification.

## September 14 pause instructions (historical)

The September14 instruction was to **pause after the current run, document progress and
remaining work, then commit and push in slices**. Implementation workers are
stopped. Do not interpret this checkpoint as launch approval. Resume the existing
bounded implementation plan only when the user returns; do not repeat approved
scope/design questions. No deployment or production PortOne payment is authorized.

Suggested resume prompt:

> Continue ecommerce launch readiness from readmes/ECOMMERCE_HANDOFF.md and the
> current launch contract in readmes/ECOMMERCE.md. Verify the candidate branch and
> both worktrees; start with the two cart review findings and fresh browser proof.
> Preserve unrelated research. Full upfront card payment for preorders and South
> Korea-only physical shipping are decided. December tickets and account points
> are mandatory. Recurring billing, warehouse automation and JavaCard are deferred.

This active handoff stays in `readmes/`. `.attic/RESTART-HANDOFF-2026-09-10.md`
is unrelated settings/auth work. Temporary logs supplement this document; they
are not the only record of progress and may disappear after cleanup/restart.

## Authoritative scope and decisions

The launch contract in `ECOMMERCE.md` contains 62 functional requirements, 25
scenario gates, module boundaries and milestones L0–L7. Historical warehouse and
recurring explorations do not expand launch scope.

- Small personal operation: manually entered sellable allowances, owner packing,
  carrier/tracking entry, production progress, delivery state and customer history.
- Drops/premade batches need applicable cancellation, return/refund and exchange.
- Preorders accept a published time window and produce every net paid quantity,
  including one. **D1 resolved: full card payment when ordering**; no deposit,
  balance collection or charge-at-close. Cancellation while open; requested
  post-close restrictions must preserve mandatory remedies and defect exchange.
- **D3 resolved: South Korea-only physical shipping; configure fees before sales
  open.** Fee amounts, supported carriers/address rules and tested payment
  currency/channel combinations still require configuration.
- One-time memberships and December ticket sales/distribution/attendee management/
  check-in for 50–70 people are required. Exact date/capacity and policies TBD.
- Every customer needs points: zero initial balance, gifts to early registrants,
  customer balance/history, authorized event redemption and audited reversals.
- Recurring subscriptions are out of launch scope. JavaCard/NFC/readers/offline
  spending are documented future ideas only. Account-owned points and ordinary
  authorized commands should preserve future extensibility without hardware fields.
- Card payment is mandatory. Same VPS for hideawayseoul.com and lostinseoul.com;
  LOST is the canonical storefront with clean public paths mapped to /lostinseoul.

Open decisions: D4 return/refund windows, fees and receipt-date basis; D5 preorder
cutoff/in-flight grace; D6/D7 ticket and one-time membership cancellation/access/
extension rules; D8 early-registration basis/cutoff/amount, redemption costs,
admission requirement, expiry/unspent and post-spend cancellation; D9 compatible
carts/partial parcels; D10 merchant/provider setup, exact event and staff. Resolve
only the decision needed by the next feature. Do not invent policy or enable an
offer with undefined fees or cancellation rules.

## Worktrees and commit boundary

Primary: `/Users/seanschoi/WebstormProjects/thehideaway`, branch `main`.
Candidate: `.claude/worktrees/ecommerce-phase9`, branch `codex/ecommerce-phase9`.
Both began this run at `7238c2deb83af57fbe1c53ed8b91f5a42c9f563c`.
All application changes are in the candidate. Six source slices were committed
and pushed; `git ls-remote` verified remote `82baffd18a0ca89b3811a3c030dc13a5275d0e08`
on `origin/codex/ecommerce-phase9`. A final docs slice follows them; use the branch
HEAD and Git log to identify that commit, and verify remote equality when resuming.
No merge, release tag or deploy occurred. The release workflow triggers on version
tags; this checkpoint push did not create one.

| Source commit | Slice                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| `2e9307ae`    | Same-server LOST domain routing and narrow nginx API access               |
| `a6fd2a03`    | Baseline migration discovery and NanoID preservation                      |
| `30bc0080`    | Shared purchase/payment, journal, server carts, history and native schema |
| `0601e255`    | Storefront rendering, favicon ownership and shared pointer fixes          |
| `91c36070`    | Unfinished client cart session/modal/quantity checkpoint                  |
| `82baffd1`    | Disabled manual fulfillment contract/protection checkpoint                |

Shared collection registration, migrations/generated schema, purchase access and
paired translations keep the commerce foundation in one dependency slice. Client
cart and manual fulfillment WIP are separate commits with explicit limits. Final
index checks passed after SQL-literal indentation/trailing whitespace cleanup in
the two new migrations; code review found no semantic change. No package/lockfile,
environment, media/research or temporary diagnostic artifact is included.

Primary retains `.gitignore`, `CLAUDE.md`, `readmes/ECOMMERCE.md`, and the active
handoff as local changes. Its unrelated untracked `readmes/design-research/` must
remain untouched. Synchronized primary docs are a navigation aid, not a second
application implementation. Do not commit duplicate primary docs to main merely
to make that tree clean. Inspect both statuses again before resuming.

Candidate dependencies were installed from the committed lockfile with
`--frozen-lockfile --ignore-scripts`, using a temporary pnpm store. The old
node_modules symlink is archived locally; do not restore it or reinstall just to
resume. Earlier recovery artifacts remain in primary
`.git-support/ecommerce-restart-2026-09-10/` (ignored). Do not apply them over newer
source. Do not prune other registered worktrees.

## Completed source and evidence

Evidence counts below describe their named checks, not one combined release run.
No statement below proves staging, provider payment or notification delivery.

| Slice                    | Current source                                                                                                                                                                                                                                                                                     | Verified evidence and limits                                                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain/host routing      | Shared validated host context, public/internal path map, Link/chrome/transitions, canonical GET/HEAD redirects, server-action POST preservation, LOST nginx forwarding. Exact carts root/subtree and payments; exact users/me and addresses added for vendor client.                               | Earlier domain/nginx/transition/commerce run: 37 files/279 tests; local Docker nginx syntax and POST method/query/body proof. Source reviews passed then. Latest auth-route additions have source tests; current real account/browser/host gate is open.                               |
| Baseline migrations      | Moved colocated Vitest test out of migration directory; migration discovery guard; schema-qualified NanoID existence checks preserve installed signatures/defaults.                                                                                                                                | Earlier 10 migrations on initialized and empty isolated PG18 DBs, CLI no-op rerun, 3 files/5 regression tests and code/database review passed. Production upgrade/restore not proved.                                                                                                  |
| L1a/L1b purchase/payment | Exactly two guarded official PortOne HTTP replacements; authoritative immutable lines/address/totals; pending plugin order purchase identity; attempt transactions; guest UUID capability; shared locked browser/webhook settlement; signed event retry/reconciliation and durable receipt intent. | Prior final L1 run: 47 files/255 tests including native HTTP/PG and migration replay. Scoped coverage 91.62% lines, 84.80% branches, 100% functions. Independent source/security/database/React reviews passed at that checkpoint. Not current combined L1c coverage or card evidence. |
| Command journal          | Fail closed if journal unavailable; immutable actor/operation/resource/reason binding and digest; safe replay; terminal immutability; denied generic CRUD; strict admin wrapper, lease fencing, atomic domain+completion transaction.                                                              | 28 tests including 4 real PG cases; migration up/up/down/down/up/up. Two independent Santa reviewers PASS. Generic journal foundation is complete; concrete refund/fulfillment commands are not.                                                                                       |
| Customer order history   | Account-owned 20-row stable pagination and all immutable lines/address; guest single-order no-store POST; shared purchase-access rules. /api/lost/orders GET+POST, server list/detail, lookup/detail UI, en/ko.                                                                                    | 61 focused tests earlier; 2 real PG history cases in latest combined 25-test run. Two independent Santa reviewers PASS. Real logged-in/guest browser history remains unproved.                                                                                                         |
| Server carts             | Transactional pinned vendor merge/matcher, source/target row locks, ownership/secret checks, durable replay, self-transfer, source-delete verification/rollback, locked native item endpoints and safe integer quantities.                                                                         | RED concurrent merge+8 adds kept1; GREEN keeps9. Delete fault rolls back; different valid account can recover source. Latest native cart/history/checkout run: 3 files/25 tests PASS. Final checkpoint review status below; not full account/browser concurrency proof.                |
| Storefront runtime       | Root RPage/Suspense with async content/connection and localized error retry; favicon preserves React-owned head nodes; Coordinator context and one shared pointer listener restored.                                                                                                               | 21 focused tests plus isolated pointer-binding test; both independent Santa reviewers PASS, no scoped type diagnostics. Source-only verdict. Cart-provider fix and latest integrated browser behavior remain unverified.                                                               |
| Client cart checkpoint   | Identity-keyed official provider; Better Auth useSession; retained guest recovery; neutral preparing provider streams RSC children; quantity controls, named focus-managed modal and real catalog count.                                                                                           | 48 focused checks, scoped type filter and diff check passed. Review found HIGH/MEDIUM defects below. This slice is explicitly unfinished.                                                                                                                                              |
| Manual fulfillment draft | Pure strict command/transition contract, one-use append-only protection, lifecycle hook guard; tangible checkout snapshot marker.                                                                                                                                                                  | 20 contract/protection/lifecycle unit tests PASS. No service, endpoint, order schema fields/options, migration, generated artifacts or UI enables it. Native Payload/PG and independent source approval remain open.                                                                   |

L1a/L1b preserves actual Payload-returned UUIDs: the adapter ignores supplied IDs
by default. Guest digest initialization is single-use for the newly created order
inside the same transaction. Existing capabilities remain valid across secret
rotation, but a lost initiation capability cannot be reconstructed after rotation;
re-initiation fails explicitly rather than returning a false capability.

Cart merge command identity hashes source+actor+target; binding includes secret
digest. Validate source ownership before claiming. Replay after deleted source
requires the authorized receipt. Lock source/target in stable order and verify
vendor source deletion, since the vendor swallows delete failures. Native item
handlers must parse request data BEFORE cloning, then lock BEFORE the vendor
reads/replaces the whole item array. Reversing either order caused observed 400s
or lost updates. Purchased carts and account ownership are protected even from
generic admin writes; narrowly authorized settlement/transfer requests use server
request identity. Do not restore legacy secret access to account carts.

## First resume work: unresolved findings

1. **HIGH — final cart hydration gate:**
   `src/payload/plugins/ecommerce/client/cart-session.tsx` mounts the ready
   official provider and enables interaction before its new async user/cart
   hydration completes (vendor isLoading initially false). Early Add can create
   another cart before restore overwrites it. Add explicit authoritative hydration
   completion gating and a real mounted regression with deferred final requests.
2. **MEDIUM — quantity recovery survives drawer close:**
   `src/lostinseoul/components/cart-line-controls.tsx` holds pending/unconfirmed
   mutation state locally. Close/reopen loses it and can allow another mutation
   after a response-loss failure. Preserve operation metadata at session scope or
   require authoritative refresh before enabling another mutation. Test remount.
3. Start a fresh Next process after those fixes; prior polling did not reliably
   pick up source changes. Recheck streamed root/metadata, real count, quantity
   controls, focus containment/restoration, keyboard, en/ko, mobile and checkout.
4. Real Better Auth login/cart merge/logout/account-switch, two-tab races,
   ownership denial and order-history guest/account browser paths remain gates.
5. Finish manual fulfillment and V2 refund/reconciliation only after the shared
   correctness gaps are closed. Do not begin a parallel new implementation on
   top of this paused draft without reviewing its contract and business choices.

## Review and browser disposition

Santa requires two fresh independent reviewers, identical input/rubric, both
PASS, maximum three fix/review rounds. Runtime, history and journal each have
paired PASS source reviews. The client cart review is FAIL with the two findings
above; passing its 48 tests does not close them.

Final server-cart/disabled-fulfillment checkpoint review B PASS: independently
verified 6 unit suites/46 tests and the native cart PG suite; no blocking finding. Review C stopped at mandatory tooling prerequisites: TypeScript exited 2
with 652 diagnostics (none in that scoped server-cart/fulfillment set); ESLint10
crashes in react/display-name. C did not review source and issued no approval.
Therefore this combined slice does not have paired PASS, regardless of B's
verdict. Checkpoint commits preserve work; do not treat them as release approval.

The storefront GAN loop consumed three browser rounds: **overall FAIL, 5.6/10**.
Do not relabel or silently extend that finished loop. It reached desktop/mobile
root→PDP→cart→checkout→back/reload, persisted quantity 2/₩24000, checked 375px without
horizontal overflow, and exercised Korean controls. Original blank root/favicon
crash/missing Coordinator were fixed. Residual metadata failure was traced to the
old provider returning null above RSC children. New SSR source tests pass, but the
latest fix has no fresh browser proof. The old counter mismatch, missing quantity
controls, unnamed modal/focus and Korean unavailable-card copy have source fixes
only. HTML lang remains absent/unfixed. Audio pool warnings remain; no audio/hero
polish is authorized by this checkpoint.

Local checkout is intentionally configuration-disabled. No successful initiation,
real SDK/provider checkout, sandbox payment, sandbox refund, real receipt email,
staging or production payment has been proved by these browser sessions.

## Manual fulfillment draft and next plan

Draft files under `src/payload/plugins/ecommerce/`:
`manual-fulfillment-contract.ts`, `manual-fulfillment.test.ts`,
`manual-fulfillment-protection.ts`, `manual-fulfillment-protection.test.ts`.
`order-lifecycle.ts` invokes the deny/proof guard. No endpoint or schema registration
exists. Snapshot `fulfillmentKind: physical` comes only from the goods checkout;
old snapshots without it cannot be dispatched by the draft.

Planned main-site-only Payload collection endpoint:
**POST /api/orders/:id/fulfillment**. It is NOT registered and must NOT be added to
the LOST allowlist. Do not use the retired /api/commerce proposal. Strict actions:
prepare, dispatch, confirm_delivery, correct_tracking, with commandKey,
expectedRevision and reason. Dispatch has carrier/tracking/shippedAt and unique
snapshot line indexes/quantities; delivery is a separate manual confirmation.

Use existing plugin orders with optional manual_shipment and protected append-only
fulfillment_history. Derive revision from history, preserve exact prefix and
before/after evidence, actor/time/reason/command reference. Add preparing/shipped/
delivered without changing financial truth. Lock purchase:${orderID}, re-read paid
physical eligibility, write domain+audit+journal completion in one transaction.
Admin-only, same-origin, rate-limited, strict allowlist and safe no-store responses.

First bounded dispatch is one parcel covering all physical snapshot quantities;
partial parcels/address changes/replacements and customer cancellations/refunds
are separate remaining work. This is a proposed limitation, not completed O03–O09.
Carrier enum and tracking URL templates in the draft are proposals, not approved
or provider-verified configuration. Review/validate before enabling. Do not infer
physical eligibility from presence of an address (digital goodies may use one).

Next steps: finish domain service/endpoint; protect/register fields; generate
native schema/types and idempotent migration after reading MIGRATIONS.md; exercise
real Payload/PG rollback/replay/concurrency; then stock Vault order UI field using
Payload locale context and existing theme. Project only safe shipment/timeline to
customer history, excluding private reasons/operators/command data. Rehearse actual
operator and customer browser flows. A dispatch-versus-cancellation domain test is
not cancellation E2E while no cancellation command exists. No receipt delivery or
return-window policy is implemented by shipment state alone.

## Remaining launch sequence

| Milestone | Remaining work                                                                                                                                                                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L0        | Resolve dependent D4–D10 policies; configure Korea fees/carriers and tested card currencies/channels before opening offers.                                                                                                                                                                        |
| L1        | Close cart findings and real identity/history/browser gates; implement V2 refund/reconciliation commands and durable notification delivery/retry. Complete shared C/P and E01–E06 evidence.                                                                                                        |
| L2        | Manual shipment/queues/exports, finite sales caps, service/cancel/refund/exchange operations. No warehouse automation or old InventoryPlugin.                                                                                                                                                      |
| L3        | Time-window preorder, full upfront card collection, exact cutoff/in-flight races, net paid production export including one-order runs, manual production/delay/cancel remedies. Existing threshold crowdfunding is not this feature.                                                               |
| L4        | Mandatory December tickets: card sale, issuance/distribution, attendee management, check-in/revocation; one-time membership access/expiry; points balance/journal/grant/redeem/reverse. TicketingPlugin is currently unregistered; old refund UI and membership card/verify routes are incomplete. |
| L5        | Unified customer history, operator recovery, transactional email/retry, policy/translation parity and exact HTTP/UI/provider wiring.                                                                                                                                                               |
| L6        | Fix current migration/build/release ordering; align schema drift, pin/verify image tooling, address advisories, backup/restore/rollback and monitoring; prove built app/staging/domain/email and sandbox card+webhook+refund.                                                                      |
| L7        | Enter real business offers/policies/event/points rules; enable only proved scenarios. Production PortOne requires a separate explicit user request.                                                                                                                                                |

The December event and points are release gates, not post-launch extras. Keep
manual tasks practical for one person. Never revive the old ledger expiry task:
it queries absent inventory tables. Existing deploy flow rotates/smokes before
--migrate and release workflow references retired checkout tests; correct before
release. Do not run those workflows as-is to push this source checkpoint.

## Local environment and safe restart

Verified at pause: task-owned Next runner/server on 3100 stopped, listener absent.
Docker `hideaway-readiness-pg` remains running with its volume, PostgreSQL18,
127.0.0.1:55439, role readiness. Main PostgreSQL 5432 is unrelated and untouched.
App DB: hideaway_readiness. Native test DB: ecommerce_checkout_test_20260914.
Other disposable fixture DBs may exist; do not broadly delete them or the volume.

Private mode 600 files under /private/tmp/hideaway-readiness:
app.env, checkout-test.env, empty-database.env and resume-local.env. The last holds
persistent random fixture Payload/Better Auth secrets. Do not print/commit them.
A disposable password appeared in a PG teardown error; it was rotated and envs
rewritten, fresh authentication verified. No production credential was involved.
If temporary files disappear, recreate an isolated fixture and guard target;
never fall back to primary DATABASE_URI or log credentials to diagnose it.

Local scripts in that directory: run-next-resume.mjs and migrate-resume.mjs load
app.env then resume-local.env, require 127.0.0.1:55439/readiness DB, set loopback 3100
URLs and WATCHPACK_POLLING=1000. They set synthetic sandbox store/channel and the
card flag but no API secret. Inspect privately before reuse; this is not permission
to configure production. Launch from candidate with rtk proxy node and the runner.
If a descriptor-limit fix is needed, apply only to the task shell. Never change
production configuration to make local checks pass. Remove only Next's generated
CLAUDE append after stopping if it reappears, preserving the real operating brief.

App fixture migrations applied: 20260914_012723_checkout_durable_purchase and
20260914_073802_commerce_command_journal. Both new TS migrations and native JSON
snapshots are tracked with generated types/schema and index. Existing Teams
member-count/membership-key and pages autosave drift is excluded from SQL;
generated snapshot does not prove full DB/config alignment. Resolve before deploy.
Synthetic product /lostinseoul/products/readiness-shirt is persisted (KRW12000,
Standard, quantity1–5); do not reseed blindly.

Latest native regression (candidate; verify env target privately first):

```sh
rtk proxy node --env-file=/private/tmp/hideaway-readiness/checkout-test.env node_modules/vitest/vitest.mjs run src/payload/plugins/ecommerce/cart-merge.postgres.test.ts src/payload/plugins/ecommerce/order-history.postgres.test.ts src/payload/plugins/ecommerce/checkout-http.postgres.test.ts --fileParallelism=false
```

Logs: l1c-http.log (25 tests), cart-final-unit.log, journal-tests.log,
manual-fulfillment-unit.log, l1-final-suite.log and l1-final-coverage/. Browser
record: store-feedback-001.md and store-round* screenshots; runtime packet:
store-runtime-review-packet.md. Read scoped outputs; do not dump private env/logs.
No need to repeat passed checks until source/environment changes or missing
acceptance evidence justifies it. Native history fixtures use one HTTP checkout
plus Local API copies to avoid the 20/min initiation limiter and unique catalog
rename labels so repeated tests do not collide.

## Tooling, audit and release limits

Installed: Payload/ecommerce3.88.0, Next16.3.4, React19.2.8, Vitest4.1.11,
coverage-v8 5.0.0, ESLint10.10.0. TypeScript6 requires command-only
--ignoreDeprecations 6.0; latest full check has 652 diagnostics. Scoped clean output
is not global type approval. Canonical pnpm lint uses removed next lint; direct
ESLint crashes because react/display-name calls removed getFilename. Existing
cursor-theme assertion also fails on baseline. No unrelated fixes were made.
Matching coverage runner is temporary /private/tmp/hideaway-l1-coverage/
node_modules/vitest/vitest.mjs; call that binary directly if measuring. The prior
91.62/84.80 coverage predates L1c; new combined L1c coverage is unmeasured.

Precommit read-only pnpm audit: **1 critical, 2 moderate, 0 high**; unchanged
package.json/lockfile. maplibre-gl5.24.0 GHSA-jrc7-96c5-q579 (patched>=6.4.1);
Payload3.88.0 GHSA-jg8r-5jh2-v2xj (patched>=3.88.1 or review explicit unlock
access mitigation); csv-parse5.6.0 via import-export GHSA-8cw4-87c7-c6xx
(patched>=7.0.2). Map setHTML exploit path was not demonstrated in sampled source;
that does not dismiss the advisory. Resolve applicability/mitigation before
release without silently upgrading the pinned ecommerce contract. No dependency
or lockfile change is included in this pause. Audit detail remains privately at
pause-dependency-audit.json. Never claim this audit is clean.

Earlier read-only live observations (STALE, reverify before deployment): both
domains resolved 58.229.253.225 with TLS; LOST root→/lostinseoul→gate→404; live image
v33.0.31/e319e9e44cd87d2918e5a160c61ff1d93421a3b8, server checkout 2fdc3daf.
Live DB lacked plugin commerce tables and domain/PortOne V2 settings were unset.
No production deploy, nginx reload, env update, migration, webhook setup, payment
or refund was performed. Source branch push does not change that state.

## Read order, skills and invariants

Read AGENTS/CLAUDE, ECM launch contract, this handoff, LOSTINSEOUL boundaries,
DEPLOY host map, NAMING before cart/chrome, MIGRATIONS before schema. Before Vault
or roles: VAULT.md and primary .claude/skills/admin-fey-surfaces/SKILL.md (not copied
into candidate). docs/CODEX-NAVIGATION-GUIDE.md was absent; do not assume it exists.

Requested skills: source-command-feature-dev, Santa, GAN, search-first,
documentation-lookup, deployment-patterns, postgres-patterns, nextjs-turbopack,
react-patterns/performance/testing and frontend-patterns. Skills are in the session
catalog (ECC cache or ~/.agents/skills); reload relevant instructions after restart.
Use Context7 resolve-library-id then scoped query-docs for Payload API work and
confirm against installed3.88.0 source. /payloadcms/payload was the prior ID.
Do not substitute generic templates for the existing official-plugin integration.
Use TDD and independent scoped reviews, including real PostgreSQL/browser gates.

Better Auth UUID customers, guest carts; useStoreCart wraps official useCart.
All user text next-intl en/ko. KRW default decimals0 plus USD/JPY/EUR capability.
UUID Postgres, push:false, idempotent migrations in src/lib/migrations-baseline.
Both inventories stay disabled; no reservation FK retargeting or duplicate/retired
commerce collections. Keep membership /api/lost/webhooks/portone separate from
product /api/payments/portone/webhooks. No template UI, Tailwind conversion, hero
polish, unrelated settings/auth changes, recurring billing or card hardware.
