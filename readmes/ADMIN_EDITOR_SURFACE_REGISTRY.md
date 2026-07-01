# Admin Editor Surface Registry

Date: 2026-06-25

Status: Sprint 1 registry seeded from source inspection, the blueprint audit,
and the first P0 fixes.

Scope: Payload admin customization, Posts/Surf custom edit view, Lexical title
and body authoring, block authoring, preview routing, and public reader output.

## Legend

| Status    | Meaning                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| active    | Imported or configured in the current app path.                                                                        |
| protected | Active and easy to misclassify as stale. Do not move or attic without runtime evidence.                                |
| control   | Not the primary editor surface, but must keep working while editor helpers change.                                     |
| candidate | Possible cleanup target. Re-check generated import map, dynamic imports, and route behavior before using `pnpm attic`. |
| archived  | Already under `.attic/`; keep for precedent, not production import.                                                    |

## Registry

| Path                                                                   | Surface                          | Status    | Owner Behavior                                                                                                 | API/Fork                                      | Risk   | Verification Route                                            | Cleanup Decision                                                                 |
| ---------------------------------------------------------------------- | -------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/payload.config.ts`                                                | Payload admin shell              | active    | Mounts `/vault`, admin providers, dashboard, root editor, live preview collections, import-map base directory. | Payload public config                         | high   | `/vault`                                                      | Keep.                                                                            |
| `src/app/(payload)/layout.tsx`                                         | Payload App Router shell         | active    | Loads Payload CSS, local admin SCSS, fonts, import map.                                                        | Payload/Next public shell                     | high   | `/vault`                                                      | Keep.                                                                            |
| `src/app/(payload)/vault/importMap.js`                                 | Generated Payload admin imports  | protected | Runtime registration proof for custom fields, views, and Lexical features.                                     | generated file                                | high   | import-map grep for editor registrations                      | Do not edit manually. Regenerate only after admin component path/config changes. |
| `src/payload/views/Edit/index.tsx`                                     | Custom edit view server wrapper  | active    | Wraps Payload default edit view with project client implementation.                                            | Payload custom view                           | high   | `/vault/collections/posts/:id`, `/vault/collections/surf/:id` | Keep.                                                                            |
| `src/payload/views/Edit/index.client.tsx`                              | Custom edit view client          | protected | Main Posts/Surf writing-room implementation, save lifecycle, controls, autosave state.                         | Payload internal fork/copy risk               | high   | Post/Surf edit save/reload/preview                            | Keep, document internals before refactor.                                        |
| `src/payload/elements/DocumentFields/index.tsx`                        | Edit view field shell            | active    | Wraps rendered fields with document/editor providers.                                                          | local Payload extension                       | high   | Post/Surf edit load                                           | Keep.                                                                            |
| `src/payload/elements/DocumentControls/index.tsx`                      | Edit view controls               | active    | Custom document control area for the editor surface.                                                           | local Payload extension                       | medium | Post/Surf save/publish controls                               | Keep.                                                                            |
| `src/payload/collections/Posts/index.ts`                               | Posts collection                 | active    | Wires custom EditView, rich title/body, preview, drafts, publish hooks.                                        | Payload public collection config              | high   | `/vault/collections/posts/:id`, `/essays/:slug`               | Keep.                                                                            |
| `src/payload/collections/Surf/index.ts`                                | Surf collection                  | active    | Wires custom EditView, shared rich title/body, author-aware preview.                                           | Payload public collection config              | high   | `/vault/collections/surf/:id`, `/surf/:slug`                  | Keep.                                                                            |
| `src/payload/collections/Pages/index.ts`                               | Pages preview control            | control   | Uses `generatePreviewPath()` for live preview and preview.                                                     | Payload public collection config              | medium | page preview to `/:slug`                                      | Keep as regression control.                                                      |
| `src/payload/collections/Users/index.ts`                               | Users preview control            | control   | Uses `generatePreviewPath()` for profile/user preview.                                                         | Payload public collection config              | medium | user preview to `/users/:slug`                                | Keep as regression control.                                                      |
| `src/payload/collections/Profile/index.ts`                             | Profile preview control          | control   | Uses author-aware live preview and direct preview.                                                             | Payload public collection config              | medium | `/users/:user/profile`                                        | Keep; direct preview assumes `profile.slug` maps to user slug.                   |
| `src/utilities/generatePreviewPath.ts`                                 | Preview routing helper           | active    | Builds `/next/preview` query URLs for Pages, Posts, Surf, Users, Profile.                                      | local helper                                  | high   | unit test plus `/next/preview?...`                            | Keep. P0 path mismatch fixed in Sprint 1.                                        |
| `src/app/(frontend)/(site)/(pages)/next/preview/route.ts`              | Draft preview gate               | active    | Validates preview secret and auth, enables draft mode, redirects to relative path.                             | Next draft mode + Payload auth                | high   | `/next/preview?...`                                           | Keep.                                                                            |
| `next.config.ts`                                                       | Public vanity rewrites           | active    | Rewrites `/@:user/essays/:slug` and `/@:user/surf/:slug` to canonical routes.                                  | Next public config                            | medium | vanity routes                                                 | Keep.                                                                            |
| `src/payload/fields/Article/Title/index.tsx`                           | Rich title admin field           | active    | Lexical title editor, handoff entry point, custom field registration.                                          | Payload custom field                          | high   | Post/Surf title focus and save                                | Keep.                                                                            |
| `src/payload/fields/Article/Title/inline.tsx`                          | Rich title inline support        | protected | Active lazy import support for title field experiments.                                                        | local dynamic import                          | medium | dynamic import search                                         | Do not attic until title wiring is replaced and runtime-tested.                  |
| `src/payload/fields/Article/Title/LexicalProvider/LexicalEditor.tsx`   | Title Lexical editor             | active    | Title editor behavior and focus bridge integration.                                                            | local Lexical wrapper                         | high   | title editing, Backspace/arrow handoff                        | Keep.                                                                            |
| `src/payload/fields/Article/Content/index.tsx`                         | Rich content admin field         | protected | Client feature schema map, custom rich-text field, block/editor provider wiring.                               | Payload public APIs plus local schema mapping | high   | content save/reload, block insertion                          | Keep; do not split before tests.                                                 |
| `src/payload/fields/Article/Content/RichLexical.tsx`                   | Content Lexical wrapper          | active    | Rich content editor rendering path.                                                                            | local Lexical wrapper                         | high   | content editor load                                           | Keep.                                                                            |
| `src/payload/fields/Article/Content/content.tsx`                       | Content field composition        | active    | Field layout for the body editor.                                                                              | local component                               | medium | content editor load                                           | Keep.                                                                            |
| `src/payload/fields/Article/Content/LexicalProvider/LexicalEditor.tsx` | Body Lexical editor              | active    | Body editor behavior, theme, focus, and plugin host.                                                           | local Lexical wrapper                         | high   | title/body handoff, block insert                              | Keep.                                                                            |
| `src/payload/fields/Article/Content/rsc.tsx`                           | Legacy/server field wrapper      | candidate | No active source import found in audit.                                                                        | likely old fork                               | medium | generated import map and `rtk rg "Article/Content/rsc" src`   | Candidate only; use `pnpm attic` after runtime proof.                            |
| `src/payload/collections/Posts/richTitle.ts`                           | Rich title collection config     | active    | Registers title rich-text field for Posts and Surf.                                                            | Payload rich text config                      | high   | Posts/Surf schema and admin field load                        | Keep.                                                                            |
| `src/payload/collections/Posts/richContent.ts`                         | Rich body collection config      | active    | Registers body features: Code, Image, Ambient Audio inline anchors.                                            | Payload rich text config                      | high   | body save/reload/public render                                | Keep.                                                                            |
| `src/payload/Lexical/Features/HandOff/*`                               | Title/body handoff               | active    | Makes title and body behave like one writing surface.                                                          | local Lexical feature                         | high   | keyboard handoff tests/manual route                           | Keep.                                                                            |
| `src/payload/Lexical/Features/AmbientAudio/*`                          | Ambient Audio authoring          | protected | InlineBlock anchor authoring, track binding, select mode, server cleanup.                                      | local feature, documented v2                  | high   | insert anchor, save, public marker detection                  | Keep; archived v1 remains precedent.                                             |
| `src/payload/Lexical/Features/Mentions/*`                              | Mentions authoring               | active    | User mention node/plugin/search and rendered mention objects.                                                  | local Lexical feature                         | medium | mention insert/save/public render                             | Keep.                                                                            |
| `src/payload/Lexical/Features/RP_CtxMenu/*`                            | Context menu                     | active    | Rich editor context menu and contributor registry.                                                             | local Lexical feature                         | medium | right-click/slash menu paths                                  | Keep.                                                                            |
| `src/payload/Lexical/Features/FormatImport/*`                          | Format import                    | active    | Paste/markdown formatting import behavior.                                                                     | local Lexical feature                         | medium | paste rich/markdown content                                   | Keep.                                                                            |
| `src/payload/Lexical/Features/LinkPreview/*`                           | Link preview authoring           | active    | Link preview node/plugin behavior.                                                                             | local Lexical feature                         | medium | link insert/save/public render                                | Keep.                                                                            |
| `src/blocks/ImageBlock/*`                                              | Image block                      | protected | Image authoring, upload/search/crop/reframe, public posted image rendering.                                    | Payload block plus large local client         | high   | insert image, save, public `/essays/:slug` and `/surf/:slug`  | Keep; treat as subsystem.                                                        |
| `src/blocks/Code/*`                                                    | Code block                       | active    | Code block config and public rendering.                                                                        | Payload block plus local renderer             | medium | insert code, save, public render                              | Keep.                                                                            |
| `src/components/UX/RichText/index.tsx`                                 | Public rich-text renderer        | active    | Converts Lexical blocks and inline blocks to public reading components.                                        | Payload converter public API                  | high   | `/essays/:slug`, `/surf/:slug`                                | Keep.                                                                            |
| `src/components/UX/RichText/serialize.tsx`                             | Legacy serializer                | candidate | Manual serializer appears unused in active source.                                                             | old local renderer                            | medium | serializer import search                                      | Candidate only; use `pnpm attic` after runtime proof.                            |
| `src/components/UX/Highlightr/*`                                       | Longform reader                  | protected | Narrateur, MiniMap, highlights, response map, dynamic reader affordances.                                      | local reader subsystem                        | high   | `/essays/:slug` with citations                                | Keep.                                                                            |
| `src/components/UX/AmbientAudio/*`                                     | Public Ambient Audio reader      | active    | Detects anchor markers and runs ambient audio UI/playback.                                                     | local reader subsystem                        | high   | public route with ambient anchors                             | Keep.                                                                            |
| `src/app/(frontend)/(site)/(content)/essays/[slug]/page.tsx`           | Public essay route               | active    | Fetches post, renders Narrateur and reader shell.                                                              | Next App Router                               | high   | `/essays/:slug`                                               | Keep.                                                                            |
| `src/app/(frontend)/(site)/(content)/surf/[slug]/page.tsx`             | Public Surf route                | active    | Fetches Surf entry and renders authored title/body.                                                            | Next App Router                               | high   | `/surf/:slug`                                                 | Keep. P0 title-only gap fixed in Sprint 1.                                       |
| `src/components/content/surf/surf.tsx`                                 | Surf card/detail renderer pieces | active    | Provides `SurfContent` and list/card Surf rendering utilities.                                                 | local client component                        | medium | `/surf/:slug`, Surf lists                                     | Keep.                                                                            |
| `.attic/src/payload/Lexical/Features/AmbientAudio/*`                   | Ambient Audio v1 archive         | archived  | Retired custom node/server implementation kept as precedent.                                                   | archive                                       | low    | none                                                          | Do not import; do not delete casually.                                           |

Useful registry search commands:

```bash
rtk rg -n "EditView|Article/Title|Article/Content|AmbientAudio" src/app/\(payload\)/vault/importMap.js
rtk rg -n "Article/Title/inline|import\\(.*inline" src
rtk rg -n "serializeLexical|RichText/serialize" src
```

## Preview Matrix

These are expected generated `path` query values after the Sprint 1 preview
helper fix. The final redirected pathname still needs browser/dev-server proof
with authenticated `/vault` cookies and `PREVIEW_SECRET`.

| Surface                         | Generator                         | URL Shape From Collection           | Expected `path` Query          | Route Exists                         | Evidence                                      |
| ------------------------------- | --------------------------------- | ----------------------------------- | ------------------------------ | ------------------------------------ | --------------------------------------------- |
| Posts live preview              | `generatePreviewPathWithAuthor()` | relative                            | `/@{author}/essays/{slug}`     | yes, rewrite to `/essays/{slug}`     | unit covered helper path                      |
| Posts `admin.preview`           | `generatePreviewPath()`           | relative                            | `/essays/{slug}`               | yes                                  | unit covered helper path                      |
| Surf live preview               | `generatePreviewPathWithAuthor()` | absolute after `getServerSideURL()` | `/@{author}/surf/{slug}`       | yes, rewrite to `/surf/{slug}`       | unit covered helper path                      |
| Surf `admin.preview`            | `generatePreviewPathWithAuthor()` | absolute after `getServerSideURL()` | `/@{author}/surf/{slug}`       | yes, rewrite to `/surf/{slug}`       | unit covered helper path                      |
| Pages live/preview control      | `generatePreviewPath()`           | absolute after `getServerSideURL()` | `/{slug}`                      | yes for page slugs                   | unit covered helper path                      |
| Users live/preview control      | `generatePreviewPath()`           | absolute after `getServerSideURL()` | `/users/{slug}`                | yes                                  | unit covered helper path                      |
| Profile live preview control    | `generatePreviewPathWithAuthor()` | relative                            | `/users/{author}/profile`      | yes                                  | unit covered helper path                      |
| Profile `admin.preview` control | `generatePreviewPath()`           | relative                            | `/users/{profileSlug}/profile` | yes if profile slug equals user slug | unit covered helper path, needs fixture proof |

## Fixture Lifecycle

The runtime browser harness should create deterministic records instead of
borrowing unknown local content.

### Post Fixture

Record:

- fixture key: `admin-editor-post-fixture`
- document ID
- slug
- author ID and author slug
- expected canonical route: `/essays/{slug}`
- expected vanity route: `/@{authorSlug}/essays/{slug}`

Required content:

- rich title
- paragraph
- heading
- external link
- internal relationship link
- mention
- code block
- image block
- Ambient Audio anchor

Lifecycle:

1. Create or reset fixture to the known body.
2. Save draft.
3. Reload edit view.
4. Publish or update.
5. Verify canonical, vanity, preview, and public render.
6. Delete or reset fixture.

### Surf Fixture

Record:

- fixture key: `admin-editor-surf-fixture`
- document ID
- slug
- author ID and author slug
- expected canonical route: `/surf/{slug}`
- expected vanity route: `/@{authorSlug}/surf/{slug}`

Required content mirrors the Post fixture where Surf supports the object.

Lifecycle:

1. Create or reset fixture to the known title/body.
2. Save draft.
3. Reload edit view.
4. Publish or update.
5. Verify canonical, vanity, preview, and public render.
6. Delete or reset fixture.

### Citations Fixture

Record:

- Post target collection/document ID/slug
- Surf target collection/document ID/slug
- citation IDs
- author/user ID
- expected notes endpoints:
  - `/api/citations/getNotes?collection=posts&id={docId}`
  - `/api/citations/getNotes?collection=surf&id={docId}`

Lifecycle:

1. Create one Post target and one Surf target.
2. Create citations through `/api/citations` or the smallest fixture script.
3. Verify note fetch for both collections.
4. Reload public routes and confirm highlights rehydrate where the reader
   supports them.
5. Delete created citations through the documented delete flow or cleanup
   script.

## Sprint 1 Evidence

Implemented and tested on 2026-06-25:

- `src/utilities/generatePreviewPath.test.ts`
  - verifies direct preview paths for Pages, Posts, Surf, Users, and Profile
  - verifies author-aware paths for Posts, Surf, and Profile
  - verifies missing author ID failure
- `src/app/(frontend)/(site)/(content)/surf/[slug]/page.test.tsx`
  - verifies the Surf route passes fetched Lexical content into `SurfContent`
  - verifies not-found behavior for missing Surf slugs
- `src/utilities/generatePreviewPath.ts`
  - fixed malformed `path=undefined/{slug}` output for Posts, Surf, Users, and
    Profile
  - fixed author-aware Posts/Surf paths to use existing `@user` vanity rewrites
  - fixed author-aware Profile path to target `/users/{author}/profile`
- `src/app/(frontend)/(site)/(content)/surf/[slug]/page.tsx`
  - fixed title-only public rendering by rendering `SurfContent` with fetched
    Lexical body content

Focused verification command:

```bash
rtk pnpm exec vitest run src/utilities/generatePreviewPath.test.ts 'src/app/(frontend)/(site)/(content)/surf/[slug]/page.test.tsx'
```

Result: 2 files passed, 11 tests passed.

Generated-file commands were not run because no admin component paths, import
map config, collection schema, block schema, field schema, or DB-tracked shape
changed.

## Open Verification

- Browser QA has not yet been run. It requires a running dev server, migrated
  database, authenticated `/vault` session, `PREVIEW_SECRET`, and deterministic
  fixture IDs/slugs.
- Preview helper unit tests cover generated query paths, not the full
  authenticated redirect through `/next/preview`.
- Profile direct preview still needs fixture proof that `profile.slug` maps to
  the public user slug. If it does not, Profile `admin.preview` should use the
  author-aware helper or a profile-specific lookup.
- Highlightr/Citations Surf support is documented as a required verification
  lane, but the browser interaction was not exercised in this Sprint 1 patch.
