# Commerce validation

## Common gate

Each work package must prove:

- intended customer and staff journeys;
- authorization, ownership, input validation, and PII-safe errors/logs;
- retry, replay, idempotency conflict, stale lease, and permanent business-key
  behavior;
- concurrency, deterministic lock order, and race outcomes;
- transaction rollback and recovery after an unknown or partial outcome;
- direct-write boundaries and reconstruction from immutable evidence;
- Payload-generated migration apply, guarded re-entry, and safe rollback;
- manual-only operation and every enabled automation handoff, outage,
  disablement, replacement, duplicate, ordering, and conflict path;
- focused coverage of at least 80% for new or changed domain modules;
- ESLint, focused TypeScript diagnostics, build, and `git diff --check`;
- independent code, database, security, and framework review as applicable.

Schema or migration tests use disposable databases. Do not run destructive
reset commands against an unresolved database target.

## Commit-backed evidence

These results are historical evidence recorded with the named commit. They
were not rerun during the documentation consolidation.

| Work                  | Commit                             | Recorded result                                                                                                                                                               |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRs 1–4 and hardening | `b9aa62e1`, `a3b5ef55`, `5b1b85dc` | 524 focused scenarios including 33 PostgreSQL scenarios; build and scoped reviews passed                                                                                      |
| PR 5                  | `cba6b4ae`                         | 523 non-PostgreSQL scenarios and 78 PostgreSQL scenarios; focused coverage above 89% branches and 93% statements; build and final reviews passed                              |
| PR 6                  | `0607ba0a`                         | 633 non-PostgreSQL scenarios and 33 PostgreSQL scenarios; focused coverage 91.48% statements, 86.67% branches, 98.30% functions, 92.74% lines; build and final reviews passed |

The test files and CI configuration are the executable suite manifest. Do not
copy full console output into this directory.

## PR 6A checkpoint

**Last complete checkpoint before final-review findings:**

- 11 focused unit, API, and access files passed 170 tests.
- PostgreSQL operator scenarios passed 6 tests.
- PostgreSQL migration scenarios passed 4 tests.
- Focused coverage recorded 86.84% statements, 74.92% branches, 98.11%
  functions, and 88.59% lines. Production operator modules individually
  exceeded 80% statements and lines.
- Focused ESLint, scoped TypeScript diagnostics, `git diff --check`, and the
  production build passed.

**Current status:** Uncommitted and not green. A fail-closed mutation-gate test
and structured rejection-logging tests were added, and production changes were
started. The complete suite was not rerun after those edits. Do not report PR
6A as passing or complete.

## PR 6A blocking findings

1. A `review_remaining` reconciliation may become permanently unretryable
   after stock replenishment because the guarded identity omits relevant
   inventory state.
2. Queue inspection and command execution can select different payments when
   an order has multiple payment records.
3. Required end-to-end concurrency and recovery scenarios are missing.
4. Release can record success while changing zero reservations.
5. The mutation gate previously accepted an internal override. The fix is
   incomplete until all tests use explicit environment setup and no production
   bypass remains.
6. Rejected authenticated operations need fixed-code, PII-safe structured
   security records. Transactionally committed operator events remain the
   immutable outcome ledger; a separate durable rejection ledger is deferred
   to the shared audit/outbox design unless approved.

## Required PR 6A PostgreSQL scenarios

- Manual release racing authoritative payment confirmation: either payment
  prevents release or the payment path creates/reconciles linked recovery;
  stock and evidence remain balanced.
- Operator `reconcile` through state load, locks, inventory recovery, immutable
  event, and durable command completion.
- `review_remaining`, inventory replenishment, refreshed state, and successful
  retry under a new idempotency key.
- Multiple payments on one order with deterministic authoritative selection in
  the queue and command.
- Zero-effect release rejection with no success event or completed command.
- Audit write failure rolls back the mutation and leaves a retryable lease.
- Operator expiry overlapping the automated worker expires once.
- Multi-SKU recovery remains all-or-nothing under insufficient ATP.

## PR 6A commands

Use environment-specific disposable database URIs; never put credentials in
this file or shell history committed to Git.

```bash
rtk pnpm exec vitest run \
  'src/payload/collections/(consumption)/inventory-reservation-operator-access.test.ts' \
  'src/app/api/lost/inventory/reservations/commands/route.test.ts' \
  'src/app/api/lost/inventory/reservations/route.test.ts' \
  src/lib/lost-commerce/inventory-reservation-operator-operations.test.ts \
  src/lib/lost-commerce/inventory-reservation-operator-queries.test.ts \
  src/lib/lost-commerce/inventory-reservation-paid-review.test.ts \
  src/lib/lost-commerce/inventory-reservation-contracts.test.ts \
  src/lib/lost-commerce/inventory-reservation-queues.test.ts \
  src/lib/lost-commerce/inventory-reservation-operator-policy.test.ts \
  src/lib/lost-commerce/inventory-reservation-expiry.test.ts \
  src/lib/lost-commerce/inventory-reservations.test.ts

PR6A_SCENARIO_TEST_DATABASE_URI='<disposable-uri>' \
  rtk pnpm exec vitest run \
  src/lib/lost-commerce/inventory-reservation-operator.postgres.test.ts

PR6A_MIGRATION_TEST_DATABASE_URI='<disposable-uri>' \
  rtk pnpm exec vitest run \
  src/lib/lost-commerce/inventory-pr6a-migration.postgres.test.ts
```

After production changes, rerun focused coverage, direct ESLint, scoped
TypeScript diagnostics, generated migration checks, build, and reviews.

## Known unrelated observations

At the last PR 6A checkpoint, the full Vitest run still had unrelated failures
in ticket RSVP width, fragrance reduced-motion tiering, and fragrance light
tuning. Dependency audit also reported pre-existing advisories. These notes are
dated observations, not current exemptions. Recheck them before using them in
a later gate.

## Evidence policy

For each completed package record the date, commit, exact command or CI job,
result, coverage when required, disposable database identity without
credentials, reviewer verdict, known unrelated failures, and rollback proof.

Retain a capture only when it proves a visible acceptance condition. Store it
under `plans/commerce/evidence/`, link it here, and state the finding. Generated
coverage HTML, build output, raw logs, and repeated screenshots are
reproducible artifacts and are not planning documents.
