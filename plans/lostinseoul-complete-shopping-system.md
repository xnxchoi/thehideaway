# LOSTINSEOUL Complete Shopping System Blueprint

Status: Adversarial review approved on 2026-07-20. PRs 1–6 were implemented locally by 2026-07-22 and committed as separate reversible work packages. PR 6 adds atomic inventory reservations, available-to-promise calculation, payment-time consume or review, cancellation release, recurring expiry recovery, and storefront availability. On 2026-07-23, the owner added a system-wide requirement that every supply-chain capability remain fully manually operable and interoperable with optional automation. Opening balances, procurement, costing, fulfillment workflows, and customer inventory UI remain excluded. PR 7 and later work packages have not started.

## Objective

Build a complete, operational physical-goods commerce system for LOSTINSEOUL on the existing Next.js, Payload CMS, and PostgreSQL application. The system must cover catalog SKUs, inventory, saved delivery addresses, checkout, payment, shipping, fulfillment, made-to-order production, returns, refunds, customer service, and operational reconciliation.

This blueprint deliberately excludes invented commercial policy. Rates, regions, promises, timelines, and legal rules remain disabled or explicitly unresolved until the owner supplies them.

## Scenario-test execution record

Every work package uses the same gate: intended customer and staff journeys, retry and replay, concurrency, transaction rollback, direct-write boundaries, reconstruction, migration apply/re-entry, focused coverage, build, and independent review. Findings in an earlier package are fixed and committed before the next package starts.

The PRs 1–4 audit completed on 2026-07-22:

| Area                           | Scenarios exercised                                                                                                                                         | Result                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Customer and staff access      | Anonymous access, ownership filters, lifecycle permissions, evidence deletion, complete order/payment transition matrices                                   | Anonymous reads now fail closed; generic order/payment deletion is disabled           |
| Customer retry flows           | Cart and checkout route regressions, private quote double-submit, lost success response, altered-key conflict, in-progress command, blocked browser storage | Private quotes now use durable per-user commands and request-scoped client keys       |
| Provider recovery              | Duplicate and reordered events, rejected replay, retryable recovery, stale lease, terminal metadata clearing                                                | Stale outcome, error, and completion fields are cleared explicitly                    |
| Inventory concurrency          | Duplicate movement, last-unit debit, opposing transfers, movement against SKU/location deactivation                                                         | Stock is conserved and lock ordering completes without deadlock                       |
| Inventory failure and recovery | Failure after a prior projection update, full rollback, same-key retry, reconstruction                                                                      | Movement, projections, and idempotency state roll back together                       |
| Database boundary              | Invalid quantities/endpoints, append-only mutation protection, induced projection drift                                                                     | Invalid writes fail; privileged projection drift is reported without automatic repair |
| Migration                      | Empty disposable database through `pnpm migrate`, PR 3/4 guarded re-entry                                                                                   | Applied without invented data; guarded re-entry preserved rows                        |

Gate result: 524 focused scenarios passed, including 33 PostgreSQL scenarios on a newly migrated disposable database. Scoped changed-module coverage was 90.20% statements, 89.93% branches, 85.71% functions, and 92.93% lines. The production build passed with one-off environment validation bypassed because local Kakao credentials are absent. Independent code, security, React, and TypeScript reviews found no remaining critical or high issue.

Deferred by design: checkout still uses the legacy SKU inventory field until PR 6 introduces reservations; the full real-browser cart-to-payment journey belongs to PRs 6 and 10. These are planned dependencies, not PR 4 regressions.

The PR 5 audit completed on 2026-07-22:

| Area                     | Scenarios exercised                                                                                         | Result                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Inbound stock            | Draft/open/close/cancel, partial and excess receipt, lot creation, quarantine release, replay, rollback     | Every receipt movement is tied to immutable lot, actor, and timestamp evidence  |
| Adjustments and counts   | Outbound adjustment, disposition transfer, 50-line cycle count, stale snapshot, maker-checker approval      | Naked inbound adjustment is rejected; every variance has one matching movement  |
| Concurrency and recovery | Duplicate commands, lease expiry, terminal races, lock ordering, rollback against active/expired claims     | Active or unknown leases block rollback; expired evidence-free claims do not    |
| Database boundary        | Direct mutation, post-cancellation evidence backfill, provenance mismatch, orphan lot, reconstruction drift | Invalid history and projection writes fail at the database boundary             |
| Migration                | Partial schema repair, populated re-entry, guarded down/up, fresh create/open/receive after reapply         | Payload-generated schema reapplies idempotently and preserves existing evidence |

PR 5 gate result: 523 non-PostgreSQL scenarios passed. The complete 13-file PostgreSQL matrix passed 78 scenarios three consecutive times with deprecations treated as failures. Focused changed-module coverage was 93.06% statements, 89.67% branches, 97.54% functions, and 94.97% lines. Scoped TypeScript diagnostics, ESLint, Prettier, migration checks, and the production build passed. Final code, database, security, and TypeScript reviews found no critical, high, or medium issue.

The PR 6 audit completed on 2026-07-22:

| Area                     | Scenarios exercised                                                                                                                                          | Result                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Reservation and ATP      | Last-unit contention, safety stock, multi-SKU rollback, duplicate commands, terminal history volume, storefront query failure                                | ATP is physical available stock minus active reservations and safety stock; terminal history does not increase checkout query count |
| Payment and cancellation | Standard stocked payment, request-to-order, private order, missing/early/late provider timestamps, physical shortage, duplicate reconciliation, cancellation | Stocked orders consume once; valid non-stocked orders do not require reservations; unsafe payment timing enters durable review      |
| Expiry and concurrency   | Payment versus expiry, payment versus cancellation, competing checkout, overlapping expiry workers, whole-order batch bounds                                 | Lock ordering prevents oversell and duplicate terminal actions; recurring expiry remains safe under overlap                         |
| Database and migration   | Payload generation, partial enum repair, populated re-entry, guarded down/up, append-only evidence, deferred lifecycle agreement                             | The squashed Payload-generated schema reapplies idempotently and preserves established array IDs and jobs data                      |
| Access and operations    | Reservation collection access, internal write guards, job run/queue/cancel access, checkout fail-closed policy, PII-safe operational logging                 | Reservations are system-written and admin-read; cron bearer is run-only; failures remain observable without customer data           |

PR 6 gate result: 633 non-PostgreSQL commerce and route scenarios passed. The four-file PostgreSQL matrix passed 33 scenarios, including 16 payment/reservation lifecycle and 7 migration scenarios. Per-file coverage enforcement passed for every included PR 6 module; the focused suite reached 91.48% statements, 86.67% branches, 98.30% functions, and 92.74% lines. Payload 3.85.2 generation was previously validated against the committed dependency baseline; the final evidence option was generated from the Payload collection change and squashed into the pending PR 6 migration. Final database and security reviews found no critical, high, or medium issue.

Pause boundary: The 2026-07-23 manual-operability review found that PR 6 reservations are system-written/admin-read and have automated expiry, but no guarded operator command surface. PR 6A is inserted as the next remediation work package in this serial session; PR 7 has not started but remains independent and may proceed separately. PR 6A must land before PRs 8 and 10 or later fulfillment work.

## Current baseline

The repository already has Products, ProductCarts, ProductOrders, ProductPayments, ProductOrderCampaigns, Coupons, and membership-oriented Invoices. It also has server-side cart resolution, transactional stock decrement/release, PortOne card payment, request-to-order campaigns, private quote intake, and an order-by-reference page.

The baseline is not yet a complete shopping system:

- Inventory now has relational SKUs, stock locations, append-only physical movements, cached projections, receipts, lots, quarantine release, adjustments, cycle counts, atomic reservations, available-to-promise calculation, and recurring expiry recovery. Standard checkout reserves stock and payment consumes or routes the order to inventory review.
- Checkout stores contact and delivery data as arbitrary JSON, with one free-text address. There is no address book, normalized order snapshot, explicit save behavior, address validation, or delivery eligibility check.
- Order totals are effectively merchandise subtotal. Shipping, promotions, tax treatment, and delivery estimates are not computed as server-owned quotes.
- Fulfillment is a coarse order field. There are no shipment, package, partial-fulfillment, tracking, delivery-event, or warehouse workflows.
- Request-to-order counts paid orders rather than units and has no deadline finalizer, failure/refund operation, production batch, or buyer progress.
- Private made-to-order stops at quote intake. There are no quote revisions, acceptance, deposit/balance rules, specifications, production milestones, or completion flow.
- Returns, exchanges, product receipts, operator queues, durable idempotency, outbox delivery, and reconciliation reports are missing.
- Address, shipping, totals, fulfillment, returns, and reconciliation remain incomplete and are handled by PR 7 and later work packages.

The current worktree is heavily dirty and contains active payment-reconciliation and unrelated visual work. Do not execute any step directly from this state. First establish a reviewed commerce baseline containing the current payment hardening. Preserve unrelated user changes. Do not commit, push, deploy, or rewrite the worktree without explicit approval.

## System boundary

### Included

- Authenticated customer checkout; guest checkout remains disabled unless explicitly selected.
- Standard stocked goods, request-to-order campaigns, and private made-to-order goods.
- One cleanly modeled default stock location, extensible to additional locations without requiring them at launch.
- Card and intentionally enabled manual payment methods.
- Saved delivery addresses and immutable order delivery snapshots.
- Shipping eligibility, server-side rate quotes, shipments, tracking, and manual carrier fallback.
- Full and partial fulfillment, cancellation, return, exchange, refund, and restocking.
- Customer, Payload-admin, warehouse/fulfillment, support, and reconciliation surfaces.

### Excluded unless separately approved

- Marketplace or multi-vendor settlement.
- Point of sale, wholesale, subscriptions, digital goods, or gift cards.
- International duties calculation, speculative multi-warehouse allocation, or carrier procurement.
- Guest checkout, backorders, split shipments, and deposits merely because the schema can represent them.
- Treating existing bilingual legal or delivery copy as executable business policy.

## Non-negotiable invariants

1. PostgreSQL and server services own money, stock, payment, order, fulfillment, and refund truth. Client values are proposals only.
2. Product, SKU, price, discount, tax, contact, delivery address, and shipping method on an order are immutable snapshots. The original order address never changes. A pre-cutoff correction appends an `OrderAddressVersion`, audits a pointer switch for fulfillment, and is copied into the shipment; it never updates the saved address.
3. Physical inventory entries alone change disposition-bucket on-hand. `sellable_on_hand` is only the `available` bucket; quarantine, damaged, inspection-pending, returned-pending-release, and discarded buckets are never reservable. Reservation entries alone change active reserved. `available_to_promise = sellable_on_hand - active_reserved - confirmed_safety_stock`; consuming a reservation closes reserved exactly once and records the chosen physical/accounting transition exactly once. Bucket transfers are append-only disposition entries. Cached balances are projections and must reconcile to append-only entries.
4. Order, payment, reservation, fulfillment, shipment, production, return, and refund are separate state machines. One state must not impersonate another.
5. Commands, provider events, inventory movements, campaign transitions, refunds, shipments, and notifications are durable, idempotent, and safe under retries and concurrency. Completed cart/order/provider business keys retain permanent uniqueness tombstones; cleanup may expire response caches and abandoned leases only.
6. Customer UI never exposes raw internal states, provider payloads, or operator notes.
7. User-facing copy is compact, neutral, and stored in both `messages/en.json` and `messages/ko.json`. It must not promise a carrier, price, refund, dispatch date, or delivery date unless that value is stored operational data.
8. Every schema change starts in Payload collection/global/field/plugin config and uses `rtk pnpm micreate` to generate the migration from that schema. Hand-written schema migrations are prohibited unless Payload cannot express the required operation and the exception is documented. Regenerate Payload types and never edit generated `src/types/payload-types.ts` by hand.
9. Operational balances and lifecycle fields are changed through guarded commands, not arbitrary Payload field edits.
10. Existing authentication and authorization boundaries remain in force. Customer-owned records are scoped server-side; staff actions require explicit roles and audit entries.
11. Every supply-chain capability has a complete guarded manual operating path. Manual and automated actors use source-specific authentication and authorization that feed the same capability policy, domain commands, validation, locking, idempotency, transition guards, audit records, and normalized events; automation is an optional adapter, never the only way to operate the capability.
12. Manual and automated work may continue on the same record. A manual entry may seed later automation, but provider synchronization appends normalized evidence and updates projections through domain commands; it never rewrites manual history or silently wins a conflict.

### Manual operation and automation contract

- Each capability defines its own provider-neutral commands and normalized input/output contracts before adding a provider adapter, scheduled job, importer, webhook, or polling worker. Do not replace these focused contracts with one generic supply-chain command.
- Customer/staff UI, manual imports, scheduled jobs, API results, webhooks, and polling are input adapters to the same capability commands. They operate on the same canonical aggregate; a later provider identity attaches to an existing manual record instead of creating a copy or resetting state.
- Payload admin actions and focused operator screens call those commands. Staff do not edit lifecycle states, balances, provider projections, or synchronization checkpoints directly.
- Manual operation is the baseline adapter, not an outage-only mode. It must support creating, advancing, correcting, and reconciling records within the same business rules used by automation. Corrections append a version or correction event and switch only a guarded projection pointer; they never mutate earlier manual or provider evidence.
- Every command/event records source, actor, idempotency key, aggregate version, correlation and causation identifiers, effective timestamp, local receipt timestamp, and evidence/reference. Provider-specific payloads remain immutable evidence outside the provider-neutral domain projection.
- Provider configuration is replaceable and versioned per provider account and capability, with `disabled`, `observe`, `assist`, and `execute` modes. Credentials stay in environment or secret storage; domain records retain only non-secret provider/configuration identifiers needed to reproduce behavior. Manual operation and reconciliation remain available in every mode.
- Provider-specific identifiers, enums, SDKs, and payload formats remain at the adapter boundary. External references map provider/account/object identities to canonical aggregates; a tracking number alone is never treated as a globally unique identity.
- Side-effecting or asynchronously retried outbound automation is recorded transactionally as an automation request/outbox item. Provider calls happen outside the domain transaction, and their immutable result re-enters through the normal observation path. Read-only quote or validation calls may run synchronously outside a transaction with strict timeouts, immutable response evidence, and an independently operable manual/table path.
- A manual entry can enqueue compatible automation. For example, a guarded carrier and tracking-number command creates a shipment or appends a correction, then an enabled adapter may poll or receive webhooks and append normalized tracking events.
- Duplicate and stale observations are retained as idempotent no-ops. Unmatched observations, manual/provider disagreement, unknown provider outcomes, unsupported automation, illegal transitions, and adapter failure enter an operator queue. There is no global provider-wins or last-write-wins rule; authority and merge rules are explicit per capability.
- Each affected PR tests manual-only operation, automated-only operation where enabled, manual-to-automated continuation, duplicate/reordered input, provider outage, adapter replacement or disablement, and conflict recovery.

## Owner decisions required

These are decision gates, not invitations for an implementation agent to choose defaults:

- Countries and regions served; Jeju, islands, and remote-area handling.
- Shipping methods, rates, free-shipping threshold, carrier or aggregator, and the required manual operating rules.
- Which carrier/tracking adapters and provider accounts may be enabled; capability mode, external-reference matching keys, event authority/merge rules, polling/webhook policy, and conflict-resolution owner. Until approved, shipment and tracking operation remains manual.
- Product weights, dimensions, packaging rules, and dispatch targets.
- Whether prices include VAT; product receipt, cash receipt, and Korean tax-invoice scope.
- Inventory reservation duration; oversell/backorder and split-shipment policy.
- Reservation operator roles, required reason/evidence, and which terminal outcomes an operator may initiate through guarded PR 6A commands.
- Address-book default behavior and whether checkout offers save, update, or create-new choices.
- Manual-payment instructions, reference format, proof requirements, and expiry.
- Request-to-order minimum/maximum unit semantics, close time, failure/refund policy, and production owner.
- Private made-to-order deposit/balance rules, quote validity, specification approval, production milestones, change rules, and cancellation cutoff.
- Return window, return shipping fees, exclusions, inspection outcomes, restocking rules, and exchange policy.
- PII retention, redaction, export, and deletion requirements for commerce records.
- Payment authorization versus immediate capture timing, cancellation authority/fees, and late-capture handling.
- Opening-balance approval, receiving/cycle-count ownership, seller legal identity, and order/receipt numbering.
- PortOne settlement/payout ownership, manual-payment bank matching, finance export format, and period-close owner.

Unknown decisions must be represented as disabled configuration or a documented blocker. They must not become guessed constants or copy.

## Executable PR dependency graph

```text
1 Contracts ── 2 Durable commands/webhooks
     ├── 3 SKUs ── 4 Inventory ledger ── 5 Inbound stock ── 6 Reservations ── 6A Reservation operations
     └── 7 Address versions
3 + 6A + 7 ── 8 Shipping quotes ── 9 Totals/promotions/tax
2 + 6A + 7 + 9 ── 10 Cart/checkout ── 13 Events/outbox
13 ── 11 Card payment; 11A Manual payment; 13A Provider interoperability
11 + 13 ── 12 Refund core ── 11B Stocked-order cancellation
7 + 11 + 13 ── 14 Customer orders; 11B + 12 + 14 ── 14A Support cases
6A + 7 + 8 + 11 + 13 ── 15 Allocation/packages; 13A + 15 ── 15A Shipments/tracking ── 16 Manual operations
13A + 16 ── 16A Optional carrier adapter
12 + 13 + 15A ── 17 Request-to-order
11 + 12 + 13 + 15A ── 18 Private made-to-order
12 + 15A ── 19 Returns/inspection ── 19A Exchanges; 19B Receipts
11 + 12 + 13A ── 20 Settlement/accounting
all domains ── 21 Reconciliation ── 21A Privacy ── 21B Observability/recovery ── 22 Launch gate
```

Parallel groups:

- After PR 1: PRs 2 and 3 can proceed in separate worktrees.
- After PR 3: PRs 4 and 7 can proceed in parallel. After PR 6, PR 6A can proceed independently of PR 7.
- After PR 13: PRs 11, 11A, and 13A can proceed in parallel; PR 11B adopts the same outbox contract. Real carrier work waits for PR 13A, but card-payment work does not.
- After PRs 12, 13, and 15A: PRs 17 and 18 can proceed in parallel. PR 19 follows refund and shipment contracts; there is no refund dependency cycle.
- PR 20 can proceed beside PRs 17–19 once PRs 11–12 and 13A are stable.

Critical path for stocked goods: `1 → 2 → 3 → 4 → 6 → 6A → 8 → 9 → 10 → 13 → 11 → 12 → 11B → 15 → 15A → 19 → 21 → 21B → 22`, with PR 7 required before PR 8, PR 5 required before operational launch, and PR 13A running after PR 13 in parallel with payment work but joining before PR 15A.

Critical path for made-to-order: `1 → 2 → 3 → 4 → 6 → 6A → 10 → 13 → 11 → 12 → 15 → 15A → 17 or 18 → 21 → 21B → 22`; PR 13A runs after PR 13 and joins before PR 15A, and each special-order PR adds its own cancellation effects through shared refund/cancellation APIs.

## PR work packages

Each row is one reviewable PR. Read it together with the corresponding detailed capability phase later in this document.

| PR  | Objective and cold-start context                                                                                                                                                     | Dependencies                | Exact primary targets                                                                                                                   | Tests-first and exit condition                                                                                                                                               | Tier / blockers                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Adopt typed money/snapshot contracts and guarded order/payment transitions on the reviewed PortOne baseline. Current transitions are scattered and the worktree is dirty.            | None                        | `src/lib/lost-commerce/`, ProductOrders and ProductPayments collection paths, `src/payload.config.ts`, `readmes/PORTONE_APPLICATION.md` | Transition, permission, replay tests; existing order/payment writes must use guards.                                                                                         | Strongest; no commercial policy.                                                                                                             |
| 2   | Add durable command idempotency and provider webhook inbox. Current LRU cannot survive restart.                                                                                      | 1                           | `src/lib/api/idempotency.ts`, PortOne webhook route, new `CommerceCommands/` and `CommerceWebhookEvents/`, `src/payload.config.ts`      | Restart, hash-conflict, lease, event-reorder tests; completed business-key/provider uniqueness is permanent.                                                                 | Strongest; TTL only for cached responses/abandoned leases.                                                                                   |
| 3   | Normalize variants into stable active SKUs and immutable line snapshots. Current variants are JSON.                                                                                  | 1                           | Products, new `ProductVariants/`, `src/lib/lost-commerce/query-normalizers.ts`, `cart.ts`, seed tests, `src/payload.config.ts`          | SKU uniqueness, stale ID, snapshot tests; every sellable line resolves to a relational SKU.                                                                                  | Strongest; unknown facts stay inactive.                                                                                                      |
| 4   | Add locations, physical inventory entries, and balance projections. Current stock is an unexplained scalar.                                                                          | 3                           | New `StockLocations/`, `InventoryLevels/`, `InventoryMovements/`, inventory service, `src/payload.config.ts`                            | Concurrent movement, nonnegative, replay, reconstruction tests; on-hand is reconstructible.                                                                                  | Strongest; opening balances require approval.                                                                                                |
| 5   | Add inbound receipts, lots/quarantine, adjustments, and cycle counts. A generic receive adjustment lacks provenance.                                                                 | 4                           | New `InventoryReceipts/` and line/count records, guarded inventory actions/admin, `src/payload.config.ts`                               | Partial receipt, variance, quarantine release, count approval tests; no inbound stock uses naked balance edits.                                                              | Strongest; procurement/costing excluded unless approved.                                                                                     |
| 6   | Add atomic reservations and expiry recovery. Current checkout permanently decrements stock.                                                                                          | 2, 4                        | New `InventoryReservations/`, inventory service, checkout/cancel routes, scheduled job service, `src/payload.config.ts`                 | Last-unit, expiry/payment race, duplicate release/consume, overlapping-job tests; availability/recovery are safe.                                                            | Strongest; TTL/capture timing required.                                                                                                      |
| 6A  | Add guarded reservation operator commands and queues. PR 6 has safe automatic reservation/expiry services but no manual resolution surface.                                          | 5, 6                        | Reservation command service and API/admin actions, active/stuck/review queues, existing reservation collections                         | Authorized manual inspect/release/expire/reconcile, job-outage, payment/expiry race, evidence, replay tests; no direct reservation edits.                                    | Strongest; operator authority and evidence/reason requirements required.                                                                     |
| 7   | Add saved addresses plus append-only order-address versions. Current delivery JSON is untyped.                                                                                       | 1                           | New `Addresses/`, `OrderAddressVersions/`, ProductOrders, checkout/account UI, `src/payload.config.ts`                                  | IDOR, default race, correction/allocation/dispatch race tests; original/current versions are immutable/audited.                                                              | Strongest; countries/save/cutoff required.                                                                                                   |
| 8   | Add delivery eligibility and versioned shipping quotes. Current total has no shipping.                                                                                               | 3, 6A, 7                    | New shipping config, product shipping profiles, `src/lib/lost-commerce/shipping/`, checkout UI, `src/payload.config.ts`                 | Unsupported destination, stale quote, missing physical data tests; configured manual/table delivery can be quoted or rejected.                                               | Strongest; regions, methods, manual rates, packaging, and physical data required; carrier automation optional.                               |
| 9   | Add authoritative totals, promotion redemption, and explicitly enabled tax capability.                                                                                               | 8                           | `src/lib/lost-commerce/pricing/`, commerce promotion/redemption records, ProductOrders totals, checkout UI                              | Rounding, tamper, promotion race, disabled-tax tests; money is reproducible from snapshots.                                                                                  | Strongest; VAT/promotion rules required.                                                                                                     |
| 10  | Complete server cart hydration/merge and atomic checkout conversion. Current UI treats local storage as primary.                                                                     | 2, 6A, 7, 9                 | ProductCarts, `useLostCart.tsx`, cart route, checkout intent/client, `src/payload.config.ts`                                            | Cross-device merge, duplicate submit, stale quote/stock tests; one active cart converts once.                                                                                | Strongest; authenticated checkout remains default.                                                                                           |
| 11  | Complete authoritative PortOne card reconciliation and payment transitions using the transactional outbox API.                                                                       | 10, 13                      | ProductPayments, PortOne webhook/verify/return, payment service                                                                         | Provider ordering, mismatch, replay, and atomic payment-event tests; card state is authoritative and replayable.                                                             | Strongest; authorization/capture timing required.                                                                                            |
| 11A | Add manual-payment instructions, evidence, expiry, bank reference, and guarded approve/reject operations.                                                                            | 10, 13                      | ProductPayments manual fields, admin actions, customer payment state                                                                    | Duplicate approval, late receipt, expiry, role and notification tests; pending is never shown as paid.                                                                       | Strongest; manual policy required or capability stays disabled.                                                                              |
| 11B | Add pre-dispatch stocked-order and manual-pending cancellation using payment/refund, stock, promotion, and outbox contracts. Special-order effects are added in PRs 17–18.           | 6A, 9, 11, 11A, 12, 13      | Cancel route, guarded stocked-order cancellation service/actions                                                                        | Capture/dispatch/expiry races and atomic stock/promotion/manual rollback tests; cancellation either commits all scoped effects or none.                                      | Strongest; authority/fees/cutoff required. If manual payment is disabled, remove that dependency and prove its routes/copy are inaccessible. |
| 12  | Add provider-neutral refund core with refundable-balance reservation plus PortOne V2 and guarded manual-refund adapters.                                                             | 2, 11, 11A, 13              | New Refunds/RefundEvents, PortOne V2 and manual refund adapters, `src/lib/lost-commerce/refunds/`, `src/payload.config.ts`              | Concurrent refunds, crash after provider success, manual bank evidence/authorization, unknown outcome, duplicate response tests; in-flight reservations prevent over-refund. | Strongest; manual refund and approval ownership required. If manual payment is disabled, its adapter stays inaccessible.                     |
| 13  | Add transactional domain events/outbox, worker leases, retries, and dead-letter replay before payment/cancellation adoption.                                                         | 2, 10                       | New CommerceEvents/OutboxJobs, Notifications integration, job service, `src/payload.config.ts`                                          | Rollback/no-send, duplicate delivery, overlap, retry/dead-letter tests; shared event API is ready for PRs 11, 11A, 11B, and 12.                                              | Strongest; channels/runner required.                                                                                                         |
| 13A | Add reusable provider observations, external references, capability modes, automation requests, sync checkpoints, conflict queues, and adapter conformance.                          | 2, 13                       | New ProviderObservations/ExternalReferences/ProviderCapabilities/AutomationRequests/SyncCheckpoints, adapter-boundary services          | Duplicate/stale/unmatched/conflict observation, manual attachment, mode, outage, replacement, replay tests; disabled/test configuration requires no live provider.           | Strongest; provider-specific authority rules gate only that adapter's execution mode.                                                        |
| 14  | Add customer address management plus order list/detail and safe bilingual timelines.                                                                                                 | 7, 11, 13                   | LOSTINSEOUL address/order pages and messages                                                                                            | IDOR, raw-state leakage, address/archive, bilingual Playwright tests; customers see only owned mapped data.                                                                  | Default plus strongest security review.                                                                                                      |
| 14A | Add minimal support cases/interactions with separate internal/customer notes and guarded domain actions.                                                                             | 11B, 12, 14                 | New `CommerceSupportCases/`, support UI/actions, `src/payload.config.ts`                                                                | Ownership, note visibility, resend/correction/cancel/refund authorization tests; support never edits lifecycle fields.                                                       | Strongest security review; support ownership required.                                                                                       |
| 15  | Add line allocation, pick/pack quantities, packages, inventory consumption, and address-version freeze.                                                                              | 6A, 7, 8, 11, 13            | New fulfillment/allocation/package collections, inventory service, `src/payload.config.ts`                                              | Quantity balance, over-allocation, consume replay, address-freeze tests; allocation/package core balances.                                                                   | Strongest; split/consume point required.                                                                                                     |
| 15A | Add provider-neutral shipment records, manual carrier/tracking commands, normalized observation ingestion, partial shipment, delivery/exception states, and customer shipment view.  | 13A, 15                     | New Shipments/ShipmentEvents, tracking command/event service, order detail                                                              | Manual-only, normalized-observation fixture, duplicate/reordered events, partial shipment, failed-delivery, visibility tests; projection is replayable.                      | Strongest; manual operation required; real carrier execution remains optional PR 16A.                                                        |
| 16  | Add focused manual fulfillment/inventory queues, guarded staff actions, an adapter registry, and provider-neutral conformance fixtures.                                              | 5, 13A, 15A                 | Payload admin components/actions, manual carrier adapter, adapter registry/test fixtures, exception queues                              | Role, pick/pack/dispatch, manual tracking, fixture-based handoff/outage/disablement/replacement, recovery E2E; no live provider required.                                    | Default with strongest review; fulfillment roles and label/dispatch rules required.                                                          |
| 16A | Add one approved replaceable carrier/tracking adapter without changing the manual workflow or canonical shipment model.                                                              | 13A, 16                     | Selected adapter, webhook/polling workers, provider configuration, sandbox tests                                                        | Manual-to-provider continuation, webhook/poll duplicate, outage/catch-up, disablement/replacement, sandbox E2E; manual operation remains available.                          | Optional; carrier/account/authority/synchronization approval required or the package is skipped.                                             |
| 17  | Complete request-to-order unit commitments, deadline close, failed-campaign refunds, production batches, and campaign-specific cancellation through shared cancellation/refund APIs. | 12, 13, 15A                 | ProductOrderCampaigns, commitment/batch/milestone records, finalizer, customer/admin UI                                                 | Capacity/deadline/payment/refund/cancel race tests; campaign cancellation updates commitment and refund effects atomically.                                                  | Strongest; unit/deadline/refund/milestone rules required.                                                                                    |
| 18  | Complete private quote revisions, acceptance, payment, specifications, production, and private-order cancellation through shared cancellation/refund APIs.                           | 11, 12, 13, 15A             | Private quote API/UI, QuoteRevisions/SpecApprovals/Production records, admin/customer UI                                                | Stale/tampered quote, approval, payment, refund/cancel, milestone tests; accepted terms and cancellation effects are auditable.                                              | Strongest; quote/deposit/change/cancel rules required.                                                                                       |
| 19  | Add return requests, line eligibility, inbound return shipment, inspection, and inventory disposition using refund core.                                                             | 12, 15A                     | Return/inspection records, inventory disposition, customer/admin UI                                                                     | Eligibility, repeated quantity, inspection, bucket-release, and enabled card/manual refund E2E tests; return quantities/money/stock balance.                                 | Strongest; return/inspection rules required.                                                                                                 |
| 19A | Add exchanges as linked replacement orders and fulfillment, never mutation of the original order.                                                                                    | 19                          | Exchange linkage, replacement order/stock services, customer/admin UI                                                                   | Exchange stock failure, duplicate replacement, refund-difference tests; both orders remain auditable.                                                                        | Strongest; exchange pricing/shipping rules required.                                                                                         |
| 19B | Add immutable product receipt data, numbering, and PDF/download surface.                                                                                                             | 12, 19                      | Product receipt records/PDF, customer/admin surface                                                                                     | Partial refund, numbering race, seller snapshot, access tests; historical receipts remain correct.                                                                           | Strongest; seller/tax-document scope required.                                                                                               |
| 20  | Add PortOne settlement/payout/fee/net reconciliation, manual payment/refund bank matching, immutable finance export, and close evidence.                                             | 11, 11A, 12, 13A            | Settlement snapshots/lines, finance reconciliation service/queue/export, `src/payload.config.ts`                                        | Gross-fee-net, payout mismatch, duplicate import, manual receipt/refund match, provider/manual continuation tests; finance explains receipts through close.                  | Strongest; owner/export/numbering required.                                                                                                  |
| 21  | Add domain reconciliation reports, exception queues, leases, and safe replay commands.                                                                                               | 13–20                       | Scheduled jobs, Payload queues, reconciliation services                                                                                 | Induced drift, overlap, partial replay tests; every invariant has a resolvable queue/report.                                                                                 | Strongest; operations ownership required.                                                                                                    |
| 21A | Add commerce PII retention, export, redaction, and deletion behavior with statutory-data preservation.                                                                               | 14A, 19B, 21                | PII services/actions and audit records                                                                                                  | Access, retention boundary, redaction, export, legal-record preservation tests.                                                                                              | Strongest security/privacy review; retention rules required.                                                                                 |
| 21B | Add structured metrics/alerts plus provider outage, backup/restore, replay, and recovery runbooks/drills.                                                                            | 21, 21A                     | Metrics/logging, alert integration, `readmes/` runbooks                                                                                 | PII-free logs, alert dedupe, restore/reconcile, provider/refund/outbox failure drills.                                                                                       | Strongest; on-call/alert destination required.                                                                                               |
| 22  | Run bilingual E2E, security, migration-upgrade, accessibility, sandbox, failure-drill, and release gates, including enabled manual payment/cancellation/refund.                      | All enabled PRs through 21B | Playwright suite, migrations, messages/legal pages, release/runbooks                                                                    | All enabled card/manual payment and refund matrices pass with zero critical/high findings and owner go/no-go.                                                                | Strongest review; no deploy authorization.                                                                                                   |

### Common execution contract for every PR

- Read `AGENTS.md`, `readmes/MIGRATIONS.md`, this plan, the named existing paths, nearest tests, and access-control patterns before editing. Register every new Payload collection in `src/payload.config.ts`.
- Write failing unit tests and, where the change crosses PostgreSQL or HTTP, real-PostgreSQL integration tests before implementation. UI PRs add focused Playwright coverage in the same PR.
- Every schema PR changes Payload collection/global/field/plugin config first, runs `rtk pnpm micreate`, and reviews the generated migration. Do not draft the schema migration manually. Edit that migration only for mandatory idempotency safeguards or a documented operation the Payload generator cannot express; mark true schema overrides with `WHY-OVERRIDE-PAYLOAD`. Then run `rtk pnpm generate:schema` and `rtk pnpm generate:types` and review the regenerated artifacts without editing them. Run destructive reset verification such as `rtk pnpm migrate:fresh` only with explicit approval; otherwise report it as not run. Never hand-edit `src/payload-generated-schema.ts` or `src/types/payload-types.ts`.
- Require at least 80% coverage for new or changed domain modules. Run focused TypeScript checks or prove the repository TypeScript error baseline does not increase; `build` alone is not a type-safety gate because the project currently ignores build-time TypeScript errors.
- Security-sensitive PRs get security review in that PR for IDOR, mass assignment, CSRF, webhook authenticity/replay, roles, PII logging, and secrets.
- For every supply-chain capability touched, identify its guarded manual commands, optional automation adapters, shared normalized events, operator queue, and manual-to-automated continuation path. Test the enabled combinations in that PR.
- Minimum checks: focused Vitest, real-PostgreSQL integration tests, direct ESLint on changed paths, focused typecheck/baseline check, `rtk pnpm build`, and `rtk git diff --check`. UI PRs add focused Playwright; schema PRs add the migration checks above.
- Exit requires test/migration evidence, access review, neutral bilingual copy, rollback instructions, and no unrelated diff. Rollback disables new writes first and preserves audit/provider/financial evidence.
- Branch names use `feat/lost-commerce-NN-short-name` (`test/` for PR 22). If a row grows beyond one reviewable PR, mutate this plan before coding.

## Branch and execution protocol

- Establish a clean, reviewed baseline branch after the current PortOne hardening is accepted.
- Create one branch and preferably one git worktree per numbered PR work package below.
- The 12 capability phases later in this document are specifications, not branch units. Each PR contains one numbered work package only. If a package grows, split it in this plan before implementation.
- Rebase dependent work on the accepted predecessor. Do not merge parallel schema branches without regenerating and reconciling the migration index.
- Before every PR: inspect `rtk git diff`, run the step checks, run affected integration tests, check secrets and authorization, and document migration/rollback behavior.
- No commit, push, PR creation, deploy, database mutation outside a disposable test database, or external provider mutation without explicit approval.

---

## Capability phase 1 — Commerce contracts, state machines, and reviewed baseline

**Objective:** Establish the domain rules and a clean code baseline before adding more commerce behavior.

**Cold-start context:** Current lifecycle values are spread across Payload collections and route handlers. Generic collection editing can bypass rules. The current worktree includes uncommitted payment reconciliation. Start by reviewing and isolating that work; do not overwrite unrelated files.

**Dependencies:** See the authoritative PR work-package table. Capability phases do not define execution order.

**Model tier:** Strongest available model; architecture, authorization, and payment-state review are required.

**Target areas:** `src/lib/lost-commerce/`, ProductOrders, ProductPayments, ProductOrderCampaigns, commerce tests, `readmes/PORTONE_APPLICATION.md`, and a repo-local commerce decision record in the existing `readmes/` structure.

**Tasks:**

- Write failing transition-table tests for order, payment, reservation, fulfillment, shipment, production, return, and refund states.
- Define typed money, contact, address-snapshot, SKU-snapshot, totals, and actor/audit contracts without migrating operational JSON yet.
- Implement guarded transition functions with allowed source/target pairs, required timestamps, permissions, terminal-state behavior, and idempotent replay behavior.
- Add an immutable commerce event/audit collection contract and database constraints for stable order reference and provider identifiers.
- Record every unresolved owner decision above as `confirmed`, `disabled`, or `blocking`; do not assign values.
- Review the current PortOne reconciliation changes and establish the branch point for subsequent PRs.

**Tests first:** Transition matrices, illegal transition rejection, duplicate command replay, terminal-state protection, role checks, money integer/currency validation, and immutable snapshot tests.

**Migration/types:** Add only foundational enums, indexes, constraints, and audit/event storage. Migration must be idempotent. Run type and schema generation; inspect the generated diff.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm exec eslint src/lib/lost-commerce 'src/payload/collections/(consumption)/ProductOrders' 'src/payload/collections/(consumption)/ProductPayments'
rtk pnpm build
```

**Exit criteria:** State contracts are tested and used by at least one existing payment/order path; no generic route can perform a newly guarded transition directly; unresolved policy is explicit; the next branches have a clean baseline.

**Rollback:** Revert service adoption and additive schema in reverse order. Preserve audit records if any non-test data was written; use a forward repair rather than deleting evidence.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Do not decide commercial policy, redesign checkout, or normalize every collection in this step.

---

## Capability phase 2 — First-class products, variants, and SKUs

**Objective:** Replace operational dependence on opaque variant JSON with stable, validated SKU records and immutable order-line snapshots.

**Cold-start context:** Products currently have scalar inventory and a described-but-untyped variants JSON array. Variant IDs have no referential integrity or SKU uniqueness. Existing seed data contains legacy or unconfirmed values and must not be treated as truth.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest for schema/backfill design; default is acceptable for bounded admin fields after review.

**Target areas:** Products, a new ProductVariants/SKUs collection, query normalizers, cart resolution, seed scripts, order-line snapshot types, migrations, and catalog tests.

**Tasks:**

- Write failing tests for unique SKU, stable variant identity, active/inactive behavior, product ownership, price override rules, and snapshot immutability.
- Add first-class variant/SKU records with active state, option values, price override, barcode if used, weight, dimensions, and shipping profile references. Keep unknown physical data nullable and block shipping until supplied.
- Add database uniqueness and relational integrity for SKU and product/variant references.
- Port read paths through a compatibility adapter, backfill only verifiable existing values, and leave unconfirmed catalog records inactive with zero sellable stock.
- Update order lines to persist immutable product, SKU, options, unit-price, currency, quantity, weight, and tax-category snapshots.
- Remove operational writes to variant JSON only after all production callers use the new model.

**Tests first:** Concurrent duplicate SKU creation, inactive SKU purchase, stale variant ID, price override, invalid option combination, snapshot survival after catalog edit, and seed-truth tests.

**Migration/types:** Idempotent creation, indexes, constraints, guarded backfill, and compatibility views/adapters if needed. Regenerate Payload types and schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce src/scripts/seedLostProductCatalog.test.ts
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint 'src/payload/collections/(consumption)/Products' src/lib/lost-commerce
rtk pnpm build
```

**Exit criteria:** Every sellable line resolves to a stable active SKU; duplicate SKUs are impossible at the database boundary; order history does not depend on current catalog values; unverified products remain unsellable.

**Rollback:** Keep the old JSON read adapter for one release boundary. Roll back reads before dropping new relations; do not discard captured snapshots.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Do not invent prices, SKU codes, weights, dimensions, edition counts, or option labels. Product content redesign is out of scope.

---

## Capability phase 3 — Customer address book and immutable delivery snapshots

**Objective:** Provide structured saved addresses, explicit checkout reuse/save behavior, and immutable order delivery data.

**Cold-start context:** Checkout currently collects name, email, phone, one free-text address, and a note, then accepts arbitrary `shipping` and `contact` JSON. A saved address is mutable customer data; a placed-order address is historical operational data. They must never be automatically synchronized after order placement.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest for PII/authorization and snapshot semantics; default for the bounded address UI.

**Target areas:** New customer Addresses collection, authenticated address APIs/actions, checkout server/client pages, ProductOrders snapshot fields, account address-management page, messages, migrations, and tests.

**Tasks:**

- Write failing ownership, validation, default-address, snapshot, and concurrency tests.
- Define a country-aware structured address contract: recipient, phone, postal code, address lines, locality/city, region, country, and delivery note. Required fields vary only through explicit supported-country configuration.
- Keep structured manual entry and guarded staff correction complete without a validation/geocoding provider. Any later adapter records evidence and suggestions through the same address commands; it cannot silently rewrite an address or claim shipping eligibility.
- Add customer-owned saved addresses with one database-enforced default per user and soft archival when referenced.
- Add list/create/update/archive/set-default commands with server-side ownership checks and normalized input.
- Add checkout prefill and explicit `use once`, `save new`, or `update saved` behavior after the owner selects the desired choices. No implicit profile overwrite.
- Persist the immutable original normalized contact/address snapshot as `OrderAddressVersion` 1 on order creation.
- Store an audited `selected_fulfillment_address_version` pointer. A staff-authorized pre-cutoff correction appends a version and atomically switches that pointer; it never edits an earlier version or the address book. Allocation/label/dispatch locks the pointer according to confirmed policy, and each shipment copies the selected version.
- Define PII redaction/export hooks consistent with the confirmed retention rule.

**Tests first:** Cross-user access denial, invalid country/postcode combinations, complete manual entry with no provider, two simultaneous default updates, editing/deleting a saved address after purchase, original/version immutability, and correction racing allocation, label creation, and dispatch. Suggestion acceptance/rejection belongs to the later PR that actually introduces a validation/geocoding adapter.

**Migration/types:** Add address records and typed snapshot fields. Preserve legacy JSON read-only during backfill; do not fabricate structure from ambiguous free text. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce 'src/app/api/lost/**/route.test.ts'
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint 'src/app/(frontend)/(site)/(pages)/lostinseoul/checkout' src/lib/lost-commerce
rtk pnpm build
```

**Exit criteria:** Customers can manage only their addresses; checkout uses validated structured delivery data; past orders remain unchanged after address edits; all correction actions are audited.

**Rollback:** Disable address-book UI and retain order snapshots. Fall back to one-time structured entry; never resume arbitrary JSON acceptance.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Supported countries, validation provider, default/save behavior, and retention policy require owner decisions. Do not claim address deliverability merely because syntax validation passes.

---

## Capability phase 4 — Inventory ledger, locations, and expiring reservations

**Objective:** Make inventory auditable and recoverable, with atomic SKU reservations that expire safely.

**Cold-start context:** Checkout currently locks products and immediately decrements scalar or JSON inventory. This prevents a narrow oversell race, but it conflates on-hand stock with a reservation and abandoned pending payments may hold units forever. Made-to-order capacity must not be represented as ordinary finite stock.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest; concurrency and accounting invariants are critical.

**Target areas:** New StockLocations, InventoryLevels, InventoryMovements, and InventoryReservations collections/tables; checkout inventory service; cancellation/payment hooks; authenticated expiry job; admin action APIs; migrations and tests.

**Tasks:**

- Write failing concurrency tests before changing the current decrement path.
- Add a default stock location without assuming multiple active warehouses.
- Model on-hand projections by SKU/location and disposition bucket from append-only physical entries. Only the `available` bucket contributes to sellable on-hand; quarantine, damaged, inspection-pending, returned-pending-release, and discarded never do. Model reserved projections from reservation entries. Use the exact equation in the global invariants and do not record reserve/release as physical on-hand movements.
- Use one documented lock order for every stock command: SKU/location inventory aggregate, then reservation, then order/payment as applicable. Add database uniqueness/check constraints so duplicate idempotency keys or negative projections cannot commit.
- Add reasoned opening, receive, adjust, damage, return, consume, and transfer physical entries, plus separate reserve/release/expire/consume reservation entries, each with actor, source, and idempotency key.
- Add inbound receipt/line/lot evidence with expected versus received quantities, supplier/reference when known, partial receipt, quarantine-to-available release, cycle count, and approved opening balance. Procurement remains excluded.
- Keep receiving, release, count, adjustment, damage, and transfer fully operable through guarded manual commands. Any later scanner, file-import, supplier, warehouse, or ERP adapter must call those commands rather than write ledger state directly.
- The completed PR 4/5 guarded inventory commands are the accepted manual baseline. Adapter conformance and manual-to-automated continuation are prospective PR 13A/16/21 work and use additive forward migrations; do not alter PR 1–6 migrations or claim the historical gates covered adapter behavior.
- Add reservation rows tied to order/line/SKU/location with status and `expires_at`.
- Reserve atomically at checkout, consume on the confirmed business point, release idempotently on cancellation/failure/expiry, and define late-payment handling.
- Add a leased, authenticated expiry/recovery job using the repository's confirmed production scheduling mechanism; document overlap protection and secret rotation. An endpoint alone is not sufficient. Add reconciliation against reconstructed physical and reservation entries.
- Remove direct inventory editing from routine Payload admin use; expose guarded actions instead.

**Tests first:** Two buyers competing for the last unit, duplicate reserve/release/consume, expiry race with payment confirmation, late provider event, manual receipt/count/adjustment/transfer, partial inbound receipt, quarantine release, cycle count, proof that quarantined/damaged/inspection-pending/returned-before-release units cannot be reserved, negative balance rejection, deterministic lock order, transaction rollback, and reconstruction from append-only entries.

**Migration/types:** Add tables, unique constraints, check constraints, locks/indexes, and guarded backfill from verified SKU balances. Make every operation idempotent. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce src/app/api/lost/checkout
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/lib/lost-commerce 'src/payload/collections/(consumption)'
rtk pnpm build
```

**Exit criteria:** No checkout path writes a naked inventory scalar; availability is computed consistently; reservations expire and recover; every balance change is explainable; the last-unit race is proven safe.

**Rollback:** Keep a feature flag that routes new reservations off before rollout. Preserve ledger and reservation rows. Restore legacy reads only after reconciling balances; do not delete movement history.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Reservation duration, backorder, safety stock, allocation, and consume timing require owner decisions. Do not model made-to-order as unlimited or negative inventory.

### Reservation operator surface (PR 6A)

**Objective:** Make the completed reservation subsystem operable during job failure, stuck state, and manual review without exposing direct collection edits or weakening payment/inventory invariants.

**Tasks:**

- Add authorized inspect, release, expire, and reconcile commands plus a guarded command to run eligible expiry work. Each command requires reason/evidence, idempotency, expected state/version, and an audit event.
- Do not expose a generic force-status command. Reservation consumption remains part of authoritative payment/order reconciliation; an operator resolves payment evidence through that command, not by marking a reservation consumed.
- Add active, expiring, stuck, and `paid_inventory_review` queues with links to order, payment, reservation history, physical inventory evidence, and the permitted commands.
- Serialize manual commands against checkout, payment, cancellation, and the expiry worker using the existing lock order and transaction boundary.
- Keep PR 6 collection and migration history unchanged. Any command/evidence schema additions start in Payload configuration and use a new additive Payload-generated migration.

**Tests first:** Unauthorized action, missing reason/evidence, duplicate command, manual release versus payment, manual expiry versus worker, stuck-state reconciliation, payment-review resolution, rollback, queue visibility, and expiry-job outage with full manual recovery.

**Exit criteria:** An authorized operator can inspect and safely resolve every nonterminal reservation path without direct field edits; automated expiry can stop and resume without losing or duplicating work; payment and inventory invariants still hold.

**Rollback:** Disable mutating operator actions while retaining read-only queues and evidence. Automated PR 6 behavior remains intact; do not remove reservation history.

**Branch/PR:** Use PR 6A from the work-package table.

**Blockers/non-goals:** Operator roles, acceptable evidence, and which terminal outcomes may be initiated manually require owner approval. No command may fabricate payment or physical stock.

---

## Capability phase 5 — Shipping eligibility, rates, promotions, tax, and totals

**Objective:** Produce a server-authoritative, versioned checkout quote for the exact SKU quantities and delivery destination.

**Cold-start context:** Current totals equal product subtotal. The code has a disconnected Coupons collection and copy that mentions charges or timelines the system does not calculate. A valid address is not automatically a supported delivery address.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest for money calculations and atomic promotion use; default for configuration/admin UI.

**Target areas:** New ShippingZones/Methods/Rates or equivalent config, product shipping profiles, pricing/quote service, promotion/redemption model, checkout UI, order total snapshots, messages, migrations, and tests.

**Tasks:**

- Write table-driven failing tests for all confirmed pricing and eligibility rules.
- Add destination eligibility and shipping-method selection from structured address plus SKU physical data.
- Add a carrier-neutral shipping quote interface with a configured manual/table-rate implementation. Disable checkout where required owner configuration or physical data is missing.
- Keep manual/table rates fully operable. Any optional read-only quote provider uses the same quote contract outside database transactions, with strict timeouts, immutable response evidence, and configured fallback or explicit rejection.
- Compute integer-money subtotal, discount, shipping, tax, and total on the server with a versioned/expiring quote.
- Add commerce promotions and atomic redemption records with eligibility, usage limits, date windows, and order snapshot. Do not reuse membership coupons without an explicit migration.
- Snapshot rate inputs, method label, charge, tax treatment, promotion effects, currency, and any verified dispatch/delivery estimate on the order.
- Remove or neutralize claims in messages that are unsupported by configured behavior.

**Tests first:** Unsupported address, missing weight/dimensions, boundary zone/postcode, stale quote, price change, free-shipping boundary if configured, promotion limit race, duplicate redemption, currency mismatch, rounding, and tampered client total.

**Migration/types:** Add explicit integer amount fields and constraints. Backfill legacy orders as historical unknowns rather than recomputing them. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce 'src/app/(frontend)/(site)/(pages)/lostinseoul/checkout'
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/lib/lost-commerce 'src/app/(frontend)/(site)/(pages)/lostinseoul/checkout'
rtk pnpm build
```

**Exit criteria:** The server can accept or reject a destination, return selectable configured methods, and reproduce every order total from immutable quote evidence; the client cannot set any money value.

**Rollback:** Disable affected shipping methods/promotions and preserve quote snapshots. Do not silently fall back to free shipping or subtotal-only checkout.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Regions, methods, manual rates, packaging, tax/VAT, promotion policy, and estimates are owner inputs. Carrier/provider selection blocks only that automation, not the manual/table implementation. International duty calculation is excluded.

---

## Capability phase 6 — Durable carts, checkout commands, and payment operations

**Objective:** Complete a retry-safe checkout from server cart through inventory reservation and authoritative payment reconciliation.

**Cold-start context:** The browser cart is the practical UI source; server cart hydration/merge is incomplete and the database does not guarantee one active cart. Process-local idempotency cannot survive restarts. Card reconciliation has recent uncommitted hardening. Manual payment can currently appear successful while still pending and lacks operator commands.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest; money, stock, authentication, and provider events are critical.

**Target areas:** ProductCarts, checkout intent/cancel/verify/return routes, PortOne webhook and payment service, manual-payment service/admin actions, durable command/webhook records, reservation integration, checkout pages, migrations, and tests.

**Tasks:**

- Write failing tests for durable idempotency, restart replay, duplicate submit, stale quote, reservation expiry, and provider-event races.
- Enforce one active cart per authenticated customer; hydrate, merge, recover, and convert carts server-side with deterministic conflict rules.
- Add durable idempotency records with request hash, in-progress ownership, stored result, permanent completed business-key tombstone, and uniqueness. TTL applies only to cached responses or provably abandoned in-progress leases.
- Add a provider webhook inbox with unique provider event identity, payload hash/raw evidence, attempts, processing result, and replay command.
- Make order creation, quote acceptance, reservation, cart conversion, and initial payment record one atomic command boundary.
- Reconcile card payments only from authoritative provider state; verify amount, currency, merchant/store identity, order association, and allowed transition.
- If manual payment remains enabled, add configured instructions, reference, expiry, optional proof, and audited staff approve/reject commands. A pending manual payment must never render as paid or completed.
- After refund-core PR 12, add a guarded pre-dispatch stocked-order/manual-pending cancellation request and staff override. It snapshots eligibility/policy and atomically resolves line quantities, payment/refund or manual-payment state, inventory reservations, promotion redemption, order state, and outbox event while serializing against capture, expiry, and dispatch. Campaign/private-order effects belong to PRs 17–18.
- Add explicit terms/privacy/returns acknowledgment versions to the checkout command after the relevant documents are approved.

**Tests first:** Cross-device merge, replay after idempotency cache cleanup, different payload with the same key, webhook before return, return before webhook, amount mismatch, expired reservation, manual approval race, cancel versus capture/dispatch/expiry, unauthorized staff action, and transaction rollback.

**Migration/types:** Add active-cart uniqueness, durable command and webhook tables, payment evidence fields, manual-payment fields, and acknowledgment snapshots. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/app/api/lost src/lib/lost-commerce
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/app/api/lost src/lib/lost-commerce
rtk pnpm build
```

**Exit criteria:** A retry cannot create a second order or reservation; cart conversion is recoverable; provider events can be replayed; manual payments, if enabled, remain visibly pending until an audited confirmation; stock and payment states remain consistent.

**Rollback:** Disable checkout per payment method, retain command/webhook evidence, release eligible reservations through the guarded service, and use forward reconciliation. Never erase provider evidence.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Guest checkout, manual-payment policy, reservation duration, acknowledgment documents, and payment-method launch set require owner confirmation.

---

## Capability phase 7 — Order events, outbox, notifications, and customer order center

**Objective:** Make order history understandable to customers and make lifecycle notifications durable and replayable.

**Cold-start context:** Customers currently have only a single order-by-reference page showing raw status-like values. Side effects are not driven by a transactional outbox. No direct lifecycle email should occur inside a payment, inventory, or fulfillment transaction.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest for outbox delivery; default for customer UI and localized labels.

**Target areas:** CommerceEvents/OutboxJobs, notification worker/endpoint, existing Notifications provider integration, `/lostinseoul/orders` and order detail, receipt data view, messages, migrations, and tests.

**Tasks:**

- Write failing atomicity and duplicate-delivery tests for event/outbox creation.
- Insert domain event and outbox work in the same database transaction as every relevant state change.
- Add retry/backoff, attempt evidence, dead-letter state, replay command, and deduplication per recipient/channel/event.
- Map internal states to compact bilingual customer labels and allowed timeline events; exclude provider payloads, raw enums, and staff notes.
- Add authenticated order list and expanded detail with item, amount, payment, delivery snapshot, production/fulfillment placeholders, and permitted actions.
- Add email/in-app templates only for confirmed events. Every message must derive any amount or date from stored snapshots.
- Add customer-support lookup by stable order reference with audited staff access.

**Tests first:** Transaction rollback leaves no deliverable event, duplicate job delivery, retry then success, dead-letter, cross-user order access, raw-state leakage, absent estimate, and bilingual key parity.

**Migration/types:** Add event/outbox storage and indexes. Preserve existing event JSON only as historical provider evidence; do not pretend it is a complete order timeline. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce src/providers/Notifications 'src/app/(frontend)/(site)/(pages)/lostinseoul/orders'
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm exec eslint src/lib/lost-commerce src/providers/Notifications 'src/app/(frontend)/(site)/(pages)/lostinseoul/orders'
rtk pnpm build
```

**Exit criteria:** Every customer-visible lifecycle change has a durable event; notifications are idempotent and replayable; customers can list and inspect only their orders without raw internal data.

**Rollback:** Pause outbox consumers without rolling back domain transactions. Retain jobs/events for replay; hide incomplete customer timeline sections behind capability checks.

**Branch/PR:** Not authoritative here; use the PR work-package table.

**Blockers/non-goals:** Notification channels and event set require approval. Do not add marketing messages, promises, or live-chat/support tooling.

### Provider interoperability foundation (PR 13A)

**Objective:** Provide one durable, provider-neutral boundary through which manual records, provider observations, and optional automation can coexist without parallel state machines.

**Tasks:**

- Generalize the PR 2 provider inbox through an additive forward Payload-generated migration. Preserve existing evidence and permanent provider-event uniqueness.
- Store immutable observations keyed by unique `(provider, account, capability, providerEventId)` where an event ID exists. When it does not, use a documented provider-specific hash fallback. Record transport, `occurredAt`, `receivedAt`, payload hash/evidence, adapter and schema version, attempts, and immutable outcome: applied, duplicate, stale, unmatched, conflict, rejected, or retryable error.
- Add external references keyed by provider, account, object type, and external object ID; associate them with one canonical aggregate through guarded attach/correct commands. Human references such as tracking numbers are match inputs, not globally unique identities.
- Add provider-account/capability configuration with `disabled`, `observe`, `assist`, and `execute` modes. A disabled or test configuration must require no live provider account.
- Add synchronization checkpoints/cursors and conflict queues as single sources of truth. Add guarded attach, ignore-with-reason, correct, and replay commands for unmatched or conflicting observations.
- Add transactional automation requests for side-effecting or asynchronously retried work. Provider calls run outside domain transactions and immutable results re-enter through the observation path.
- Publish adapter conformance fixtures for manual-to-automated continuation, automated-to-manual recovery, duplicate channels, mixed-origin concurrency, outage, disablement, and replacement.

**Tests first:** Duplicate/stale observations, webhook and polling duplicate, event before manual association, ambiguous match, guarded attach/replay, manual/provider race, illegal regression, conflict preservation, all four capability modes, outage/manual continuation, catch-up without duplicates, and adapter/account authorization.

**Migration/types:** Add ProviderObservations, CommerceExternalReferences, ProviderCapabilities, AutomationRequests, SyncCheckpoints, and conflict records through Payload configuration and `rtk pnpm micreate`. Do not alter PR 1–6 migrations. Regenerate types/schema.

**Exit criteria:** Provider inputs cannot bypass domain guards; manual records can acquire provider references without recreation; modes and adapter replacement do not disable manual operation; unmatched/conflicting evidence remains recoverable; no live provider is required to complete the foundation.

**Rollback:** Disable provider capability execution and workers independently. Preserve observations, external references, requests, checkpoints, and conflicts; manual commands remain available.

**Branch/PR:** Use PR 13A from the work-package table.

**Blockers/non-goals:** A real provider, carrier, or provider account is not required. Provider-specific authority rules gate that adapter's `execute` mode only.

---

## Capability phase 8 — Fulfillment, shipments, tracking, and operational admin

**Objective:** Give staff a guarded pick/pack/ship workflow and customers accurate shipment progress, including partial fulfillment where approved.

**Cold-start context:** Fulfillment is currently one coarse field editable through Payload. There are no packages, shipment lines, carrier/service, tracking, labels, partial quantities, delivery events, or exception queues.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest for state/allocation design; default for admin/customer surfaces.

**Target areas:** New Fulfillments, FulfillmentLines, Shipments, Packages, and ShipmentEvents; inventory consumption/allocation; carrier adapter; Payload admin components/actions; customer order detail; messages; migrations and tests.

**Tasks:**

- Write failing allocation and transition tests before building admin UI.
- Add line-level fulfillable, allocated, packed, shipped, delivered, canceled, and returned quantities with database bounds.
- Add fulfillment, package, and shipment records with carrier, service, tracking, dispatch/delivery timestamps, and exception events.
- Implement guarded allocate/pick/pack/dispatch/deliver/exception/cancel commands and address-freeze/correction checks.
- Consume or reclassify inventory at the confirmed operational point and support idempotent rollback before dispatch.
- Define provider-neutral carrier, shipment, and tracking commands with a complete manual adapter first. Manual carrier/service/tracking entry must be enough to operate and display a shipment without any provider integration.
- In PR 15A, store only the shipment's provider-neutral external-reference association and read-only synchronization summary/projection. PR 13A records remain the single source of truth for capability mode, cursors, leases, attempts, errors, and immutable provider evidence.
- In PR 16, add the focused staff queues, manual adapter, adapter registry, disabled/test configurations, and conformance fixtures. No live carrier or provider account is required.
- In optional PR 16A, when staff records a carrier and tracking number, enqueue synchronization only if a compatible approved adapter is configured. Polling and webhooks normalize into the same shipment-event contract and idempotency rules used by manual events.
- In PRs 16 and 16A, allow guarded manual continuation while automation is unavailable or unsupported. Provider/manual conflicts and unknown outcomes enter an exception queue instead of overwriting history.
- Build focused Payload queues for paid-unfulfilled, reserved, packing, dispatch, and delivery exceptions. Remove routine direct state editing.
- Show customer-safe fulfillment and tracking progress derived from shipment events.

**Tests first:** PRs 15/15A cover over-fulfillment rejection, partial shipment, duplicate dispatch event, mixed SKU allocation, cancellation before/after dispatch, address correction cutoff, manual-only tracking, normalized-observation fixtures, duplicate/reordered observation input, failed delivery, inventory consumption, staff permissions, and customer visibility. PR 16 adds manual staff-queue E2E plus fixture-based handoff, outage, disablement, replacement, conflict, and recovery. Optional PR 16A repeats those cases against the approved provider sandbox and real adapter boundary.

**Migration/types:** Add normalized records, quantity checks, provider/account/external-object uniqueness where appropriate, and immutable shipment address/parcel snapshots. Do not make a tracking number globally unique. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce 'src/payload/collections/(consumption)' 'src/app/(frontend)/(site)/(pages)/lostinseoul/orders'
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/lib/lost-commerce 'src/payload/collections/(consumption)' 'src/app/(frontend)/(site)/(pages)/lostinseoul/orders'
rtk pnpm build
```

**Exit criteria:** PR 16 lets staff complete fulfillment and tracking through guarded manual actions with no provider configured; order-line quantities always balance; inventory and shipment transitions are auditable; customers see accurate shipment information; exceptions appear in an operator queue. If PR 16A is enabled, the approved provider adapter can continue from manually entered shipment data without changing history.

**Rollback:** Disable carrier automation and use the manual adapter. Stop new dispatch commands if reconciliation fails; retain shipment evidence and do not rewrite delivered history.

**Branch/PR:** Not authoritative here; use PRs 15, 15A, 16, and optional 16A from the work-package table.

**Blockers/non-goals:** Split-shipment policy, manual label/reference rules, dispatch point, manual delivery-confirmation authority, and address cutoff are required for PRs 15–16. Carrier/account/provider authority and synchronization choices block only optional PR 16A. No carrier is implied.

---

## Capability phase 9 — Request-to-order and private made-to-order production

**Objective:** Turn both special-order modes into explicit, auditable commercial and production lifecycles.

**Cold-start context:** Request-to-order currently increments a paid-order count and starts production at threshold. It does not count units safely at payment transition, close failed campaigns, issue refunds, or track production. Private orders currently create a zero-total quote-request order with arbitrary JSON and no revision/acceptance/payment flow.

**Dependencies:** See the authoritative PR work-package table. Both PRs 17 and 18 depend on refund-core PR 12 where refunds, deposits, balances, or cancellation are enabled.

**Model tier:** Strongest; money, capacity, deadlines, and production obligations are critical.

**Target areas:** ProductOrderCampaigns, new CampaignCommitments/ProductionBatches/ProductionMilestones/QuoteRevisions/SpecApprovals/PaymentSchedules as selected, private quote API/UI, scheduled campaign finalizer, admin production workbench, customer timelines, messages, migrations, and tests.

**Tasks:**

- Write failing state, capacity, deadline, quote-version, and refund-queue tests.
- Represent campaign commitments by ordered units and SKU; enforce open/deadline/min/max under the same lock at confirmed-payment transition.
- Add idempotent deadline finalization for met, failed, and canceled campaigns, with explicit refund work for failed paid commitments.
- Add production batches, allocation, confirmed milestones, responsible actor, and estimate snapshots. Do not create buyer dates from generic campaign copy.
- Make production batches and milestones fully operable through guarded manual commands. Any later workshop, ERP, or logistics adapter must invoke the same commands and append the same normalized evidence.
- Add versioned private quotes with validated SKU/options/specification, itemized totals, expiry, staff issue/revise, buyer accept/decline, and immutable accepted snapshot.
- Add deposit/balance schedules only if confirmed; otherwise require one ordinary payment through payment-operations PR 11.
- Add specification approval and post-approval change/cancellation commands only when policy is confirmed.
- Expose compact customer campaign/quote/production progress and focused staff queues.

**Tests first:** Concurrent final units, payment after deadline, duplicate paid event, quantity decrement/refund, failed campaign replay, quote tampering, stale quote acceptance, unauthorized revision, deposit overpayment, complete manual batch/milestone operation, normalized production observation after manual creation when enabled, provider outage/manual continuation, mixed-origin milestone conflict, milestone reordering, cancellation cutoff, and notification deduplication.

**Migration/types:** Normalize campaign commitments and quote/production evidence. Backfill only provable existing campaign counts; flag mismatches for manual review. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce src/app/api/lost/private-quotes
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/lib/lost-commerce src/app/api/lost/private-quotes
rtk pnpm build
```

**Exit criteria:** Campaigns close without direct state edits; unit capacity cannot overrun; failed commitments enter an auditable refund path; private quotes can be revised and accepted exactly once; staff can operate production through guarded manual commands with no adapter configured; any enabled adapter uses the same commands and conflict rules; production progress contains only verified data.

**Rollback:** Stop new campaigns/quotes and scheduled transitions. Preserve commitments, accepted quotes, payments, and production evidence; resolve existing obligations through operator queues.

**Branch/PR:** Not authoritative here; use separate PRs 17 and 18 in the work-package table.

**Blockers/non-goals:** Unit semantics, deadlines, refund policy, deposit/balance, production milestones, estimates, change rules, and cancellation cutoff are owner decisions. No unlimited capacity or automatic promise dates.

---

## Capability phase 10 — Returns, exchanges, refunds, restocking, and product receipts

**Objective:** Provide a complete post-delivery resolution flow with bounded refund accounting and inventory disposition.

**Cold-start context:** Product payment statuses mention refunds and an older PortOne refund helper exists, but there is no return domain, caller, inspection, restock decision, exchange order, product receipt, or V2 refund reconciliation. The existing Invoices collection is tied to subscriptions and is not a product receipt model.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest; provider money movement, legal policy, and inventory accounting are critical.

**Target areas:** New ReturnRequests/ReturnLines/ReturnShipments/Inspections/Refunds/RefundEvents; PortOne V2 refund adapter; exchange replacement linkage; inventory movements; product receipt model/PDF endpoint; customer/admin UI; messages; migrations and tests.

**Tasks:**

- Write failing refund-bound, eligibility-snapshot, and restock tests before provider integration.
- Add buyer return request with order-line quantities, reason, optional evidence, policy/version snapshot, and eligibility result.
- Add approve/reject, inbound shipment, receive, inspect, and disposition commands with role checks and audit events.
- Keep return shipment, receipt, inspection, and disposition fully operable through guarded manual commands; optional carrier/provider data may continue those records through the same normalized event contracts.
- Add refund records separate from payment state. Before any provider call, lock the payment/refund aggregate and reserve refundable balance transactionally using `available_refund = captured - succeeded - in_flight_reserved`. Successful plus in-flight reserved amounts may never exceed captured money.
- Implement durable command/provider idempotency for PortOne V2 full/partial refunds. Release an in-flight reservation only after authoritative failure or cancellation; retain an `unknown` outcome for reconciliation instead of guessing. Keep provider evidence immutable.
- When manual payment is enabled, implement a provider-neutral manual-refund adapter and guarded staff commands with bank reference/evidence, submitted/succeeded/failed/unknown states, the same refundable-balance reservation, and finance reconciliation. A staff note alone is not proof of refund.
- Add restock, damaged, quarantine, and discard movements from explicit inspection outcomes.
- Model exchange as a linked replacement order/fulfillment, not mutation of the original order.
- Add product receipt documents with immutable seller, buyer, line, totals, tax treatment, payment, refund, and numbering snapshots. Treat Korean cash receipt/e-tax invoice as separate integrations.
- Add customer status/actions and staff return/refund queues.

**Tests first:** Return-window boundaries, partial quantities, repeat request, complete manual return-shipment/receive/inspect/disposition operation, normalized carrier observation after manual creation when enabled, provider outage/manual continuation, provider/manual conflict and replay, concurrent campaign/customer partial refunds, crash after provider success before local commit, duplicate provider response, unknown provider outcome, authoritative failure release, manual-refund authorization/evidence/reconciliation when enabled, webhook/command ordering, damaged disposition, exchange stock failure, receipt after partial refund, permissions, and PII exposure.

**Migration/types:** Add normalized return/refund/receipt records, sum/bounds enforcement through transactional locks and checks, provider uniqueness, and document numbering. Regenerate types/schema.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce src/app/api/lost
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/lib/lost-commerce src/app/api/lost
rtk pnpm build
```

**Exit criteria:** Eligible customers can request returns; staff can inspect and resolve them without direct field edits; in-flight reservation makes over-refund impossible under concurrency or crashes; unknown outcomes remain blocked pending authoritative reconciliation; inventory disposition is explained; product receipts remain historically correct.

**Rollback:** Disable new return intake or automated provider submission while keeping manual operator queues. Never delete refund/provider evidence or restock without an inspection outcome.

**Branch/PR:** Not authoritative here; use separate PRs 19, 19A, and 19B in the work-package table.

**Blockers/non-goals:** Return eligibility, fees, exclusions, inspection outcomes, exchange rules, tax document scope, and refund approval authority require owner/counsel input.

---

## Capability phase 11 — Reconciliation, exception queues, privacy, and recovery

**Objective:** Make the shopping system operable under failures, drift, retries, and support cases.

**Cold-start context:** Current operations rely mainly on generic Payload collection views and scattered logs. There are no daily invariants, payment/provider reconciliation jobs, dead-letter queues, aging-reservation alerts, campaign deadline reports, shipment exceptions, or PII lifecycle operations.

**Dependencies:** See the authoritative PR work-package table.

**Model tier:** Strongest for reconciliation and recovery; default for dashboards/runbooks.

**Target areas:** Commerce admin dashboard/actions, scheduled jobs, structured logging/metrics, reconciliation queries, export/redaction services, operational runbooks under `readmes/`, integration/E2E tests.

**Tasks:**

- Write invariant tests and failure drills for each domain.
- Add scheduled reports for inventory projections versus reconstructed physical/reservation entries, expired/stuck reservations, paid order versus provider state, order total versus payment, succeeded plus in-flight refund reservations versus captured money, unknown provider refund outcomes, campaign deadlines/capacity, fulfillment quantities, failed webhooks/outbox jobs, and shipment exceptions.
- Add focused Payload queues with stable filters, counts, ownership, guarded actions, and links to audit evidence.
- Add a minimal support-case/interaction record with ownership, separate internal and customer-visible notes, contact history, and guarded resend, replay, address-correction, cancellation, and refund-request actions. Support actions call domain commands; they never edit lifecycle fields.
- Import or query immutable PortOne settlement/payout evidence and reconcile gross, fee, refund, and net to orders/payments/refunds. Add manual bank-receipt matching, refund-liability reporting, immutable finance export, period-close evidence, and exception queues.
- Add structured logs and metrics without contact/address/provider secrets; define alert thresholds only after operational ownership is assigned.
- Add safe replay/reconcile commands for commands, webhooks, outbox events, carrier events, payments, refunds, and jobs.
- Add manual evidence/import and correction commands beside automated reconciliation sources so provider outages or unsupported providers do not make any queue inoperable.
- Implement confirmed retention, export, redaction, and deletion behavior. Preserve statutory/accounting facts while minimizing unnecessary PII.
- Write operator runbooks for provider outage, late payment, stock mismatch, campaign failure, lost shipment, refund failure, and outbox backlog.
- Add backup/restore and reconciliation drills against a disposable environment.

**Tests first:** Induced mismatches, repeated reaper, job overlap, replay after partial failure, manual evidence/import followed by provider synchronization, automated import followed by manual recovery, mixed-origin conflict resolution, provider outage/manual continuation, unknown/in-flight refund reconciliation, settlement gross-fee-refund-net mismatch, duplicate settlement import, manual bank match, support note visibility/action authorization, redaction authorization, PII-free logs, alert deduplication, restore then reconcile, and queue permission checks.

**Migration/types:** Add job leases/checkpoints and any report indexes. Prefer derived reports over duplicate mutable counters. Regenerate types/schema when collections change.

**Verification:**

```bash
rtk pnpm exec vitest run src/lib/lost-commerce src/app/api/lost
rtk pnpm generate:types
rtk pnpm generate:schema
rtk pnpm migrate:fresh
rtk pnpm exec eslint src/lib/lost-commerce src/app/api/lost
rtk pnpm build
rtk pnpm release:check
```

**Exit criteria:** Every material mismatch produces a report or queue; operators can import evidence, attach observations, and safely replay or resolve failures without provider automation; automated sources can resume without duplicating records; logs do not leak PII; recovery drills end with all invariants restored.

**Rollback:** Stop scheduled jobs and alert consumers independently. Preserve checkpoints/evidence. Use read-only reports when mutation commands are disabled.

**Branch/PR:** Not authoritative here; use separate PRs 20, 21, 21A, and 21B in the work-package table.

**Blockers/non-goals:** Alert destinations, on-call ownership, retention periods, and statutory records require explicit decisions. No third-party resource changes in this PR.

---

## Capability phase 12 — End-to-end launch and compliance gate

**Objective:** Prove the selected commerce scope works end to end and that public copy, policy, accessibility, and operational behavior match reality.

**Cold-start context:** The repository contains delivery/refund/checkout copy that may describe behavior not currently implemented. A green unit suite does not prove provider, database concurrency, browser flow, or operator recovery. Launch approval is a separate gate from merging code.

**Dependencies:** See PR 22 in the authoritative work-package table. A disabled optional mode does not block launch if its UI/routes are inaccessible and its copy makes no claim.

**Model tier:** Strongest for final security/data/payment review; default for repetitive browser matrices.

**Target areas:** Playwright commerce suite, mandatory provider-neutral interoperability fixtures, provider/carrier sandbox harnesses for enabled adapters, accessibility checks, security review, bilingual messages and legal pages, release checklist, deployment/runbook docs.

**Tasks:**

- Create an environment matrix covering stocked purchase, payment abandonment/expiry, last-unit concurrency, manual payment if enabled, request-to-order, private quote, partial fulfillment if enabled, delivery exception, cancellation, return, partial refund, exchange, recovery replay, manual-to-automated handoff, automated-to-manual recovery, and mixed-origin concurrency.
- Run real PostgreSQL transaction tests and mandatory provider-neutral interoperability fixtures. Run provider sandbox tests for every enabled adapter; skipped optional adapters do not create a sandbox requirement. Do not mock the only evidence for money or concurrency behavior.
- Run authenticated browser flows for customer, staff, and unauthorized roles in English and Korean.
- Verify accessibility, keyboard operation, error recovery, mobile layout, and no raw enum/PII/provider leakage.
- Audit all commerce copy against configured facts. Remove unsupported rates, timelines, reasons, promises, tax statements, and return assertions.
- Obtain owner/counsel confirmation for seller disclosure, terms, privacy, delivery, cancellation, returns, and tax-document behavior. Record approval/version, not legal interpretation by the implementation agent.
- Conduct security review for IDOR, mass assignment, webhook authentication, replay, CSRF, XSS, rate limits, secrets, staff authorization, and PII logging.
- Test migration upgrade from the reviewed current commerce baseline as well as `migrate:fresh`, then test feature-flag rollback while existing orders remain readable and reconcilable.
- Run backup/restore, failed-webhook, provider-outage, reservation-reaper, refund-failure, and stuck-shipment drills.
- Prepare a reversible rollout with mode-level feature flags, read-only monitoring, and explicit go/no-go owners.

**Tests first:** Treat the launch matrix as acceptance tests. Any unimplemented claimed behavior is a failing test, not a documentation footnote.

**Migration/types:** No new domain schema is expected. Any discovered schema need returns to the relevant earlier step or inserts a reviewed new step; do not patch launch defects with an unplanned production migration.

**Verification:**

```bash
rtk pnpm exec vitest run
rtk pnpm exec eslint src messages
rtk pnpm exec playwright test
rtk pnpm build
rtk pnpm release:check
rtk git diff --check
```

**Exit criteria:** Every enabled mode passes the matrix; owner decisions are configured and reflected exactly in bilingual copy; security/high-severity review findings are closed; recovery drills pass; go/no-go owners sign off. Merging is not deployment approval.

**Rollback:** Feature flags disable checkout or individual modes without hiding existing orders. Preserve read-only customer/order access and operator reconciliation. Follow the existing deployment rollback procedure only with explicit approval.

**Branch/PR:** Not authoritative here; use PR 22 in the work-package table.

**Blockers/non-goals:** No launch while card/manual/refund/reservation failure drills for enabled methods fail. No production deploy, provider activation, legal approval inference, or carrier activation is authorized by this blueprint.

---

## Cross-step acceptance matrix

| Capability     | Required proof                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog        | Stable active SKU, unique constraint, immutable line snapshot                                                                                                            |
| Address        | Ownership, validation, explicit save choice, immutable original plus audited fulfillment-version pointer                                                                 |
| Inventory      | Physical-entry on-hand, separate reservation entries, deterministic locks, expiry, inbound provenance, reconstruction                                                    |
| Pricing        | Server quote reproduces subtotal, discount, shipping, tax, total                                                                                                         |
| Payment        | Durable command/event evidence, authoritative card reconciliation, and guarded manual payment/refund evidence when enabled                                               |
| Order          | Guarded transitions, durable audit, customer-safe state mapping                                                                                                          |
| Fulfillment    | Line quantities balance across allocated/shipped/delivered/canceled                                                                                                      |
| Made-to-order  | Capacity/deadline/quote/production/refund obligations are explicit                                                                                                       |
| Returns        | Eligibility snapshot, inspection, in-flight refundable-balance reservation, authoritative refund reconciliation, explained disposition                                   |
| Finance        | Gross, fee, refund, net, payout, manual receipt, liability, and immutable close export reconcile                                                                         |
| Operations     | Every invariant drift becomes a queue/report with safe recovery and support actions call guarded commands                                                                |
| Interoperation | Every supply-chain capability passes manual-only, manual-to-automated, automated-to-manual recovery, mixed-origin concurrency, and adapter disable/replacement scenarios |
| Localization   | English/Korean key parity and no unsupported promises                                                                                                                    |
| Security       | Customer ownership, staff roles, webhook authenticity, PII-safe logs                                                                                                     |

## Anti-patterns prohibited during execution

- A giant “build the ecommerce backend” PR.
- UI before domain contracts and authorization tests.
- Opaque JSON as operational truth for SKUs, addresses, quotes, shipments, or refunds.
- Scalar inventory edits without movements and reason.
- Hand-written schema migrations when the same shape can be generated from Payload config.
- Reservation implemented as permanent stock decrement with no expiry record.
- Editing saved customer data to change historical orders.
- Direct email or notification inside payment/stock/fulfillment transactions.
- Shipment state stored only as an order status.
- Made-to-order represented as ordinary stock or a generic note.
- Refund represented only by changing payment status.
- Guessed carrier/rate/timeline/legal policy embedded in code or copy.
- Generic Payload field editing as the primary operational workflow.
- A provider SDK, webhook, polling job, or scheduled worker as the only path for a supply-chain transition.
- Separate manual and automated state machines, validations, or event formats for the same business operation.
- Treating manual operation as a global mode switch that disables compatible automation on unrelated records.
- Letting provider synchronization overwrite manual history or resolve a conflict without an audited operator decision.
- Provider SDK imports inside domain command handlers or Payload hooks.
- Direct provider calls inside a domain database transaction.
- Process-local polling cursors, deduplication, retry state, or unmatched-event storage.
- Separate manual/provider aggregates, shadow shipments, or duplicated inventory records.
- Using a tracking number alone as global identity.
- Disabling guarded manual commands when automation is enabled.
- Treating an operator note as operational evidence.
- Silently discarding stale, unmatched, contradictory, or illegal provider observations.

## Plan mutation protocol

- **Split:** Replace one step with numbered substeps, preserve its incoming/outgoing dependencies, and record why reviewable PR size required the split.
- **Insert:** Assign the next suffix (for example, `6A`), state dependencies and consumers, and update both dependency graph and critical path.
- **Reorder:** Only when dependency edges and shared-file ownership are updated first.
- **Skip:** Allowed only for an optional disabled capability. Record how routes, configuration, copy, and tests prove it is unavailable.
- **Abandon:** Record reason, data already created, cleanup/retention action, and which later steps are blocked.
- **Policy change:** Update the decision record, affected tests, stored policy version, and copy. Never silently change historical snapshots.

## Definition of complete

“Complete shopping system” means all enabled sales modes can be purchased, paid, fulfilled or produced, delivered, returned/refunded where permitted, supported, and reconciled without direct database edits or invented customer claims. A collection existing in Payload or a success page rendering is not sufficient.
