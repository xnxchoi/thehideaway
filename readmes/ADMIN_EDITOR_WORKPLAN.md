# Admin Editor Workplan

Date: 2026-06-25

Status: Proposed execution plan, built from `readmes/ADMIN_EDITOR_BLUEPRINT_AUDIT.md`.

Scope: Payload admin customization, Posts/Surf custom edit view, Lexical title
and body authoring, block authoring, block-to-public-reader rendering, and the
longform reader contract around Highlightr and Ambient Audio.

## Executive Decision

The implementation order should be:

1. Runtime verification and surface registry.
2. Critical fixes exposed by that verification.
3. Payload-internal import containment and cleanup.
4. Editorial authoring UX improvements.
5. Public reader polish and optional quality work.

Reason: the blueprint is directionally coherent, but active wiring is not the
same thing as runtime validity. The largest failure mode is deleting or
rewriting intentional editor behavior because it looks stale in static search.

Council result:

- Architect position: verification plus safety first; protect intentional
  title/body handoff and reader contracts.
- Skeptic position: runtime verification first; architecture cleanup should
  follow observed failures, not speculation.
- Critic position: runtime verification first; custom Payload components can be
  registered while still failing on save, reload, serialization, permissions, or
  bundling.
- Pragmatist dissent: visible editorial UX is the point of the system; do not
  let architecture cleanup absorb the phase.

Verdict: start with a hard runtime harness, but make the harness exercise the
actual writing experience rather than only loading `/vault`.

## Current Evidence

Verified local package snapshot from installed package metadata:

- Next: `16.2.9`
- Payload: `3.85.1`
- `@payloadcms/next`: `3.85.1`
- `@payloadcms/richtext-lexical`: `3.85.1`
- Lexical: `0.41.0`

Active wiring confirmed:

- Posts edit view uses `@/payload/views/Edit/index.tsx#EditView`.
- Surf edit view uses `@/payload/views/Edit/index.tsx#EditView`.
- Generated Payload import map includes the custom EditView, custom Article
  Title and Content fields, Ambient Audio, Mentions, LinkPreview, FormatImport,
  RP context menu, ImageBlock, and Ambient Audio anchor block component.
- Public essay route renders through `Narrateur`, `RichText`,
  `AmbientAudioProvider`, `MiniMap`, and `DynamicBreadcrumb`.
- Public Surf had a source-backed mismatch: the canonical
  `src/app/(frontend)/(site)/(content)/surf/[slug]/page.tsx` route selected
  `content` but returned only `surfsData.title`. Sprint 1 now renders
  `SurfContent` with the fetched Lexical body. Browser proof with deterministic
  fixture content is still pending.

Verified route table:

- Canonical essays: `/essays/:slug`.
- Canonical Surf: `/surf/:slug`.
- Vanity essays: `/@:user/essays/:slug` rewrites to `/essays/:slug`.
- Vanity Surf: `/@:user/surf/:slug` rewrites to `/surf/:slug`.
- Admin preview and live preview are separate surfaces. Posts live preview uses
  `generatePreviewPathWithAuthor()`, Posts `admin.preview` uses
  `generatePreviewPath()`, and Surf uses `generatePreviewPathWithAuthor()` for
  both live preview and `admin.preview`. Treat preview as a four-row P0 matrix,
  not one generic `/next/preview` route.
- Preview URL shape differs today: Posts preview functions return relative
  `/next/preview?...` URLs, while Surf prepends `getServerSideURL()` and returns
  absolute URLs. Record both generated URL and final redirected pathname during
  preview verification.
- Before Sprint 1, `generatePreviewPathWithAuthor()` built
  `/users/:user/essays/:slug` and `/users/:user/surf/:slug`, while the app tree
  had `users/[user]/posts` and no matching `users/[user]/essays` or
  `users/[user]/surf` detail routes. Sprint 1 now emits the existing
  `/@:user/essays/:slug` and `/@:user/surf/:slug` vanity rewrite paths.
- Before Sprint 1, `generatePreviewPath()` mapped only `pages`; Posts
  `admin.preview` passed `collection: "posts"`, so the generated `path` could
  be malformed. Sprint 1 now maps Pages, Posts, Surf, Users, and Profile with
  focused unit coverage.
- Pages, Users, and Profile `admin.preview` are control surfaces for
  `generatePreviewPath()`. Pages and Users use that helper for both live preview
  and `admin.preview`; Profile uses `generatePreviewPathWithAuthor()` for live
  preview and `generatePreviewPath()` for `admin.preview`. Any fix to Posts
  preview must preserve those preview behaviors.

Framework-doc sanity checks:

- Payload 3.85 supports custom Lexical features through `lexicalEditor()`,
  `BlocksFeature`, custom blocks, inline blocks, and admin component paths.
- Payload exposes block/inline-block client helpers from
  `@payloadcms/richtext-lexical/client`; that should be preferred where it can
  replace `node_modules/@payloadcms/.../dist` imports.
- Payload import-map configuration is load-bearing for custom admin components.
- Next 16 uses Turbopack by default for `next dev` and `next build`; generated
  import-map and bundler behavior belong in the verification path.

Known constraints:

- Do not edit generated `src/app/(payload)/vault/importMap.js` directly.
- After moving custom admin components, run `pnpm generate:importmap`; do not run
  it as a blanket smoke test because it rewrites a tracked generated file.
- After collection, block, or field config changes, run `pnpm generate:types`;
  do not run it as a blanket smoke test because it rewrites tracked generated
  types.
- If DB shape changes, follow `readmes/MIGRATIONS.md`.
- `pnpm generate:types` requires a reachable DB in this repo; if env validation
  blocks the command during local verification, use the documented
  `SKIP_ENV_VALIDATION=1 pnpm generate:types` path from `readmes/TYPE_DEBT.md`
  after confirming the DB is up.
- Do not manually edit generated Payload types.
- Do not delete dormant code directly. Use `pnpm attic`.
- `.attic/` is tracked and excluded from production build and TypeScript checks.
- TypeScript build errors are deferred in this repo; `next.config.ts` has
  `typescript.ignoreBuildErrors = true`, so verification must include runtime
  checks, not just `next build`.

## Blueprint Invariants

These are the behavior contracts to preserve unless the product direction is
explicitly revised.

1. Payload remains the operating system.
   - Keep Payload auth, collections, permissions, routing, import map, drafts,
     versions, live preview, and App Router admin shell.

2. Posts and Surf are the editorial writing room.
   - The custom Edit view is collection-scoped and intentionally applies to
     Posts and Surf, not every Payload collection.

3. Title and body should feel like one continuous writing surface.
   - Rich title and rich body are separate fields, but focus, Backspace,
     arrows, and slash/context behavior should feel document-like.

4. Blocks are editorial objects.
   - Image, Code, Ambient Audio anchors, mentions, links, and relationships
     are authoring objects with public-rendering consequences.

5. Admin output must survive the public reader.
   - Authoring choices should render correctly through `RichText`,
     Highlightr, Ambient Audio, MiniMap, Dynamic Island, and reading styles.

6. Prefer public Payload extension points.
   - Internal `node_modules/@payloadcms/.../dist` imports are allowed only when
     there is a recorded reason, owner, and post-upgrade test.

## Priority Model

### P0 - Critical

Fix or complete before broad cleanup or visual polish.

- Runtime verification harness for the full authoring-to-reader flow.
- Surface registry that marks files as active, stale, forked, or protected.
- Post/Surf custom EditView smoke tests.
- Lexical title/body handoff verification.
- Save, reload, draft/publish, preview, and public render checks.
- Import-map regeneration checks after any admin component movement.
- Generated-type regeneration checks after collection, block, or field config
  changes.
- Internal Payload import catalog and risk classification.
- Surf public-render gap and admin preview-path mismatch investigation.
- Pages, Users, and Profile preview regression checks for any change to
  `generatePreviewPath()`.

### P1 - Necessary

Do after P0 evidence exists.

- Replace internal imports where a public API is available.
- Add doctrine comments or docs around intentional local forks.
- Move truly unused files to `.attic/` through `pnpm attic`.
- Split large files only where a behavior contract and test coverage exist.
- Add focused tests or scripted checks around active custom features.

### P2 - Good To Have

Do after the critical path is stable.

- Improve editor visual hierarchy, density, and longform writing comfort.
- Improve block authoring affordances and empty/error states.
- Align admin/editor typography with the working-surface design system.
- Improve public reader transitions and authoring-preview parity.
- Add optional bundle-analysis and performance cleanup for large editor chunks.

## Dependency Graph

```text
0 Registry + fixtures
  -> 1 Runtime verification harness
     -> 2 Critical runtime fixes
        -> 3 Payload internal import containment
        -> 4 Dead-code attic pass
        -> 5 Editor UX pass
        -> 6 Public reader parity pass
        -> 7 Performance and bundle pass
        -> 8 Final Santa review and release notes
```

Parallel opportunities:

- Step 3 analysis can begin after Step 1, but Step 3 code changes should wait
  until Step 2 closes P0 runtime blockers for the affected surface.
- Step 5 editor UX work is blocked by Step 2 exit criteria. Screenshots and UX
  notes can be gathered earlier, but code changes should not.
- Step 4 can run in parallel only for files proven unused by Step 0 and not
  touched by Step 2 or Step 5.
- Step 7 can run after Step 1 as analysis-only, but bundle/performance fixes
  should wait until major file movements from Steps 3-6 settle.

## Step 0 - Surface Registry And Fixtures

Priority: P0

Goal: make active versus stale code legible before any cleanup.

Context brief:

- The audit found active wiring and likely cleanup candidates, but not a
  durable registry.
- Large files and internal Payload imports make static dead-code decisions
  risky.
- The public reader is part of the editor contract.

Tasks:

- Create `readmes/ADMIN_EDITOR_SURFACE_REGISTRY.md`.
- Include columns: path, surface, active status, owner behavior, public API or
  internal fork, risk level, verification route, cleanup decision.
- Seed the registry with:
  - `src/payload/views/Edit/index.client.tsx`
  - `src/payload/fields/Article/Title/index.tsx`
  - `src/payload/fields/Article/Content/index.tsx`
  - `src/payload/collections/Posts/richTitle.ts`
  - `src/payload/collections/Posts/richContent.ts`
  - `src/payload/Lexical/Features/HandOff/*`
  - `src/payload/Lexical/Features/AmbientAudio/*`
  - `src/payload/Lexical/Features/Mentions/*`
  - `src/payload/Lexical/Features/RP_CtxMenu/*`
  - `src/payload/Lexical/Features/FormatImport/*`
  - `src/payload/Lexical/Features/LinkPreview/*`
  - `src/blocks/ImageBlock/*`
  - `src/blocks/Code/*`
  - `src/components/UX/RichText/index.tsx`
  - `src/components/UX/Highlightr/*`
  - `src/components/UX/AmbientAudio/*`
  - `src/payload.config.ts`
  - `src/app/(payload)/layout.tsx`
  - `src/utilities/generatePreviewPath.ts`
  - `src/app/(frontend)/(site)/(pages)/next/preview/route.ts`
  - `next.config.ts`
  - `src/payload/collections/Pages/index.ts`
  - `src/payload/collections/Users/index.ts`
  - `src/payload/collections/Profile/index.ts`
- Define test content fixtures:
  - Post with rich title, paragraphs, headings, image block, code block,
    external link, internal relationship link, mention, and Ambient Audio anchor.
  - Surf entry using the same title/body contract.
  - Public essay and Surf targets with citations/highlights and MiniMap or
    equivalent reader affordances enabled where supported.
- Define a deterministic fixture lifecycle before automation:
  - create fixture
  - record fixture ID, slug, author slug, and expected public route
  - reset fixture to known state
  - clean fixture after verification
- Define a deterministic Highlightr/Citations fixture lifecycle:
  - create one Post target and one Surf target unless there is a documented
    reason to reuse existing records
  - create citations through `/api/citations` or a small fixture script
  - record target collection, document ID, author slug, citation IDs, and
    expected public route
  - verify `/api/citations/getNotes?collection=posts&id={docId}` and
    `/api/citations/getNotes?collection=surf&id={docId}`
  - delete fixture citations through the documented delete flow or fixture
    cleanup script
- Reuse existing seed/cleanup scripts where they fit, such as the Butler post
  scripts in `package.json`: `seed:butler-posts`, `cleanup:butler-posts`, and
  `cleanup:dev-fixtures`. If Surf or highlight-bearing essay fixtures have no
  comparable script, create or plan the smallest equivalent before treating the
  route checks as repeatable.

Verification:

```bash
rtk rg -n "EditView|RichTextField|AmbientAudio|Mention|ImageBlock" src/app/\(payload\)/vault/importMap.js
rtk rg -n "serializeLexical|Article/Content/rsc" src
rtk rg -n "import\\(\\\"\\./inline\\\"\\)|import\\('./inline'\\)|Article/Title/inline" src
rtk rg -n "node_modules/@payloadcms|payload/dist|@payloadcms/.*/dist" src/payload src/blocks src/components/UX/RichText
```

Exit criteria:

- Every protected file has a named owner behavior.
- Every cleanup candidate is marked `candidate`, not deleted.
- Every internal import has a row or a follow-up row.

Rollback:

- Documentation-only step. Revert the registry doc if it misclassifies a file.

## Step 1 - Runtime Verification Harness

Priority: P0

Goal: prove the customized editor works under real Payload routes before
refactoring it.

Context brief:

- Generated import-map entries prove registration, not behavior.
- The editor can fail at save/reload, Lexical serialization, draft/version
  handling, permissions, live preview, bundling, or hydration.
- Browser preview can be misleading in this repo, so use route-specific checks
  and screenshots as evidence.

Tasks:

- Start local dependencies and dev server using a reproducible path:
  - cold start: `pnpm dev:init` or `pnpm migrate` followed by `pnpm dev`
  - warm start with migrated DB: `pnpm dev`
- Verify `/vault` loads with the generated import map.
- Verify preview preconditions:
  - authenticated `/vault` session
  - `PREVIEW_SECRET` present
  - fixture has a known author slug
  - checks distinguish clicking the admin UI preview control from replaying a
    generated `/next/preview?...` URL
- Exercise an existing Post:
  - open edit view
  - focus rich title
  - hand off from title to content
  - insert paragraph, heading, link, mention, code block, image block, and
    Ambient Audio anchor
  - save draft
  - reload edit page
  - publish or update
  - open live preview
  - open the admin preview control or SEO PreviewField flow
- Exercise an existing Surf entry with the same title/content handoff and save
  flow.
- Open the public essay route and confirm custom blocks render through
  `RichText`, `AnchorMarkers`, Highlightr, MiniMap, and Dynamic Island.
- Open the public Surf route and confirm whether the authored rich body renders.
  Sprint 1 source now renders `SurfContent` with fetched body content, but this
  still needs browser evidence against deterministic fixture content.
- Test vanity rewrites separately from canonical routes:
  - `/@:author/essays/:slug`
  - `/@:author/surf/:slug`
- Test preview separately from canonical and vanity routes using this matrix:
  - Posts `admin.livePreview.url`: generator
    `generatePreviewPathWithAuthor()`, expected public target to verify against
    `/essays/:slug` or an intentionally supported author path; current URL shape
    is relative.
  - Posts `admin.preview`: generator `generatePreviewPath()`, expected public
    target to verify against `/essays/:slug`; Sprint 1 fixed the previous
    malformed `path=undefined/:slug` helper output; current URL shape is
    relative.
  - Surf `admin.livePreview.url`: generator `generatePreviewPathWithAuthor()`,
    expected public target to verify against `/surf/:slug` or an intentionally
    supported author path; current URL shape is absolute via
    `getServerSideURL()`.
  - Surf `admin.preview`: generator `generatePreviewPathWithAuthor()`, expected
    public target to verify against `/surf/:slug` or an intentionally supported
    author path; current URL shape is absolute via `getServerSideURL()`.
  - Pages live preview and `admin.preview`: control rows for
    `generatePreviewPath()`; must keep working if Posts preview changes the
    helper.
  - Users live preview and `admin.preview`: control rows for
    `generatePreviewPath()`; must keep working if Posts preview changes the
    helper.
  - Profile `admin.preview`: control row for `generatePreviewPath()`; Profile
    live preview is a separate `generatePreviewPathWithAuthor()` control row.
- Record for every preview row:
  - generated preview URL
  - URL shape, relative or absolute
  - `path` query value
  - final redirected pathname
  - whether that pathname exists in the app tree
- Use this compact preview evidence shape in the registry or audit folder:
  `surface | generator | generated URL | relative/absolute | path query | final
pathname | route exists | result`.
- Capture screenshots into `readmes/audit-admin-editor-YYYY-MM-DD/`.
- Write observed failures into the registry before fixing them.

Preferred commands:

```bash
rtk pnpm dev:init
rtk pnpm build
rtk pnpm test
rtk rg -n "EditView|RichTextField|AmbientAudio|Mention|ImageBlock" src/app/\(payload\)/vault/importMap.js
```

Notes:

- If `pnpm` fails because its store/cache database is outside workspace
  permissions, rerun with approval rather than changing package-manager state.
- Use Playwright only after the route and fixture IDs are known. Manual smoke
  is acceptable for the first pass if auth/session setup blocks automation.

Exit criteria:

- A repeatable authoring-to-reader checklist exists.
- Screenshots or explicit blockers exist for each critical step.
- Failures are classified as critical, necessary, or polish.

Rollback:

- No source changes except docs and optional fixture/test scaffolding. Revert
  docs if they record wrong route IDs or fixture assumptions.

## Step 2 - Critical Runtime Fixes

Priority: P0

Goal: fix failures that prevent real writing, saving, previewing, or reading.

Context brief:

- Do not start with broad cleanup.
- Fix only failures found in Step 1.
- Preserve the blueprint invariants.

Likely fix areas:

- Broken custom EditView load or hydration.
- Missing import-map entries after component movement.
- Rich title to rich content handoff failures.
- Preview path mismatch by surface:
  - Posts live preview using `generatePreviewPathWithAuthor()`.
  - Posts `admin.preview` using `generatePreviewPath()`.
  - Surf live preview using `generatePreviewPathWithAuthor()`.
  - Surf `admin.preview` using `generatePreviewPathWithAuthor()`.
  - Pages live preview and `admin.preview` as `generatePreviewPath()` control
    surfaces.
- Lexical feature schema mismatches in
  `src/payload/fields/Article/Content/index.tsx`.
- Blocks inserted in admin but not rendered publicly.
- Surf public route not rendering authored rich body or rich-text blocks.
- Ambient Audio anchors saved but not detected by `AmbientAudioProvider`.
- Image block insert/edit flows that break save or reload.
- Public reader crashes caused by malformed rich text.

Likely preview files:

- `src/utilities/generatePreviewPath.ts`
- `src/app/(frontend)/(site)/(pages)/next/preview/route.ts`
- `src/payload/collections/Posts/index.ts`
- `src/payload/collections/Surf/index.ts`
- `src/payload/collections/Pages/index.ts`
- `next.config.ts`

Verification:

```bash
rtk pnpm build
rtk pnpm test
```

Conditional generated-file commands:

```bash
# Only if admin component paths/import-map config changed
rtk pnpm generate:importmap

# Only if collection, block, field config, or DB-tracked shape changed
rtk pnpm generate:types
```

Manual/browser routes:

- `/vault/collections/posts/:id`
- `/vault/collections/surf/:id`
- `/essays/:slug`
- `/surf/:slug`
- `/@:author/essays/:slug` as a rewrite smoke test
- `/@:author/surf/:slug` as a rewrite smoke test
- `/next/preview?...` for all four preview matrix rows:
  - Posts live preview
  - Posts `admin.preview`
  - Surf live preview
  - Surf `admin.preview`
- Pages live preview and Pages `admin.preview` as preview-helper control checks.
- Users live preview and Users `admin.preview` as preview-helper control checks.
- Profile live preview and Profile `admin.preview` as preview-helper control
  checks.

Exit criteria:

- No known P0 authoring-to-reader blocker remains.
- Each fix has a test, screenshot, or documented manual verification.
- Import map is regenerated if admin component paths changed.

Rollback:

- Revert the narrow fix patch. Do not roll back unrelated user work.

## Step 3 - Payload Internal Import Containment

Priority: P0/P1

Goal: reduce Payload upgrade risk without breaking the custom editor.

Context brief:

- Static search confirmed many imports from `node_modules/@payloadcms/.../dist`
  and `payload/dist`.
- Some are type-only and lower risk.
- Some are active runtime dependencies and high risk.
- Payload public APIs should be preferred when they exist, especially
  `@payloadcms/richtext-lexical`, `@payloadcms/richtext-lexical/client`,
  `payload`, and `@payloadcms/ui`.

Tasks:

- Extend the registry with each internal import:
  - file
  - import path
  - type-only or runtime
  - public replacement candidate
  - reason it exists
  - Payload version last verified against
  - post-upgrade test
- Replace low-risk type imports first if a public export exists.
- Replace rich-text block helpers with public client exports where possible.
- For imports that must remain internal, add a short doctrine comment near the
  import or a registry note explaining why.

Verification:

```bash
rtk rg -n "node_modules/@payloadcms|payload/dist|@payloadcms/.*/dist" src/payload src/blocks src/components/UX/RichText
rtk pnpm build
```

Conditional generated-file command:

```bash
# Only if admin component paths/import-map config changed
rtk pnpm generate:importmap
```

Exit criteria:

- Every internal import is either removed or justified.
- High-risk runtime imports have route-level verification.
- The plan can survive a future Payload minor upgrade review.

Rollback:

- Revert individual import replacements that fail runtime checks.

## Step 4 - Dead-Code Attic Pass

Priority: P1

Goal: remove confirmed-dormant code from active source without losing recovery
history.

Context brief:

- Cleanup candidates from the audit were based on import search, not runtime
  proof.
- Project policy: never `rm`; use `pnpm attic`.

Protected from this pass:

- `src/payload/fields/Article/Title/inline.tsx`: active lazy import from
  `src/payload/fields/Article/Title/index.tsx`; do not attic unless that title
  editor wiring is intentionally replaced.

Initial candidates:

- `src/components/UX/RichText/serialize.tsx`
- `src/payload/fields/Article/Content/rsc.tsx`

Tasks:

- Re-run import searches after Step 2.
- Check dynamic imports before publishing any candidate list.
- Check generated import map and Payload config for dynamic references.
- Confirm no route, block, or server component imports the candidate.
- Move candidates with `pnpm attic`, one logical group at a time.
- Run verification after each group.

Commands:

```bash
rtk rg -n "serializeLexical|Article/Content/rsc" src src/app readmes
rtk rg -n "import\\(\\\"\\./inline\\\"\\)|import\\('./inline'\\)|Article/Title/inline" src src/app readmes
rtk pnpm attic src/components/UX/RichText/serialize.tsx
rtk pnpm attic src/payload/fields/Article/Content/rsc.tsx
rtk pnpm build
```

Route smoke checks after each attic group:

- `/vault/collections/posts/:id`
- `/vault/collections/surf/:id`
- `/essays/:slug`
- `/surf/:slug`

Exit criteria:

- Dormant files are in `.attic/` with mirrored paths.
- No active import path is broken.
- Public reader and `/vault` smoke routes still work.

Rollback:

- Move a file back from `.attic/` only if verification proves it is needed.

## Step 5 - Editor UX And Visual Design Pass

Priority: P1/P2

Goal: make the admin editor feel like an editorial writing instrument without
breaking Payload's contracts.

Context brief:

- The design system says admin/vault surfaces are mostly sans, typographic,
  working surfaces with restrained chrome.
- The product goal is not a generic SaaS dashboard. It is a quiet, editorial,
  writer-centered CMS.
- Pragmatist council dissent matters here: editor trust is partly felt, not
  only architectural.

Tasks:

- Audit the actual Post and Surf edit screens from screenshots captured in Step
  1.
- Classify styling files by surface:
  - admin shell
  - custom Edit view
  - Lexical content editable
  - title editor
  - block authoring UI
  - public reader
  - feature overlays
- Improve hierarchy and comfort:
  - title/body continuity
  - focus states
  - longform column width
  - block insertion affordances
  - empty state and placeholder tone
  - sidebar/control density
  - error states and recovery language
- Keep UI strings out of hardcoded locale branches where user-facing copy is
  involved.

Likely files:

- `src/app/(payload)/custom.scss`
- `src/payload/views/index.scss`
- `src/payload/Lexical/EditorTheme.scss`
- `src/payload/fields/Article/Content/LexicalProvider/LexicalEditor.scss`
- `src/payload/fields/Article/Title/LexicalProvider/LexicalEditor.scss`
- `src/payload/views/Edit/index.client.tsx`
- `src/payload/elements/DocumentFields/index.tsx`
- `src/payload/elements/DocumentControls/index.tsx`

Verification:

- Desktop and mobile screenshots for `/vault/collections/posts/:id`.
- Desktop and mobile screenshots for `/vault/collections/surf/:id`.
- Keyboard-only pass through title, body, block insertion, save, and preview.
- Contrast check for readable text. Body text should not fall below the project
  opacity floor.

Exit criteria:

- Editor looks and feels coherent with the Hideaway working-surface doctrine.
- No text overlap or broken layout at mobile and desktop widths.
- Title/body handoff remains intact.
- Save/reload/preview still pass.

Rollback:

- Revert styling and UX changes by surface. Avoid rolling back runtime fixes.

## Step 6 - Public Reader Parity Pass

Priority: P1/P2

Goal: make sure authoring decisions produce the intended reading experience for
both Posts and Surf.

Context brief:

- The editor is not done when `/vault` works.
- Public rendering through `RichText`, Highlightr, Ambient Audio, MiniMap,
  Surf, and reading styles is part of the authoring contract.
- Surf is a separate product surface. Sprint 1 fixed the source-level
  title-only rendering in `surf/[slug]/page.tsx`, but Surf rich-body rendering
  must still be explicitly verified in the browser with fixture content.

Tasks:

- Verify public rendering for each editor object:
  - headings
  - paragraphs
  - links
  - relationship links
  - mentions
  - image block
  - code block
  - Ambient Audio anchor
- Verify Highlightr interactions on generated content:
  - select text
  - create highlight
  - reload
  - MiniMap updates
  - Dynamic Island display
- Verify Highlightr/Citations fixtures on both supported content collections:
  - create a highlight on `/essays/:slug`
  - create a highlight on `/surf/:slug`
  - reload both routes and confirm highlights rehydrate
  - verify MiniMap and Dynamic Island behavior on both routes where supported
  - verify vanity Surf rewrite with the same reader interaction path
  - clean up created citation IDs through the documented citation delete flow or
    fixture cleanup script
- Verify Surf public rendering separately:
  - `/surf/:slug` renders the authored body, not only title text
  - `/@:author/surf/:slug` rewrites to the canonical Surf route
  - `src/components/content/surf/surf.tsx` rich-text rendering is either used by
    the detail route or intentionally superseded
  - Surf-supported blocks render or are explicitly scoped out
- Compare admin preview and public route for major visual mismatches.
- Record mismatch categories in the registry.

Likely files:

- `src/components/UX/RichText/index.tsx`
- `src/components/UX/Highlightr/index.tsx`
- `src/components/UX/Highlightr/MiniMap.tsx`
- `src/components/UX/Highlightr/DynamicIsland.tsx`
- `src/components/UX/AmbientAudio/*`
- `src/app/(frontend)/(site)/(content)/surf/[slug]/page.tsx`
- `src/components/content/surf/surf.tsx`
- `src/styles/reading.scss`
- `src/blocks/ImageBlock/Component.tsx`
- `src/blocks/Code/Component.client.tsx`

Verification:

- Public essay route screenshot set.
- Public Surf route screenshot set.
- Highlight create/reload pass.
- Ambient Audio anchor detection pass.
- Reader routes do not crash with every supported rich-text object.

Exit criteria:

- Editor fixture renders without missing blocks.
- Surf fixture renders its authored rich body or has a documented product
  decision explaining why Surf detail pages are title-only.
- Highlightr and Ambient Audio still work on the fixture.
- Any visual mismatches are classified as polish, not blockers.

Rollback:

- Revert reader-specific changes. Do not alter saved content shape unless a
  migration path is written.

## Step 7 - Performance And Bundle Pass

Priority: P2

Goal: understand and reduce heavy editor/admin chunks after the behavior is
stable.

Context brief:

- Large client files are known:
  - Edit view client: 932 lines.
  - Article Content field: 728 lines.
  - ImageBlock client component: 2063 lines.
  - AmbientAudio plugin: 656 lines.
- Next 16 can analyze Turbopack module graphs with `next experimental-analyze`.

Tasks:

- Run a bundle/module analysis pass after Steps 2-6 settle.
- Identify large editor dependencies and repeated client imports.
- Split only where it improves loading or maintainability without breaking
  import-map registration.
- Prefer lazy loading for non-critical drawers, media tools, previews, and
  optional panels.

Commands:

```bash
rtk pnpm next experimental-analyze
rtk pnpm build
```

Exit criteria:

- Large chunks are documented.
- Any splits preserve `/vault` and public reader behavior.
- No bundle work changes saved content shape.

Rollback:

- Revert each split independently if import-map, hydration, or route smoke tests
  fail.

## Step 8 - Final Quality Gate

Priority: P0 for critical path, P2 for polish completion

Goal: prevent plan drift and verify completed work against the original
blueprint.

Tasks:

- Re-run the authoring-to-reader checklist.
- Re-run internal import search and update the registry.
- Re-run cleanup candidate search.
- Run build/test/import-map commands appropriate to the changed files.
- Use a Santa Method review with two independent reviewers before declaring the
  subsystem complete.

Verification:

```bash
rtk rg -n "node_modules/@payloadcms|payload/dist|@payloadcms/.*/dist" src/payload src/blocks src/components/UX/RichText
rtk rg -n "serializeLexical|Article/Content/rsc" src src/app readmes
rtk rg -n "import\\(\\\"\\./inline\\\"\\)|import\\('./inline'\\)|Article/Title/inline" src src/app readmes
rtk pnpm build
rtk pnpm test
```

Conditional generated-file commands:

```bash
# Only if admin component paths/import-map config changed
rtk pnpm generate:importmap

# Only if collection, block, field config, or DB-tracked shape changed
rtk pnpm generate:types
```

Route checks:

- `/vault/collections/posts/:id`
- `/vault/collections/surf/:id`
- `/essays/:slug`
- `/surf/:slug`
- `/@:author/essays/:slug`
- `/@:author/surf/:slug`
- `/next/preview?...` for the four preview matrix rows:
  - Posts live preview
  - Posts `admin.preview`
  - Surf live preview
  - Surf `admin.preview`
- Pages live preview and Pages `admin.preview` as preview-helper control checks.
- Users live preview and Users `admin.preview` as preview-helper control checks.
- Profile live preview and Profile `admin.preview` as preview-helper control
  checks.

Santa rubric:

- Completeness: every P0 item has evidence or a documented blocker.
- Preservation: title/body handoff, custom EditView, blocks, Ambient Audio, and
  Highlightr contracts still work.
- Surf parity: Surf edit, save, preview, and public rich-body rendering are
  verified or intentionally scoped with a product decision.
- Preview parity: Posts live preview, Posts `admin.preview`, Surf live preview,
  and Surf `admin.preview` are all verified separately.
- Preview-helper controls: Pages, Users, and Profile preview surfaces still pass
  after preview-helper changes.
- Maintainability: every internal Payload import is removed or justified.
- Cleanup safety: no active file was deleted directly; dormant files used
  `pnpm attic`.
- UX quality: editor screenshots show coherent hierarchy, readable text, and no
  broken responsive layout.
- Verification: import map, build/runtime, and route checks are recorded.

Exit criteria:

- Both reviewers pass, or all critical reviewer findings are fixed and reviewed
  again.
- Workplan and registry reflect the final state.

Rollback:

- Revert the last failing step, not the whole program.
- Restore `.attic/` moves only when a route or import-map check proves the file
  is still active.
- If schema or field changes generated unstable types, restore the prior config
  and re-run `pnpm generate:types`.
- If preview-path fixes break canonical or vanity public routes, revert the
  preview change and record the mismatch as a P0 blocker.

## Anti-Patterns To Avoid

- Replacing the custom editor with stock Payload to reduce complexity.
- Deleting code because `rg` found no import before checking generated import
  map, docs, and runtime behavior.
- Editing generated import map or generated Payload types manually.
- Treating a public reader bug as unrelated to admin authoring.
- Refactoring `ImageBlock` or `EditView` before there is route-level evidence.
- Allowing visual polish to normalize untracked internal Payload forks.
- Allowing architecture cleanup to postpone the writing experience indefinitely.

## Suggested First Sprint

Sprint goal: establish truth, fix blockers only, and leave the subsystem safer
than it started.

1. Create the surface registry.
2. Create deterministic Post, Surf, and Citations fixtures; record exact IDs,
   slugs, author slugs, citation IDs, reset steps, and cleanup steps.
3. Verify canonical, vanity, four-row Posts/Surf preview behavior, and
   Pages/Users/Profile preview control behavior.
4. Run the runtime authoring-to-reader checklist.
5. Fix only P0 blockers. Sprint 1 fixed the source-level Surf title-only
   rendering and preview helper path mismatch; remaining P0 work needs runtime
   fixture/browser evidence.
6. Regenerate import map only if admin component paths/import-map config changed;
   regenerate types only if collection, block, field config, or DB-tracked shape
   changed.
7. Update the registry with findings.
8. Decide which P1 lane starts next: internal import containment or editor UX.

Expected output:

- `readmes/ADMIN_EDITOR_SURFACE_REGISTRY.md`
- `readmes/audit-admin-editor-YYYY-MM-DD/`
- narrow P0 fixes if runtime blockers are found
- exact fixture IDs/slugs, fixture lifecycle notes, and route-status table
- updated `readmes/ADMIN_EDITOR_WORKPLAN.md` if the blueprint changes
