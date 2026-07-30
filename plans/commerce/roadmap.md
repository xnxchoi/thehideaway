# Commerce roadmap

## Dependency order

```text
1–3 foundation → 4 ledger → 5 inbound stock → 6 reservations → 6A reservation operations
1 → 7 addresses
3 + 6A + 7 → 8 shipping → 9 totals → 10 checkout → 13 outbox
13 → 11 card payment; 11A manual payment; 13A provider interoperability
11 + 13 → 12 refund core → 11B stocked-order cancellation
7 + 11 + 13 → 14 customer orders → 14A support
6A + 7 + 8 + 11 + 13 → 15 allocation → 15A shipments → 16 manual fulfillment
13A + 16 → 16A optional carrier adapter
12 + 13 + 15A → 17 request-to-order
11 + 12 + 13 + 15A → 18 private made-to-order
12 + 15A → 19 returns → 19A exchanges; 19B receipts
11 + 11A + 12 + 13A → 20 finance
all domains → 21 reconciliation → 21A privacy → 21B recovery → 22 launch
```

PR 6A is the active serial boundary. PR 7 is independent by dependency but
must not start in this worktree until PR 6A is committed.

## Completed work

| Package               | Result                                                                                                     | Commit     |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| PRs 1–3               | Contracts, durable commands/provider events, transitions, relational SKUs, snapshots                       | `b9aa62e1` |
| PR 4                  | Append-only physical inventory and reconstructible projections                                             | `a3b5ef55` |
| PRs 1–4 hardening     | Access, retry, replay, concurrency, and recovery scenarios                                                 | `5b1b85dc` |
| PR 5                  | Receipts, lots, quarantine, adjustments, cycle counts, operator commands                                   | `cba6b4ae` |
| PR 6                  | Expiring reservations, ATP, checkout reservation, payment consume/review, cancellation and expiry recovery | `0607ba0a` |
| PR 6 registration fix | Reservation collections registered with Payload                                                            | `0f1e7001` |
| Supply-chain policy   | Complete manual operation and automation interoperability required                                         | `3fe9ea13` |

`80397ebb` restores product price helpers required by the storefront but is not
a separate roadmap package.

## Active package: PR 6A

**Status:** Uncommitted and blocked.

**Purpose:** Add admin-only inspection and guarded manual `release`, `expire`,
`reconcile`, and `run_expiry` commands without allowing direct reservation
edits or manual consumption.

**Required command input:** reason code, evidence reference, idempotency key,
and expected state hash. Mutations remain disabled unless
`LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE=true`.

**Safety rules:**

- Release only canceled or failed orders that are demonstrably unpaid.
- Reconcile only from stored authoritative PortOne paid evidence.
- Recover paid released/expired reservations through a linked recovery
  reservation.
- Manual and automated expiry use the same locks and transaction rules.
- Mutations, immutable outcome evidence, and command completion commit
  atomically.
- Rejected authenticated commands emit structured, PII-safe security records;
  durable rejection-ledger expansion is deferred to the shared audit/outbox
  design unless separately approved.

**Required remediation before commit:**

1. Remove every internal mutation-gate override; production code consults only
   the environment gate and tests set the environment explicitly.
2. Use one deterministic authoritative-payment selector for queue inspection,
   state hashing, locking, and reconciliation, including multiple payments.
3. Include the relevant inventory availability/version in reconciliation's
   guarded state and business identity so replenishment permits a new attempt
   after `review_remaining`.
4. Reject a release that affects zero reservations.
5. Finish structured rejection logging without logging evidence, request body,
   contact data, or raw provider data.
6. Add the missing PostgreSQL scenarios listed in
   [validation.md](validation.md).
7. Repeat code, database, security, and TypeScript review and resolve every
   critical or high finding.

**Exit:** The focused, PostgreSQL scenario, migration, coverage, lint,
typecheck, diff, and build gates in [validation.md](validation.md) pass. Stage
only PR 6A paths and commit as one reversible package. Do not push.

**Rollback:** Disable operator mutations while retaining read-only queues and
evidence. Existing automated PR 6 behavior remains available. Do not remove
reservation history.

## Planned packages

Every row is one reversible package. The common gate is defined in
[validation.md](validation.md).

| PR  | Depends on             | Deliverable and exit                                                                                                          | Rollback and blocker                                                                               |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 7   | 1                      | Saved addresses and append-only order-address versions; ownership, default-race, immutability, and correction-race tests pass | Disable address book, keep structured one-time entry and snapshots; countries/save/cutoff required |
| 8   | 3, 6A, 7               | Destination eligibility and versioned server shipping quotes; unsupported/stale/missing-data cases fail closed                | Disable affected methods; regions, rates, packaging required                                       |
| 9   | 8                      | Reproducible subtotal, discount, shipping, optional tax, and total snapshots; tamper/rounding/promotion races pass            | Disable promotions/tax, retain quotes; VAT and promotion rules required                            |
| 10  | 2, 6A, 7, 9            | Server cart merge and atomic one-time checkout conversion; duplicate/stale/cross-device tests pass                            | Stop conversion, retain carts/commands/reservations; authenticated checkout remains default        |
| 11  | 10, 13                 | Authoritative PortOne card reconciliation through outbox; ordering/mismatch/replay tests pass                                 | Disable new card intents, continue reconciliation; capture policy required                         |
| 11A | 10, 13                 | Manual-payment evidence, expiry, approve/reject commands, and customer pending state                                          | Keep capability disabled without approved instructions and owner                                   |
| 11B | 6A, 9, 11, 11A, 12, 13 | Atomic pre-dispatch stocked-order cancellation across money, stock, promotion, and outbox                                     | Disable cancellation entry points; authority, fees, cutoff required                                |
| 12  | 2, 11, 11A, 13         | Refund core with in-flight balance reservation, PortOne V2 and guarded manual adapters                                        | Stop new refunds, reconcile retained unknown outcomes; manual refund policy required               |
| 13  | 2, 10                  | Transactional domain events, outbox jobs, leases, retry, dead-letter replay                                                   | Stop workers, retain jobs/events; channel and runner ownership required                            |
| 13A | 2, 13                  | Provider observations, external references, capability modes, automation requests, checkpoints, and conflicts                 | Disable adapter execution, retain evidence; provider authority rules required only for execution   |
| 14  | 7, 11, 13              | Customer address management and owned order list/detail with safe bilingual timelines                                         | Disable UI, retain records; no raw states or internal notes                                        |
| 14A | 11B, 12, 14            | Support cases/interactions and guarded resend, correction, cancellation, and refund actions                                   | Disable support mutations, retain case history; support ownership required                         |
| 15  | 6A, 7, 8, 11, 13       | Allocation, pick/pack quantities, packages, consumption, and address freeze                                                   | Stop new allocation/dispatch, retain evidence; split and consume point required                    |
| 15A | 13A, 15                | Provider-neutral shipments, manual carrier/tracking, normalized events, partial delivery and exceptions                       | Disable new dispatch, retain shipment history; manual operation required                           |
| 16  | 5, 13A, 15A            | Staff inventory/fulfillment queues, guarded actions, manual adapter, conformance fixtures                                     | Disable affected actions, retain records; roles and dispatch rules required                        |
| 16A | 13A, 16                | One approved replaceable carrier/tracking adapter with sandbox evidence                                                       | Optional: skip or disable adapter; carrier/account/authority approval required                     |
| 17  | 12, 13, 15A            | Unit-safe request-to-order commitments, deadline close, refunds, production, cancellation                                     | Stop new campaigns, retain obligations; capacity/deadline/refund rules required                    |
| 18  | 11, 12, 13, 15A        | Private quote revisions, acceptance, specifications, payment, production, cancellation                                        | Stop new quotes, retain accepted obligations; quote/deposit/change rules required                  |
| 19  | 12, 15A                | Return eligibility, inbound shipment, inspection, disposition, refund integration                                             | Stop new returns, preserve open cases; return/inspection rules required                            |
| 19A | 19                     | Exchanges as linked replacement orders, never original-order mutation                                                         | Disable exchanges, retain linkage; pricing/shipping rules required                                 |
| 19B | 12, 19                 | Immutable product receipt data, numbering, and download surface                                                               | Stop generation, preserve issued receipts; seller/tax scope required                               |
| 20  | 11, 11A, 12, 13A       | Settlement, fee, payout, manual bank matching, export, and close evidence                                                     | Stop imports/close, preserve snapshots; finance ownership/export required                          |
| 21  | 13–20                  | Domain reconciliation reports, exception queues, leases, safe replay                                                          | Stop automated repair, retain reports; operations ownership required                               |
| 21A | 14A, 19B, 21           | Commerce PII retention, export, redaction, deletion with statutory preservation                                               | Disable destructive actions, preserve legal records; retention rules required                      |
| 21B | 21, 21A                | PII-safe metrics, alerts, backup/restore, replay, provider and worker recovery drills                                         | Disable automation, use manual runbooks; on-call destination required                              |
| 22  | All enabled            | Bilingual E2E, security, accessibility, migrations, sandbox, failure drills, owner go/no-go                                   | No deployment is authorized by this package                                                        |

## Execution contract

- Read the repository instructions, this directory, nearest implementation,
  nearest tests, and access patterns before editing.
- Write failing tests first. Use real PostgreSQL whenever behavior crosses
  transactions, constraints, locks, or migrations. UI packages add Playwright.
- Apply the Payload-first migration procedure in [system.md](system.md).
- Require at least 80% coverage for new or changed domain modules.
- Run focused tests, PostgreSQL scenarios, ESLint, focused TypeScript checks,
  build, and `git diff --check`. Security-sensitive packages receive security
  review.
- Test manual-only operation and every enabled manual/automation handoff,
  outage, duplicate, ordering, conflict, disablement, and replacement path.
- Exit requires evidence, access review, neutral bilingual text, rollback, and
  no unrelated diff.
- Commit each package independently after its gate passes. Do not push without
  approval.

## Roadmap changes

- Split an oversized package before coding and preserve its dependency edges.
- Insert suffix packages such as `6A` and update graph, consumers, and critical
  path.
- Reorder only after updating dependencies and shared-file ownership.
- Skip only optional disabled capabilities and prove routes, configuration,
  text, and tests keep them unavailable.
- Record abandoned data and cleanup obligations. Never erase financial,
  provider, inventory, or audit evidence.
