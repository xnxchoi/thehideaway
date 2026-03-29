# Highlightr — Claude Code Development Reference

> **Purpose:** Cross-session continuity doc for iterative development of the Highlightr system.
> Update this file at the end of every session. Commit it with the session's changes.

---

## What Highlightr Is

The core content-interaction layer of the site. Readers can:
- **Highlight** any text on a post/surf article (color-coded, persisted per user)
- **Add a memo** to a highlight (short public note, 200 char limit)
- **Add a private note** to a highlight (only visible to the author)
- **Respond** to a highlight via the sidebar drawer
- **Share** selected text to clipboard
- **Navigate** prev/next articles with sticky nav

Everything lives under `src/components/UX/Highlightr/`.

---

## Architecture

### Stack
| Layer | Tool |
|---|---|
| Text selection | Rangy (cross-browser) |
| Float menus | floating-ui |
| State | Zustand (vanilla store + context pattern) |
| Animations | Motion/React (Framer) + GSAP |
| Data fetching | React Query (`@tanstack/react-query`) |
| Scroll | Lenis |
| Backend | Payload CMS (`citations` collection) |
| Auth | better-auth via `useRPSession` |

### Data Flow

```
User selects text
  → containerMouseUp (index.tsx)
  → isMarkable() + ensureRange()
  → FloatHighlightMenu appears (floating-ui)
  → user clicks "Highlight"
  → CitationProvider.coreCreate()
  → createUserHighlight() → POST /api/citations
  → classApplier.applyToSelection() (Rangy marks DOM)
  → addHighlight() → Zustand store
  → updaterC() re-registers click handlers + updates minimap
```

```
User clicks existing highlight
  → handleHighlightClick()
  → setFocusedHighlight(reference)
  → FloatHighlightMenu repositions to highlight bounds
  → if private: PrivateDialog opens (view mode)
  → SideBar opens with CitationView
```

### File Map

```
src/components/UX/Highlightr/
├── index.tsx                  Main reader component (Narrateur → ReadInternal)
│                              Owns: float menu positioning, scroll progress,
│                              highlight event listeners, DOM sync, response node tracking
├── HighlightMenu.tsx          Float context menu (Memo / Highlight|Delete / Private Note / Share)
├── PrivateHighlights.tsx      Private note floating dialog + editor
├── floatDialog.tsx            Reusable floating-ui dialog primitive
├── DynamicIsland.tsx          Reading progress breadcrumb (SVG circle animation)
├── responseMap.tsx            Sidebar response position indicators (GSAP)
├── prevNext.tsx               Prev/next article sticky nav
├── Gated.tsx                  Locked content gate (fetches via React Query)
├── HighlightErrors.ts         Structured error classes (HighlightCreateError etc.)
├── types.ts                   All TypeScript types for citations
├── stores/index.ts            Color palette definitions (OKLCH)
│
├── providers/
│   ├── HighlighterProvider.tsx  Zustand store + all API fetch functions
│   │                            fetchUserHighlights, createUserHighlight,
│   │                            updateUserHighlight, deleteUserHighlight
│   ├── CitationProvider.tsx     CRUD orchestration layer (coreCreate/Update/Delete)
│   │                            Connects API calls ↔ DOM ↔ Zustand
│   ├── ArticleProvider.tsx      Article context (id, slug, author, locked, collection)
│   ├── RangerProvider.tsx       Rangy init + classApplier + targetContainer
│   ├── FloatProvider.tsx        Float menu open/shown state
│   ├── sideBarProvider.tsx      Sidebar drawer (SideBarProvider, CitationView, MemoInputField)
│   ├── author-ui.tsx            UserBar, SignInCard, SignInTriggerButton, isValidAuthor
│   ├── memo-input.tsx           MemoInput (character-limited textarea)
│   └── rangey.ts               Rangy module loader
│
├── utils/
│   └── highlight-helpers.ts    DOM/range utilities (isMarkable, rangeToData, walkNodes…)
│
└── styles/
    ├── _highlightr.scss        Mark/span.highlighted styling, OKLCH vars, animations
    ├── _highlightMenu.scss     Float menu open/close animations
    └── _privateNote.scss       Private note dialog animations
```

### Backend

```
src/payload/collections/Citations/
├── index.ts          Collection config: fields, access control, hooks
├── endpoints/
│   └── index.ts      Custom GET /citations/getNotes handler
└── query/
    └── index.ts      Server-side queryCitations (single author fetch, overrideAccess guard)
```

### API Endpoints

| Op | Method | URL | Auth |
|---|---|---|---|
| Fetch user's highlights | GET | `/api/citations/getNotes?collection=posts&id={docId}` | Required |
| Create highlight | POST | `/api/citations` | Required, not banned |
| Update highlight | PATCH | `/api/citations/{id}` | Required, author only |
| Delete highlight(s) | DELETE | `/api/citations?where[id][in][0]={id}` | Required, author only |
| User preference (color) | POST | `/api/payload-preferences/highlight-color` | Required |

### Access Control Summary

- **Read:** Unauthenticated users can read non-private citations. Auth users see own private + all public.
- **Create/Update/Delete:** Auth required. Banned users blocked. Update/Delete restricted to own citations (editors/admins can do all).
- **`overrideAccess: true`** is used only in server-side `queryCitations` (safe — filtered by userId).

---

## State: Zustand Store (`HighlighterProvider`)

```ts
{
  highlights: Map<reference, HighlightedRange>  // keyed by nanoid reference
  citations: ProcessedRangy[]                   // raw fetched, not yet DOM-applied
  focusedHighlight: HighlightedRange | null
  currentColor: HighlightColors                 // "ORANGE" | "BLUE" | "GREEN" | "YELLOW"
  targetContainer: RefObject<HTMLDivElement>    // the article content div
  target: { relationTo, value, slug, author }   // the current post/surf doc
}
```

`HighlightedRange` extends `ProcessedRangy` with:
- `els: Element[]` — DOM nodes wrapped by Rangy
- `range: rangy.RangyRange` — the original range object

---

## Iteration Log

### Iteration 1 — Audit & Critical Fixes (2026-03-30)

**Completed:**

| # | Fix | File(s) |
|---|---|---|
| 1 | `updateUserHighlight` sent `rest` instead of `params` — memo/private never persisted | `HighlighterProvider.tsx` |
| 2 | `PrivateNoteEditor.handleUpdate` not awaited — `finally` fired early, errors swallowed, dialog stayed open on success | `PrivateHighlights.tsx` |
| 3 | Banned users bypassed on create/update/delete via standard REST routes | `Citations/index.ts` |
| 4 | `SignInTriggerButton` had invisible/empty `DialogTrigger` — sign-in unreachable | `sideBarProvider.tsx` |
| 5 | `ResponseItem` timestamp never rendered (empty `{}` expression) | `sideBarProvider.tsx` |
| 6 | Color picker hidden for new text selections (gated on `focusedHighlight`) | `HighlightMenu.tsx` |
| 7 | Duplicate `useEffect` for input focus in `MemoInputField` | `sideBarProvider.tsx` |
| 8 | Wrong HTTP 401 for banned users (should be 403) | `Citations/endpoints/index.ts` |
| 9 | Double `getUserOverview` per citation (hook + query both fetching author) | `Citations/index.ts` |
| 10 | `gcTime: 60 * 100` = 6 seconds (typo — should be `60 * 1000 * 5`) | `index.tsx` |
| 11 | `Promise.allSettled` on synchronous array in `queryCitations` | `Citations/query/index.ts` |
| 12 | Unused `arr` variable in `createUserHighlight` | `HighlighterProvider.tsx` |
| 13 | Wrong error message "PredatorProvider" in `useCitations` | `CitationProvider.tsx` |
| 14 | Hardcoded `aria` description id in `MemoInput` | `sideBarProvider.tsx` |

**Commit:** `f5e231a`

### Iteration 2 — Surf Collection Fix + Private Dialog + Memo Submit (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | `fetchUserHighlights` hardcoded `collection: "posts"` — surf posts never loaded | `index.tsx` |
| 2 | `gcTime` query key `collection` not threaded into `queryFn` — still used hardcoded | `index.tsx` |
| 3 | `<LockedGate collection="posts">` hardcoded — surf lock state always wrong | `index.tsx` |
| 4 | `PrivateMemoizer` dual open state — `setOpen` from context pointed to dead `open` state | `PrivateHighlights.tsx` |
| 5 | `MemoInputField` "Respond" always called `creater`; if focused highlight should call `saveCallback` | `sideBarProvider.tsx` |
| 6 | `MemoButton.onSave` no-focus path missing `try/catch/finally` — `saving` stuck on failure | `sideBarProvider.tsx` |

**Commit:** `dfde0ce`

### Iteration 3 — N+1 Author Queries + Remove No-op Cache (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | N+1 `getUserOverview` calls in `queryCitations` — all citations share same author (filtered by userId); now single fetch | `Citations/query/index.ts` |
| 2 | Removed `react cache()` wrapper — no RSC context in Payload endpoint handler, provided no deduplication | `Citations/query/index.ts` |
| 3 | Removed `Promise.allSettled` on synchronous array | `Citations/query/index.ts` |
| 4 | Converted to `for...of` loop with per-citation error logging | `Citations/query/index.ts` |

**Commit:** `89263ba`

### Iteration 4 — Loading States, Ghost Author Links, A11y (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | No in-flight feedback during save/delete — button now shows "Saving…"/"Deleting…" with `animate-pulse` | `HighlightMenu.tsx` |
| 2 | Ghost user fallback linked to `/404` — `isValidAuthor` guard now conditionally renders `<Link>` only for valid authors | `sideBarProvider.tsx` |
| 3 | `afterReadCitation` hook re-fetched author on internal `queryCitations` calls — added `if (ctx.overrideAccess) return doc` guard | `Citations/index.ts` |
| 4 | "Private Note" button shown to unauthenticated users — wrapped in `{user && (...)}` | `HighlightMenu.tsx` |
| 5 | `Drawer.Description className="hidden"` — changed to `sr-only` with descriptive text | `sideBarProvider.tsx` |

**Commit:** `6696ed4`

### Iteration 5 — sideBarProvider Split + Dead Code Removal (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | Extract `UserBar`, `SignInCard`, `SignInTriggerButton`, `isValidAuthor` → `author-ui.tsx` | new file |
| 2 | Extract `MemoInput` → `memo-input.tsx` | new file |
| 3 | `sideBarProvider.tsx` reduced from 999 → ~430 lines | `sideBarProvider.tsx` |
| 4 | Remove `MemoButton` (only used by `previousVersion.tsx`, which was unreferenced) | `sideBarProvider.tsx` |
| 5 | Delete `previousVersion.tsx` legacy dead file | deleted |
| 6 | Remove `PrivateNoteHeader` and `PrivateDialog` dead components | `PrivateHighlights.tsx` |
| 7 | Update `HighlightMenu` and `PrivateHighlights` to import from new module paths | both |

**Commit:** `211748b`

### Iteration 6 — Error handling + avatar deduplication (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | `PrivateNoteEditor.onSave` new-highlight path: fire-and-forget `.then()` chain → async IIFE with `try/catch/finally` | `PrivateHighlights.tsx` |
| 2 | `CitationView` 40-line inline avatar block replaced with `<UserBar>` | `sideBarProvider.tsx` |

**Commit:** `5044a21`

### Iteration 7 — Debug log cleanup + safe error cause access (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | Remove 3 `console.log` statements from catch blocks | `HighlighterProvider.tsx`, `HighlightMenu.tsx` |
| 2 | Inline `updateUserHighlight` fetch chain, removing no-op pass-through `.catch` | `HighlighterProvider.tsx` |
| 3 | `deleteUserHighlight` catch: guard `e.cause` access before `"type" in cause` check | `HighlighterProvider.tsx` |

**Commit:** `da2aef1`

### Iteration 8 — Broken tagged link, responseNodes type cleanup (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | Fix hardcoded `/src/app/(frontend)/...` prefix on tagged links — 404 in production | `index.tsx` |
| 2 | `updateResponseNodes`: trim to `{top, reference}` only (extra fields were discarded by state type); `for...of` loop | `index.tsx` |
| 3 | Remove unused `AuthorOverview` import | `index.tsx` |

**Commit:** `23fbd7a`

### Iteration 9 — Gated fetch robustness + coreDelete guard (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | `Gated.tsx`: check `res.ok` before parsing JSON; forward `AbortSignal` to fetch | `Gated.tsx` |
| 2 | `coreDelete`: throw `HighlightDeleteError` on invalid `els` instead of silent return | `CitationProvider.tsx` |
| 3 | Remove duplicate `selection.removeAllRanges()` in `coreDelete` | `CitationProvider.tsx` |

**Commit:** `0393073`

### Iteration 10 — Dead code removal in highlight-helpers (2026-03-30)

| # | Fix | File(s) |
|---|---|---|
| 1 | Remove exported `rangeToData` function — never imported anywhere | `highlight-helpers.ts` |
| 2 | Remove commented-out old `isMarkable` implementation | `highlight-helpers.ts` |

**Commit:** (pending)

---

## Known Remaining Issues

Track these across sessions. Strike through when fixed and move to Iteration Log.

### Security

- [ ] **Public citations readable without auth** — The `read` access returns `{ private: { not_equals: true } }` for unauthenticated requests, exposing all public highlight activity. Design decision to evaluate.

### Performance

- [ ] **`updateMiniMap` iterates all highlights on every store change** — Could diff against previous map to skip re-render when nothing changed.

### UX / Polish

- [ ] **Color picker: changing color only updates preference, not focused highlight color in DOM** — `changeCurrentHighlightColor` saves for future highlights but does not re-color an existing focused highlight in real-time.

---

## Development Approach

### Principles
1. **Fix before feature** — Each iteration starts with bugs from the known issues list before any new capability.
2. **Full-stack per issue** — When fixing a frontend issue, check the corresponding backend path and vice versa.
3. **Test the real interaction** — DOM manipulation + Rangy + floating-ui = many edge cases. Think through: new selection, focused highlight, locked post, unauthenticated user, banned user.
4. **Access control is non-negotiable** — Every backend change must be reviewed against all four CRUD operations.
5. **Don't break the DOM cleanup** — `coreDelete` manually unwraps Rangy `<mark>` elements. Any change to highlight creation must keep the reference/els contract intact.

### Non-obvious Patterns to Remember

- **`reference` (nanoid) vs `id` (Payload DB id)** — `reference` is generated client-side on create and stored in DB. DOM nodes use `data-reference`. The store's Map is keyed by `reference`. Payload's REST uses `id`.
- **`overrideAccess: true` in context** — The query pattern uses `req.context.overrideAccess` not the Payload query-level flag. Check `ctx.overrideAccess` in access functions before `req.user`.
- **`beforeValidateCitation` is the gatekeeper** — All data normalization (quote generation, hash, private flag logic) happens in the hook. Client sends raw data; hook normalizes it. Don't duplicate this logic client-side.
- **Rangy `classApplier.applyToSelection()`** applies to the current browser selection. The sequence is always: save range → API call → restore selection (if needed) → apply → query new `.highlighted` nodes → diff against previous → assign `data-reference`.
- **`els` array** — Multiple DOM nodes per highlight (when selection spans block elements). Always iterate `els`, never assume `els[0]` is the only node.
- **`useShallow` on Zustand selectors** — Used when selecting objects/maps to prevent re-renders on reference equality mismatches. Always use it for `highlights` Map and `focusedHighlight`.

---

## Session Checklist

At the start of each session:
1. Read this file
2. Check git log for commits since last session
3. Pick top item(s) from Known Remaining Issues
4. Fix → test interaction paths → commit
5. Update this file (move fixed items to Iteration Log, add new findings)
6. Push branch, update PR if open
