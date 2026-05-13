# Sprint 1 — Money Resilience: Session Handoff

**Date:** 2026-05-14 · **Branch:** `main` · **HEAD:** `7b7b3f5` (invoice UX)

This document is a handoff from the session that committed the invoice UX surface to a follow-up session running a deeper audit / Sprint 1 completion with broader tooling. It transfers concrete state and useful learnings without dumping everything — so the audit keeps its independent perspective and only re-checks what merits re-checking.

---

## 1. Read me first

- **You inherit a partial Sprint 1.** Per the originating user, the work on disk is roughly the first **~20%** of a 3-sprint roadmap. The remaining ~33% mostly reside in the user's head. The `/plan` invocation that produced the full roadmap was lost in a compaction.
- **Ask the user for the full sprint roadmap before committing scope-extending work.** The migration's intro comment is the most authoritative on-disk artifact for Sprint 1's intent — start there.
- **Trust but verify the inherited diff.** The audit below is from a single-session read of the working tree; redo any check you're not convinced of.

---

## 2. What was committed

```
7b7b3f5 feat(invoice): bilingual paper + reading panel + status microinteractions
```

The invoice UX surface is on `main`. It is **not** part of Sprint 1, but `invoice_number` and the PDF render path touch the same money pipeline. Sprint 1's `nextInvoiceNumber` sequence will be exercised by the committed invoice route the moment a paid Subscription fires `issueInvoiceOnPaid`.

---

## 3. What's on disk, uncommitted (Sprint 1 working tree)

Five DB/safety changes in the migration:

1. `ticket_number` Postgres sequence (closes `max()+1` race in purchase route)
2. `invoice_number` Postgres sequence (same fix in `issueInvoiceOnPaid` hook)
3. `tickets.reminder_sent_at` column + index (Sprint 0 schema field needed migration)
4. `subscriptions_pending_user_plan_uniq` partial unique index (closes pending-sub TOCTOU)
5. `exchange_rate_rates.rate` `text → numeric(20, 8)` with non-negative CHECK

Seven supporting primitives:

| File | Role |
|---|---|
| `src/lib/db/sequences.ts` | `nextTicketNumber`, `nextInvoiceNumber`, `eventPurchaseLock` (FNV-1a advisory) |
| `src/lib/api/idempotency.ts` | LRU-backed `Idempotency-Key` replay, swappable to Redis without call-site change |
| `src/lib/api/safeFetch.ts` | SSRF defense; manual redirect re-validation against private-IP blocklist |
| `src/lib/api/safeEqual.ts` | Timing-safe equality |
| `src/lib/api/isSameOrigin.ts` | Fail-closed CSRF guard (was inline, hardcoded `true` on unset env) |
| `src/lib/api/httpUrlSchema.ts` | Zod refinement; rejects `javascript:` / `data:` schemes at validation |
| `src/lib/api/rateLimit.ts` | `rate-limiter-flexible` wrapper |

One new cron:

- `src/app/api/subscriptions/cron/expire/route.ts` — paginated sweep of `active` subs past `expires_at`, flips to `expired` so the role-demotion hook fires.

Modified ticket routes (purchase, refund, claim, cron/reminders, delivery-address, validate-gate, check-in) plus `checkout/manual` — all integrate the new primitives.

Modified Payload collections (Plans, Prices, ProductCategory, Subscriptions) — **this session did not read these diffs**, see §6.

---

## 4. Verified call-site wiring (confirmed in this session)

| Primitive | Callers verified |
|---|---|
| `nextTicketNumber` | `tickets/purchase/route.ts:227` |
| `nextInvoiceNumber` | `Subscriptions/hooks/issueInvoiceOnPaid.ts:93` |
| `eventPurchaseLock` | `tickets/purchase/route.ts:169` (must be inside Payload txn) |
| `beginIdempotent` | `tickets/purchase`, `tickets/refund`, `checkout/manual` |
| `isSameOrigin` | All 7 mutating ticket / checkout routes |
| `safeFetch` | `image-courier`, `link-preview` |
| `safeEqual` | Password gates (purchase, validate-gate) + cron secrets (reminders, expire) |
| `httpUrl` | `Users/endpoints/onboardingHandler.ts`, tour onboarding form schema |
| `subscriptions_pending_user_plan_uniq` (23505 race) | Handled in `checkout/manual:142-147` |
| Migration registration | `src/lib/migrations/index.ts` — present |

---

## 5. Loose ends found in this audit (must close)

1. **FXRate.rate field type drift.** Migration converts the column to `numeric(20, 8)`. The Payload field at `src/payload/collections/(consumption)/FXRate/index.ts:35` still declares `{name: "rate", type: "text"}`. This will:
   - Fight `pnpm generate:schema` (Payload will want to ALTER it back)
   - Cause writes to go in as strings relying on implicit pg cast
   - Type `rate: string` in the regenerated `payload-types.ts`

   **Fix:** change to `type: "number"`. Re-check whether `index: true` is still appropriate for numeric.

2. **`/api/gated/[collection]/[id]/route.ts` deleted, but `src/components/UX/Highlightr/Gated.tsx:43` still fetches it.** `Gated.tsx` is not imported anywhere (`grep -r "from.*Gated"` returns empty), and `Highlightr/index.tsx:1001` carries a comment noting the route is "currently dead."

   **Fix:** delete `Gated.tsx` and the stale comment, or rewire to a live endpoint if gating is wanted.

3. **`html-to-image` orphan dependency.** Was used by the old "Save as image" flow before the PDF route replaced it. No remaining importers.

   **Fix:** `pnpm rm html-to-image`.

---

## 6. What this session did NOT read (open ground for you)

- **`Plans/index.ts`, `Prices/index.ts`, `ProductCategory/index.ts`, `Subscriptions/index.ts` diffs.** Modified, unread. These likely contain Sprint-1-adjacent collection schema changes that should be cross-checked against the migration and the route wiring.
- **`src/payload-types.ts` regenerated.** Likely just reflects the collection mods above, but worth a glance.
- **`getPlansData.ts`** modified — relationship to Sprint 1 unknown.
- **`onboardingHandler.ts`, `userOverview.ts`, `Users/hooks/afterChange.ts`, `Surf/endpoints/getSurfBookmarks.ts`, `plugins/locker/access/index.ts`** modified — relationship unknown, likely security-pass scope.

---

## 7. Design conventions adopted (worth honoring in follow-up work)

Carry these forward unless you have a specific reason to break them:

- **Every primitive carries a "Why this exists" doc-comment** naming the prior bug or attack class it closes. See `safeFetch.ts:1-8` as canonical.
- **Helpers fail closed.** `isSameOrigin` returns `false` on unset `NEXT_PUBLIC_SERVER_URL`; the previous inline copies returned `true`, silently disabling CSRF on env misconfig. Pattern applies to every new safety primitive.
- **Race-free numbering** uses Postgres sequences seeded with `setval(name, GREATEST(max+1, 1), false)` for monotonic continuity with legacy rows.
- **Capacity guards** prefer per-resource advisory locks (FNV-1a-hashed key) over table-wide locks. Must run inside a Payload transaction via `payload.db.sessions[transactionID]`.
- **Idempotency is opt-in via `Idempotency-Key` header.** Never fabricate keys from the body — content collisions across users would leak responses. Cache scoped `endpoint:userId:key`. Storage-agnostic interface so the LRU → Redis swap is a one-file change.
- **Migration policy** (now in CLAUDE.md, full procedure in `readmes/MIGRATIONS.md`): backward-compat is not a factor (DB is wipeable); every statement must be re-runnable via `IF [NOT] EXISTS` or `DO $$`; mirror Payload's schema shape exactly.
- **i18n: all user-facing strings live in `messages/{en,ko}.json`.** Brand chrome (wordmark, "a restored project", footer) is English-everywhere — KO file mirrors EN value + `lang="en"` on the node. No parallel locale stores in constants files.

---

## 8. Recommended approach for the next session

1. Read this doc, then the migration's intro comment block (`src/lib/migrations/20260512_120000_ticketing_money_resilience.ts:1-39`) — that's the canonical Sprint 1 plan.
2. Ask the user for the **full 4–5 sprint roadmap** before extending scope; otherwise you're inferring intent from compacted output.
3. Close the three loose ends in §5.
4. Read the unread diffs in §6 and reconcile with §4's wiring table.
5. Decide commit shape: one fat Sprint 1 commit, or split (e.g. `feat(safety): timing + SSRF + CSRF primitives` separate from `feat(money): sequences + pending-unique + FX numeric`).
6. Run the offline invoice render (`pnpm tsx scripts/render-invoice-test.ts`) once after touching anything in `pdfmake/template.ts` or `format.ts` — outputs `/tmp/test-invoice-{en,ko}.pdf` for visual diffing.

---

## 9. Synthesis notes

Where the two sessions are likely to converge or diverge:

- **Convergence (likely safe to keep as-is):** the migration shape, the 7 primitives, the call-site wiring. These are mechanically straightforward and were verified by grep.
- **Divergence (worth re-thinking):** how Sprint 1 should be split into commits; whether the collection mods (unread here) belong in Sprint 1 or a separate sprint; whether `rate-limiter-flexible` is the right backend long-term (vs Redis-backed).
- **Open question only the user can answer:** what Sprints 2–5 are. The migration only covers Sprint 1's scope.

If the audit produces a substantially different shape than what's on disk, treat the on-disk version as a **first draft worth reading for context** — the comments capture rationale that took non-trivial thought — but don't be bound by it.
