# Type Debt Inventory

> **Status:** 537 errors across ~203 files as of 2026-04-12.
> `typescript.ignoreBuildErrors: true` is intentionally set in `next.config.ts` —
> the production build succeeds. This document is the canonical backlog for paying
> that debt down incrementally, post-launch.
>
> Run `pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l` to get the current count.

---

## Error Code Breakdown

| Code    | Count | What it means                                    |
|---------|-------|--------------------------------------------------|
| TS2307  | 95    | Module not found / missing type declarations     |
| TS2345  | 75    | Argument type mismatch                           |
| TS2322  | 62    | Assignability error                              |
| TS7031  | 50    | Binding element has implicit `any` type          |
| TS7006  | 45    | Parameter has implicit `any` type                |
| TS2339  | 44    | Property does not exist on type                  |
| TS2304  | 37    | Cannot find name                                 |
| TS2353  | 23    | Object literal has extra properties              |
| TS2741  | 16    | Missing required properties                      |
| TS2305  | 12    | Module has no exported member                    |
| TS2739  | 9     | Type missing required properties                 |
| TS7053  | 7     | Element has implicit `any` index type            |
| TS2344  | 6     | Type constraint not satisfied                    |
| TS2488  | 5     | Required iterator not found                      |
| TS18046 | 5     | Value is of type `unknown`                       |
| other   | ~50   | Various (TS2551, TS2769, TS18048, TS2724, …)     |

---

## Clusters (grouped by subsystem)

### 🔴 Cluster 1 — `BulkUpload` field (90 errors, 8 files) — **WIP live code**

The heaviest cluster. BulkUpload is a custom Payload field, clearly still in progress.
Fix it once the feature is ready to ship; don't grind type errors on half-finished code.

| Errors | File |
|--------|------|
| 23 | `src/payload/fields/BulkUpload/EditMany/DrawerContent.tsx` |
| 18 | `src/payload/fields/BulkUpload/FileSidebar/index.tsx` |
| 18 | `src/payload/fields/BulkUpload/EditForm/index.tsx` |
| 11 | `src/payload/fields/BulkUpload/index.tsx` |
| 7  | `src/payload/fields/BulkUpload/FormsManager/index.tsx` |
| 5  | `src/payload/fields/BulkUpload/AddingFilesView/index.tsx` |
| 4  | `src/payload/fields/BulkUpload/EditMany/index.tsx` |
| 4  | `src/payload/fields/BulkUpload/AddFilesView/index.tsx` |

**Action:** Leave until the feature is complete. Fix in one pass when BulkUpload ships.

---

### 🟠 Cluster 2 — `betterauth-ui` vendored library (~65 errors, ~55 files) — **reference candidate**

`src/lib/auth/betterauth-ui/` is a ripped-in external UI library.
Most errors are TS2307 (missing module declarations) and implicit `any` from the upstream source.
The "copy.tsx" variants are verbatim duplicates (backup files that leaked into git).

**Action:** Consider moving `src/lib/auth/betterauth-ui/` to `reference/betterauth-ui/`
and re-importing only what you've actually ported. Until then, add it to tsconfig `exclude`.
Delete `*copy.tsx` files immediately — they're noise.

Files with `copy` in the name (instant wins — just delete):
- `src/lib/auth/betterauth-ui/src/components/auth/forms/sign-up-form copy.tsx` (3)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/two-factor-form copy.tsx` (2)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/sign-in-form copy.tsx` (2)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/magic-link-form copy.tsx` (2)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/forgot-password-form copy.tsx` (2)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/reset-password-form copy.tsx` (1)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/recover-account-form copy.tsx` (1)
- `src/lib/auth/betterauth-ui/src/components/auth/forms/email-otp-form copy.tsx` (2)
= **~15 errors gone for free**

Remaining betterauth-ui errors by file:
| Errors | File |
|--------|------|
| 16 | `src/lib/auth/betterauth-ui/src/components/auth/forms/sign-up-form.tsx` |
| 5  | `src/lib/auth/betterauth-ui/src/components/user-button.tsx` |
| 4  | `src/lib/auth/betterauth-ui/src/components/settings/security-settings-cards.tsx` |
| 3  | `src/lib/auth/betterauth-ui/src/components/settings/settings-cards.tsx` |
| 3  | `src/lib/auth/betterauth-ui/src/components/settings/security/change-password-card.tsx` |
| 3  | `src/lib/auth/betterauth-ui/src/components/settings/providers/provider-cell.tsx` |
| 3  | `src/lib/auth/betterauth-ui/src/components/organization/organization-switcher.tsx` |
| 3  | `src/lib/auth/betterauth-ui/src/lib/triplit/use-conditional-query.ts` |
| 2+ | ~30 other betterauth-ui files (1–2 errors each) |

---

### 🟠 Cluster 3 — `Lexical` custom features (~40 errors, ~15 files) — **live, deferred**

Custom Lexical rich-text features in `src/payload/Lexical/`. Errors are mostly type
mismatches against Payload/Lexical internal APIs that change with package updates.

| Errors | File |
|--------|------|
| 14 | `src/payload/Lexical/Features/PayloadMention.ts` |
| 7  | `src/payload/Lexical/defaults/features/textState/feature.client.tsx` |
| 4  | `src/payload/Lexical/defaults/features/textState/textState.ts` |
| 4  | `src/payload/Lexical/defaults/features/format/strikethrough/feature.client.tsx` |
| 5  | `src/payload/Lexical/defaults/features/format/underline/feature.client.tsx` |
| 5  | `src/payload/Lexical/defaults/features/format/superscript/feature.client.tsx` |
| 5  | `src/payload/Lexical/defaults/features/format/subscript/feature.client.tsx` |
| 5  | `src/payload/Lexical/defaults/features/format/italic/feature.client.tsx` |
| 3  | `src/payload/Lexical/defaults/features/NestedComposer/index.tsx` |
| 2  | `src/payload/Lexical/defaults/features/textState/feature.server.ts` |
| 2  | `src/payload/Lexical/Features/LinkPreview/feature.client.ts` |
| 1+ | Several server/markdown files |

**Action:** Tackle after `@payloadcms/richtext-lexical` stabilizes. Run `pnpm upgrade` first
to see if upstream fixes any of these.

---

### 🟠 Cluster 4 — `Delta` collection (~25 errors, 6 files) — **unwired collection**

`src/payload/collections/Delta/` is NOT in `src/payload/collections/index.ts`.
It's either a WIP collection or abandoned. Errors are TS2307 (missing imports) and TS2339.

| Errors | File |
|--------|------|
| 11 | `src/payload/collections/Delta/api/queryDeltaBySlug.ts` |
| 6  | `src/payload/collections/Delta/hooks/populateMeta.ts` |
| 3  | `src/payload/collections/Delta/component/delta.tsx` |
| 3  | `src/payload/collections/Delta/api/getDeltaHandler.ts` |
| 2  | `src/payload/collections/Delta/api/getNextDeltas.ts` |
| 1  | `src/payload/collections/Delta/api/queryDeltaOverview.ts` |
| 1  | `src/payload/collections/Delta/hooks/validateDelta.ts` |

**Action:** Decide: is Delta shipping? If yes, wire it into `index.ts` + fix errors.
If no, `pnpm attic src/payload/collections/Delta`.

---

### 🟡 Cluster 5 — `Controlbar` UI component (~15 errors, 4 files) — **live, medium effort**

| Errors | File |
|--------|------|
| 9 | `src/components/UX/Controlbar/layout/buttons/def.tsx` |
| 4 | `src/components/UX/Controlbar/top-menu.tsx` |
| 2 | `src/components/UX/Controlbar/layout/buttons/controllerButton.tsx` |
| 2 | `src/components/UX/Controlbar/layout/buttons/MainButton.tsx` |
| 1 | `src/components/UX/Controlbar/layout/primary.tsx` |

---

### 🟡 Cluster 6 — `Icon` component (15 errors) — **quick candidate**

`src/components/UX/Icon/index.tsx` — likely implicit `any` on the icon map index.
The pattern is usually `Record<string, ComponentType>` being indexed with a string literal.
Should be a sub-30-minute fix.

---

### 🟡 Cluster 7 — `ShadeMarquee` (19 errors) — **attic or fix**

`src/components/layouts/Profile/ShadeMarquee.tsx` is imported nowhere (grep-confirmed).
19 errors. Either an experimental component not yet wired, or dead.

**Action:** Grep for it in the profile layout. If unused: `pnpm attic src/components/layouts/Profile/ShadeMarquee.tsx`.

---

### 🟡 Cluster 8 — `TranslatingText` (10 errors) — **check imports**

`src/components/UX/TranslatingText/TranslatingText.tsx` — 10 errors. Verify it's imported.
If used, fix; if not, attic.

---

### 🟡 Cluster 9 — `seeder` endpoint (~25 errors, ~15 files) — **dev-only, low priority**

Seed data files under `src/payload/endpoints/seeder/` — post content + images.
All are dev-only tools. Errors are likely outdated field shapes from type regenerations.

| Errors | File |
|--------|------|
| 3  | `src/payload/endpoints/seeder/contents/post2.ts` |
| 2  | `src/payload/endpoints/seeder/contents/post3–7.ts` (×5) |
| 2  | `src/payload/endpoints/seeder/contents/page.ts` |
| 1  | `src/payload/endpoints/seeder/contents/post1.ts` |
| 1  | `src/payload/endpoints/seeder/images/img1–7.ts` (×7) |

**Action:** Run `pnpm generate:types` then re-check — these are likely just stale payload types.

---

### 🔵 Cluster 10 — `auth/payload-auth` plugin (~12 errors, 4 files) — **auth plumbing**

| Errors | File |
|--------|------|
| 8 | `src/lib/auth/payload-auth/better-auth/plugin/lib/build-collections/users/hooks/sync-account.ts` |
| 2 | `src/lib/auth/payload-auth/better-auth/plugin/helpers/prepare-session-data.ts` |
| 1 | `src/lib/auth/payload-auth/better-auth/plugin/lib/build-collections/accounts/hooks/sync-password-to-user.ts` |
| 1 | `src/lib/auth/payload-auth/better-auth/plugin/payload/components/passkeys/index.tsx` |

**Action:** Touched during auth wiring; fix alongside any upcoming auth work.

---

## Orphaned / Noise Files

These shouldn't be generating errors at all — cleanup wins.

| Errors | File | Issue |
|--------|------|-------|
| 2 | `.next/types/validator.ts` | Next-generated; exclude from tsconfig if it causes issues |
| 2 | `.next/dev/types/validator.ts` | Same |
| 7 | `public/images/img*.ts` | `.ts` files in `public/` — likely seeder helpers put in the wrong dir |

**Action for `public/images/img*.ts`:** These should be in `src/payload/endpoints/seeder/images/`.
Either move them or add `"public/images/**"` to tsconfig `exclude`.

---

## Remaining Long Tail (~200 files, 1–4 errors each)

Everything not in a named cluster above. Generally 1–2 errors per file — mostly
implicit `any`, assignability mismatches, or stale Payload type references.
Highest-value files to tackle from this tail (most likely quick wins):

| Errors | File |
|--------|------|
| 5  | `src/utilities/lexicalUtilities.ts` |
| 4  | `src/payload/fields/Text/Text.tsx` |
| 3  | `src/payload/elements/Button/types.ts` |
| 3  | `src/payload/collections/Citations/index.ts` |
| 3  | `src/components/core/s.ts` |
| 3  | `src/components/UX/Notifications/Notifications.tsx` |
| 3  | `src/app/(frontend)/(site)/(content)/essays/[slug]/t.tsx` |
| 2  | `src/payload/collections/Series/Series.ts` + `SeriesItem.ts` |
| 2  | `src/payload/collections/Notifications/hooks/readAt.ts` |
| 2  | `src/app/(frontend)/(site)/(auth)/me/lists/[hashId]/page.client.tsx` |
| 2  | `src/app/api/search/users/route.ts` |
| 8  | `src/lib/scripts/syncTrackMedia.ts` |

---

## Recommended Fix Order

1. **Delete `copy.tsx` files** in `betterauth-ui` — ~15 errors, 0 risk. (5 min)
2. **Run `pnpm generate:types`** then re-run `tsc` — seeder errors likely disappear. (5 min)
3. **Attic `ShadeMarquee.tsx`** if grep confirms no imports. (2 min)
4. **Attic `public/images/img*.ts`** or move to seeder dir. (5 min)
5. **Fix `Icon/index.tsx`** — 15 errors, likely one-liner index type fix. (20 min)
6. **Decide Delta** — wire or attic. (15 min either way)
7. **Fix `utilities/lexicalUtilities.ts`** + `components/core/s.ts` — small files, likely quick. (30 min)
8. **BulkUpload** — tackle when the feature is ready to ship. (2–4 hrs)
9. **Lexical custom features** — tackle after upgrading `@payloadcms/richtext-lexical`. (2–3 hrs)
10. **betterauth-ui** — move to `reference/` or exclude from tsconfig once copy files are deleted. (30 min setup)

---

## Quick Commands

```bash
# Current error count
pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Errors in a specific subsystem
pnpm tsc --noEmit --pretty false 2>&1 | grep "BulkUpload"

# Move a file to .attic/ (auto mirrors path)
pnpm attic src/components/layouts/Profile/ShadeMarquee.tsx

# Regenerate payload types (fixes stale field errors)
pnpm generate:types
```
