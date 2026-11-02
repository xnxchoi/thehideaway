# Ecommerce continuation

The active implementation is in `.claude/worktrees/ecommerce-phase9` on
`codex/ecommerce-phase9`. The primary checkout is not the implementation candidate.

Read the [candidate handoff](../.claude/worktrees/ecommerce-phase9/readmes/ECOMMERCE_HANDOFF.md)
for current source, verification, blockers and the guarded restart procedure.
If that worktree is unavailable, locate the branch before resuming; do not infer
its runtime state from an older primary-checkout checkpoint.

- [ECOMMERCE.md](ECOMMERCE.md) owns the launch contract and architecture.
- The candidate handoff owns implementation status and the next-session checklist.
- [DEPLOY.md](DEPLOY.md) owns deployment operations; use the candidate copy when
  inspecting its unreleased host-routing changes.

The September 25 manual fulfillment slice is locally complete and independently
reviewed; changes remain uncommitted in the candidate. Its handoff records the
verification evidence, stopped test runtime and remaining launch gates. Both checkouts contain
unrelated work; preserve it. No deployment, production payment, webhook change
or external email is authorized by this continuation note.

The superseded primary handoff and other pre-consolidation documents are retained
locally under `.attic/readmes/archive-2026-09-24/`, mirroring original paths. Active
research, private fixture recovery, test evidence and application source were kept.

The primary deployment guide’s pre-correction copy is separately retained in
`.attic/readmes/archive-2026-09-24-deploy/readmes/DEPLOY.md`.
