# Commerce planning

Last consolidated: 2026-08-01

This directory is the canonical planning and operating reference for the
LOSTINSEOUL physical-goods shopping system. Shared PortOne infrastructure is
included only where it affects this system or the production payment gate.

## Status labels

- **Committed** — present in `main` at the named commit.
- **Uncommitted** — present only in the current worktree and not safe to treat
  as available.
- **Planned** — approved direction with no implementation claim.
- **Owner-controlled** — requires a business, provider, or operating decision.
- **Unknown** — not established by repository or current external evidence.

## Current status

| Area                                                                     | Status                      | Evidence                                                |
| ------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------- |
| Commerce contracts, durable commands, provider evidence, relational SKUs | Committed                   | `b9aa62e1`, hardened by `5b1b85dc`                      |
| Append-only inventory ledger                                             | Committed                   | `a3b5ef55`                                              |
| Receipts, lots, quarantine, adjustments, cycle counts                    | Committed                   | `cba6b4ae`                                              |
| Expiring inventory reservations and payment-time consumption/review      | Committed                   | `0607ba0a`, collection registration fixed by `0f1e7001` |
| Manual-operation requirement for every supply-chain capability           | Committed plan decision     | `3fe9ea13`                                              |
| Guarded reservation operator commands and queues, PR 6A                  | Committed in this changeset | Final gate in [validation.md](validation.md)            |
| Saved addresses and PR 7 onward                                          | Planned, not started        | [roadmap.md](roadmap.md)                                |

PR 6A passed its gate and is committed in this changeset. PR 7 remains planned
and was not started.

## Documents

- [system.md](system.md) — boundaries, state ownership, invariants, manual
  operation, automation, and decision gates.
- [roadmap.md](roadmap.md) — dependency order, completed work, and future
  reversible work packages.
- [operations.md](operations.md) — current controls, PortOne readiness, manual
  operating paths, owner tasks, and rollback procedures.
- [validation.md](validation.md) — common test gate, commit evidence, current
  findings, and required scenarios.

## Truth and maintenance rules

1. Current code, generated Payload schema, tests, and Git history override old
   prose.
2. A document may claim completion only with a commit or an explicitly labeled
   uncommitted checkpoint.
3. Put each fact in one document and link to it elsewhere.
4. Date external requirements and revalidate them before provider review or
   launch.
5. Do not convert an unresolved policy into a default, constant, or customer
   promise.
6. Update the roadmap before changing package order, dependencies, or scope.
7. Each finished package is tested and committed independently. Do not push
   without explicit approval.

## Noncanonical material

The following remain useful only for their original historical or project-wide
purpose and must not be used as current commerce instructions:

- `readmes/LOSTINSEOUL_RECONCILIATION_2026-05-29.md` — dated mixed visual and
  code-reconciliation history.
- `readmes/MIGRATIONS.md` — canonical repository-wide migration procedure,
  referenced by this plan but not duplicated here.
- LOSTINSEOUL fragrance, footer, design, and visual handoff documents.
- ignored `.claude/PRPs/` membership records except where a current fact has
  been independently verified and incorporated here.

## Evidence files

There are no retained commerce captures. Add a file under
`plans/commerce/evidence/` only when it proves a material visible requirement
that cannot be represented adequately as text. Every retained file must be
linked from [validation.md](validation.md), dated, and accompanied by the
finding it proves. Delete unreferenced or reproducible captures.
