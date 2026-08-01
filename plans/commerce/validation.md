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

## PR 6A final gate

**Status, 2026-08-01:** Passed and committed in this changeset. The earlier
170-test green checkpoint and the subsequent incomplete edits are historical;
neither is the completion basis. The current source, generated schema,
migrations, tests, and results below are the completion basis.

All previously blocking findings were resolved:

- reconciliation state and business identity include the inventory versions
  needed to retry after replenishment;
- queue inspection and command execution share complete, deterministic
  authoritative-payment selection; scans are capped at 5,000 and fail closed
  if Payload reports omitted rows;
- release rejects a zero-effect mutation;
- the mutation gate has no request or internal override;
- authenticated rejection logs use fixed codes and exclude request, evidence,
  contact, and provider data;
- every claimed failed attempt appends immutable evidence in a separate
  transaction after rollback, including missing-order failures without a
  dangling relationship;
- command mutation, success evidence, and durable completion commit together;
- all required concurrency, recovery, migration, and rollback scenarios pass.

### Reproducible results

| Gate                                                              | Result                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Focused unit, API, access, and domain tests                       | 16 files, 225 tests passed                                 |
| Operator PostgreSQL scenarios on `pr6a_scenario_019fb0f0_r2`      | 14 tests passed                                            |
| PR 6A migration scenarios on `pr6a_migration_019fb0f0_r2`         | 6 tests passed                                             |
| PR 6 boundary migration scenarios on `pr6a_migration_019fb0f0_r2` | 8 tests passed                                             |
| Clean full migration chain on `pr6a_fresh_019fb0f0_r2`            | `migrate:fresh` passed; guarded `migrate` re-entry passed  |
| Direct ESLint                                                     | Production PR 6A paths passed with zero errors or warnings |
| Scoped TypeScript diagnostics                                     | No PR 6A-path errors                                       |
| Production build                                                  | Passed with nonsecret placeholder Kakao values             |
| Diff validation                                                   | Formatting and `git diff --check` passed                   |

The focused coverage run reported the following changed production modules at
or above 80% statements and lines:

| Module                     | Statements | Lines  |
| -------------------------- | ---------- | ------ |
| Operator command route     | 98.76%     | 98.75% |
| Operator operations        | 85.00%     | 85.71% |
| Operator failure evidence  | 90.90%     | 90.90% |
| Operator payment selection | 94.28%     | 96.15% |
| Operator policy            | 89.65%     | 89.65% |
| Operator queries           | 85.62%     | 91.15% |
| Paid review                | 81.57%     | 85.29% |
| Payment finalization       | 91.42%     | 91.17% |
| Reservation queues         | 89.28%     | 91.66% |
| Reservation recovery       | 84.78%     | 86.20% |
| Reservations               | 90.00%     | 90.64% |
| Product payment            | 85.34%     | 86.72% |

The Vitest and coverage packages are currently mixed at `4.1.10` and `4.1.9`;
the runner warns that mixed versions are unsupported. The passing coverage
results remain reproducible, but dependency alignment is a separate package
maintenance task.

### PostgreSQL scenarios

The 14 operator scenarios include every required case:

- manual release racing authoritative payment confirmation;
- guarded reconcile through recovery, immutable event, and command completion;
- `review_remaining`, replenishment, refreshed state, and retry;
- competing paid payments, a fifth older authoritative payment, and
  cross-order payment skew;
- zero-effect release rejection;
- audit write failure rollback with a retryable lease;
- manual expiry overlapping automated expiry;
- multi-SKU all-or-nothing recovery under insufficient ATP;
- missing-order failure evidence without a dangling relationship.

Migration scenarios prove guarded apply, re-entry, rollback, constraint
enforcement, immutable event behavior, and refusal to weaken command-key
uniqueness after evidence exists. The PR 6 enum and unique-index boundary is
split between generated enum migration `20260722_011612` and the documented
manual unique-index migration `20260722_011613`, because Payload cannot express
the required generated-schema boundary as one safely reversible step.

### Independent reviews

- Code: approved; no critical or high findings. The final documentation medium
  was resolved in this update.
- TypeScript: approved; no critical, high, or medium findings.
- PostgreSQL: approved; no critical or high findings.
- Security: approved; no critical, high, or medium PR 6A findings.

Two PostgreSQL medium risks remain accepted and explicit:

1. Generated foreign keys specify `ON DELETE SET NULL`, while the immutable
   event trigger makes parent deletion effectively restrictive. This preserves
   evidence; add a focused parent-deletion contract test before any workflow
   depends on deleting referenced operator, order, or payment rows.
2. `20260722_011613` creates an ordinary unique index. Assess table size and a
   change window before production deployment because index creation can block
   writes.

### Commands

Use environment-specific disposable database URIs. Do not commit credentials.

```bash
rtk pnpm exec vitest run <the 16 focused files above> --coverage

PR6A_SCENARIO_TEST_DATABASE_URI='<disposable-uri>' \
  rtk pnpm exec vitest run \
  src/lib/lost-commerce/inventory-reservation-operator.postgres.test.ts

PR6A_MIGRATION_TEST_DATABASE_URI='<disposable-uri>' \
  rtk pnpm exec vitest run \
  src/lib/lost-commerce/inventory-pr6a-migration.postgres.test.ts

PR6_MIGRATION_TEST_DATABASE_URI='<disposable-uri>' \
  rtk pnpm exec vitest run \
  src/lib/lost-commerce/inventory-pr6-migration.postgres.test.ts
```

## Known unrelated observations, 2026-08-01

- Full Vitest: 3 failures, 1,500 passes, 138 skips. The failures remain in the
  ticket RSVP width contract, fragrance reduced-motion tier, and fragrance
  light tuning; none intersects PR 6A.
- Full TypeScript: 215 errors in 97 files; scoped matching found no PR 6A-path
  errors.
- `pnpm lint` invokes the removed Next.js lint command and fails before linting.
  Direct ESLint is the PR 6A lint gate.
- Dependency audit: 14 advisories — 2 critical, 10 high, 1 moderate, and 1 low
  — in pre-existing Better Auth, Nodemailer, Sharp/libvips, and transitive
  brace-expansion dependencies. PR 6A does not change package manifests.
- The successful production build reported development fixture users in the
  connected database. Audit and remove them separately before treating that
  database as production.

## Evidence policy

For each completed package record the date, commit, exact command or CI job,
result, coverage when required, disposable database identity without
credentials, reviewer verdict, known unrelated failures, and rollback proof.

Retain a capture only when it proves a visible acceptance condition. Store it
under `plans/commerce/evidence/`, link it here, and state the finding. Generated
coverage HTML, build output, raw logs, and repeated screenshots are
reproducible artifacts and are not planning documents.
