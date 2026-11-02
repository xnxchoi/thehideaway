# Type Debt Inventory

> **Status:** 142 errors across ~75 files as of 2026-05-19 (down from 537 originally / 221 entering this session).
> `typescript.ignoreBuildErrors: true` is intentionally set in `next.config.ts` —
> the production build succeeds. This document is the canonical backlog for paying
> that debt down incrementally, post-launch.
>
> Run `pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l` to get the current count.

---

## Resolved This Session (2026-05-19)

- **Atticed dead code:** `src/components/layouts/Profile/ShadeMarquee.tsx` (no importers), `src/components/core/s.ts` (orphaned helper referencing the removed `delta` collection).
- **Deleted `*copy.tsx` duplicates** in `src/lib/auth/betterauth-ui/src/components/auth/forms/`.
- **Synced `LockedCollections`** with the registered collection slugs and `FieldUseSelect`. Removed `"pages" | "series" | "series-item"` from `LockedCollections` and from `lockerPlugin` targets; dropped the dead `series`/`series-item` cases from `disallowRead`. The Series collections are still on disk but unwired — restore both ends if/when Series ships.
- **Citations access control:** narrowed `req.user.banned` access with `"banned" in user` since the field only exists on `User`, not `Admin`.
- **Controlbar `views.tsx`:** typed `itemVariants` as Motion `Variants` (fixed 13 errors); fixed `n.actionLink || …` → `n.actionLink?.url || …`.
- **`api/search/users` route:** corrected drizzle `execute<T>` generic (single row shape, not array) and accessed `.rows` for iteration. Added index signature to satisfy `Record<string, unknown>` constraint.
- **Invoice PDF route:** guarded `node.table.widths?.length`.
- **Invoice PDF template:** defined local `RecurringPlan` type, narrowed `currency` via a `toCurrencyCode` helper, typed the `row` helper as `TableCell[]` with explicit border-tuple casts.
- **Seeder categories:** added required `identity` field with safe defaults.

---
## Remaining Clusters (~142 errors)

### 🔴 Cluster 1 — `BulkUpload` field (22 errors, ~5 files) — **WIP, deferred**

The heaviest remaining cluster. Custom Payload field, still in progress. Fix once the feature is ready to ship.

| Errors | File |
|--------|------|
| 11 | `src/payload/fields/BulkUpload/index.tsx` |
| 7  | `src/payload/fields/BulkUpload/FormsManager/index.tsx` |
| 4  | `src/payload/fields/BulkUpload/AddFilesView/index.tsx` |

---

### 🟠 Cluster 2 — `betterauth-ui` — **closed**

First-party auth UI replaced the vendored layer (2026-09). Do not revive
`src/lib/external/betterauth-ui`. Recount with `pnpm tsc --noEmit` before
treating any file in this cluster as open.

---

### 🟠 Cluster 3 — `Lexical` custom features (11 errors, ~6 files) — **upstream-tracked**

| Errors | File |
|--------|------|
| 3  | `src/payload/Lexical/defaults/features/NestedComposer/index.tsx` |
| 2  | `src/payload/Lexical/defaults/features/textState/feature.server.ts` |
| 2  | `src/payload/Lexical/Features/AmbientAudio/plugin/TrackPicker.tsx` |
| …  | A few singletons across features. |

**Action:** revisit after upgrading `@payloadcms/richtext-lexical`.

---

### 🟠 Cluster 4 — `auth/payload-auth` plugin (11 errors, ~5 files) — **auth plumbing**

Touched during auth wiring; fix alongside upcoming auth work.

---

### 🟡 Cluster 5 — `ImageBlock` Comp/client (7 errors, 1 file)

`src/blocks/ImageBlock/Comp/client/component/index.tsx` — properties (`setImage`, `setSpan`, `uuid`) accessed on a `FrameState` type that doesn't declare them. Looks like the `FrameState` type is stale; needs a pass.

---

### 🟡 Cluster 6 — Seeder dev tooling (11 errors, ~10 files) — **dev-only**

Stale payload field shapes in `src/payload/endpoints/seeder/contents/post*.ts` and `images/img*.ts`. Mostly `popularity`/`identity`/relation shape drift. Re-run `pnpm generate:types` first; only patch the residual.

---

### 🟡 Cluster 7 — `api/invoice/pdf` route (3 errors) — **runtime smell, not just types**

```
Property 'setFonts' does not exist on type 'typeof PdfPrinter'
Property 'setTableLayouts' does not exist on type 'typeof PdfPrinter'
Property 'createPdf' does not exist on type 'typeof PdfPrinter'
```

The route calls the **browser** `pdfmake` API (`pdfmake.setFonts`, `pdfmake.createPdf`) but the server-side `pdfmake` package only exports the `PdfPrinter` class. On Node, this should use `new PdfPrinter(fonts).createPdfKitDocument(docDefinition, { tableLayouts })` and stream the resulting `PDFKit.PDFDocument` to a `Buffer`. Either the route has never been runtime-tested in this form, or there's an undocumented bundler resolution swapping the browser bundle in. Needs a refactor, not a type cast — flagged here so the next person can fix it deliberately.

---

### 🟡 Cluster 8 — scripts (5 errors)

`scripts/gen-env-template.ts` and `scripts/verify-env.ts` import `../src/lib/env.ts` with explicit `.ts` extension (required by the tsx runner). Fix by enabling `allowImportingTsExtensions: true` in `tsconfig.json` (compatible with the existing `noEmit: true`).

---

### 🟡 Cluster 9 — Long tail (~60 errors, ~50 files)

1–2 errors each. Most are stale Payload type drift (`Plan.price`/`Price.currencies` on `checkout/page.tsx`, `popularity` field on `getPostHandler.ts`, etc.) — many will evaporate after a successful `pnpm generate:types` once the dev DB is reachable.

Highest-signal files to look at when chipping away:

| Errors | File |
|--------|------|
| 3 | `src/payload/fields/TrackUpload/TrackUploadComponent.tsx` |
| 3 | `src/payload/fields/Article/Cover/rp-image/client/drawer/index.tsx` |
| 3 | `src/lib/auth/payload-auth/better-auth/adapter/tests/adapter.test.ts` |
| 2 | `src/providers/Theme/ThemeSelector/index.tsx` |
| 2 | `src/payload/fields/Article/Subtitle/index.ts` |
| 2 | `src/payload/fields/AccessControlled/Array/index.tsx` |
| 2 | `src/lib/actions/admin-users.ts` |
| 2 | `src/components/layouts/Registration/lanyard.tsx` |
| 2 | `src/components/UX/MediaPreview/SectionPreview.tsx` |
| 2 | `src/blocks/ArchiveBlock/Component.tsx` |

---

## Recommended Fix Order

1. **Run `pnpm generate:types`** against a reachable DB. Several long-tail errors track stale generated shapes (e.g., `Plan.price`, `Price.currencies`, missing `popularity`/`identity`). _Note: in this session, `generate:types` hung mid-init when the DB wasn't reachable — needs Postgres up._
2. **Enable `allowImportingTsExtensions`** in `tsconfig.json` — eliminates 2 script errors with zero runtime risk.
3. **Triage `FrameState` properties** in `blocks/ImageBlock` — looks like a single missing field union update.
4. **Decide `betterauth-ui`** — either move to `reference/` or add to tsconfig `exclude`.
5. **Refactor `api/invoice/pdf` route** — convert to server-side `PdfPrinter` API. This is a runtime bug masquerading as a type error.
6. **BulkUpload** — tackle when the feature is ready to ship.
7. **Lexical custom features** — revisit after a `@payloadcms/richtext-lexical` upgrade.

---

## Quick Commands

```bash
# Current error count
pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Errors in a specific subsystem
pnpm tsc --noEmit --pretty false 2>&1 | grep "BulkUpload"

# Park dormant code in .attic/ (gitignored; mirrors source path)
pnpm attic src/components/layouts/Profile/ShadeMarquee.tsx

# Regenerate payload types (fixes stale field errors). Requires DB up.
SKIP_ENV_VALIDATION=1 pnpm generate:types
```
