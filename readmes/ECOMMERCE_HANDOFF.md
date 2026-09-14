# Ecommerce pause and resume handoff — 2026-09-14

## Start here

The latest instruction is to **pause after the current run, document progress and
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
