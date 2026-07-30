# Commerce system

## Goal

Provide a complete, operational physical-goods shopping system for
LOSTINSEOUL on Next.js, Payload CMS, and PostgreSQL. Enabled sales modes must be
purchasable, payable, fulfillable or producible, supportable, and
reconcilable without direct database edits.

## Boundary

Included:

- Authenticated checkout; guest checkout remains disabled unless approved.
- Stocked goods, request-to-order campaigns, and private made-to-order goods.
- One default stock location with a model that can support more later.
- Explicitly enabled card and manual payment methods.
- Saved addresses and immutable order-address versions.
- Shipping eligibility, server-owned quotes, fulfillment, shipments, tracking,
  cancellation, returns, exchanges, refunds, receipts, and reconciliation.
- Customer, support, finance, fulfillment, and Payload operator surfaces.

Excluded unless approved:

- Marketplace settlement, point of sale, wholesale, subscriptions, digital
  goods, and gift cards.
- Guest checkout, backorders, split shipments, deposits, duties calculation,
  speculative multi-warehouse allocation, and carrier procurement.
- Treating existing translated copy as an executable commercial policy.

## Current baseline

**Committed:** relational SKUs and line snapshots; durable commerce commands
and provider events; guarded order/payment transitions; stock locations;
append-only physical inventory; reconstructible projections; receipts, lots,
quarantine, adjustments, and cycle counts; atomic expiring reservations;
available-to-promise calculation; payment-time consume or review; cancellation
release; recurring expiry recovery; and storefront availability.

**Uncommitted:** PR 6A adds reservation inspection, operator commands, queues,
and immutable outcome evidence. It is blocked by the findings in
[validation.md](validation.md).

**Planned:** address normalization, shipping quotes, authoritative totals,
complete checkout, outbox processing, fulfillment, tracking, made-to-order,
returns, refunds, finance, privacy, and operational recovery.

## State and data ownership

1. PostgreSQL and server domain services own money, stock, payment, order,
   fulfillment, and refund truth. Client values are proposals.
2. Product, SKU, price, discount, tax, contact, address, and shipping data on an
   order are immutable snapshots. Address correction appends a version and
   switches a guarded fulfillment pointer; it never edits the saved address or
   original order version.
3. Physical inventory entries alone change disposition-bucket on-hand.
   Reservation entries alone change active reserved.
4. `available_to_promise = available_on_hand - active_reserved - safety_stock`.
   Quarantine, damaged, inspection, pending-return, and discarded stock is not
   reservable.
5. Order, payment, reservation, fulfillment, shipment, production, return, and
   refund are separate state machines.
6. Commands and observations are durable, idempotent, and concurrency-safe.
   Completed business keys remain permanently unique; only cached responses
   and abandoned leases may expire.
7. Customer responses never expose internal states, provider payloads, or
   operator notes.
8. Lifecycle fields and balances change through guarded commands, not generic
   Payload field edits.
9. Customer records are scoped server-side. Staff mutations require explicit
   roles, a reason, evidence, and audit data.
10. User-facing text remains compact and neutral in both locale catalogs. It
    may not promise an unstored rate, carrier, dispatch date, delivery date, or
    refund outcome.

## Manual operation and automation

Manual operation is the baseline for every supply-chain capability. Automation
is an optional adapter to the same domain behavior.

- Define focused provider-neutral commands and normalized observations before
  adding a provider SDK, webhook, polling worker, scheduled job, or importer.
- Customer UI, staff UI, imports, jobs, webhooks, and polling use the same
  authorization, validation, locks, idempotency, transitions, and evidence.
- Staff screens call commands; they do not directly edit balances, lifecycle
  states, provider projections, or sync checkpoints.
- Manual creation, advancement, correction, and reconciliation remain
  available when automation is enabled, disabled, unsupported, or unavailable.
- Corrections append versions or correction events. Provider synchronization
  never rewrites manual history.
- A later provider reference attaches to the existing aggregate. It does not
  create a parallel order, shipment, inventory record, or state machine.
- Provider identities, enums, payloads, and SDKs stay at the adapter boundary.
  A tracking number is not globally unique identity.
- Provider capability modes are `disabled`, `observe`, `assist`, and `execute`.
  Credentials remain in environment or secret storage.
- Outbound side effects use a transactional request/outbox record. Provider
  calls occur outside the domain transaction and return as immutable normalized
  observations.
- Duplicate and stale observations are idempotent no-ops. Unmatched,
  contradictory, illegal, or unknown outcomes enter an operator queue. There
  is no global provider-wins or last-write-wins rule.

## Payload and migrations

Every schema change starts in Payload collection, global, field, or plugin
configuration. Generate the migration through Payload, then add only the
idempotency guards or documented operations Payload cannot express. Mark real
schema overrides with `WHY-OVERRIDE-PAYLOAD`. Regenerate schema and types; do
not edit generated files manually.

The complete repository procedure is [readmes/MIGRATIONS.md](../../readmes/MIGRATIONS.md).

## Decision gates

| Decision                                                                                   | Needed by          | Current status                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------- |
| Countries, regions, remote areas, address fields, save/default behavior, correction cutoff | PRs 7–8            | Owner-controlled                                                                    |
| Shipping methods, rates, free-shipping rule, package data, dispatch target                 | PR 8               | Owner-controlled                                                                    |
| Carrier adapter, account, authority, matching, polling/webhook, conflict owner             | Optional PR 16A    | Owner-controlled; manual shipment remains baseline                                  |
| VAT treatment, promotions, receipt and Korean tax-document scope                           | PRs 9 and 19B      | Owner-controlled                                                                    |
| Reservation duration, oversell/backorder, split shipment                                   | PRs 6A, 8, 15      | Owner-controlled; unapproved capabilities remain disabled                           |
| Reservation operator authority, reason/evidence, allowed terminal actions                  | PR 6A              | Admin-only release, expire, reconcile, and expiry-run selected for current worktree |
| Manual-payment instructions, reference, evidence, expiry, approval owner                   | PR 11A             | Owner-controlled; capability remains disabled otherwise                             |
| Card authorization/capture timing, cancellation authority, fees, late capture              | PRs 11–11B         | Owner-controlled                                                                    |
| Request-to-order capacity, deadline, failure/refund, production owner                      | PR 17              | Owner-controlled                                                                    |
| Private quote validity, deposit/balance, specifications, milestones, changes, cancellation | PR 18              | Owner-controlled                                                                    |
| Return window, fees, exclusions, inspection, disposition, exchange                         | PRs 19–19A         | Owner-controlled                                                                    |
| Opening balances, receiving/count roles, seller identity, numbering                        | Operational launch | Owner-controlled                                                                    |
| PII retention, export, redaction, statutory preservation                                   | PR 21A             | Owner-controlled                                                                    |
| Settlement owner, bank matching, export, close process                                     | PR 20              | Owner-controlled                                                                    |
| Alert destination and on-call ownership                                                    | PR 21B             | Owner-controlled                                                                    |

Unknown decisions remain disabled configuration or explicit blockers. They are
not implementation defaults.
