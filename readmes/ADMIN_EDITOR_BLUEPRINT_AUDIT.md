# Admin Editor Blueprint Audit

Date: 2026-06-24

Scope: Payload admin customization, the Posts/Surf edit view, custom Lexical
authoring, block authoring, block-to-reader rendering, and the longform reading
experience.

This is a discovery and evaluation pass only. No source code was changed.

## Method

- Used the requested skills as lenses:
  - `ecc:search-first`: repo-first inventory, then official Payload/Next docs.
  - `frontend-design`: judged the interface as an editorial authoring and
    reading system, not as a generic CMS admin.
  - `nextjs-turbopack`: checked generated import-map and bundling constraints.
  - `gan-style-harness`: separated the inferred blueprint from the evaluator
    pass that critiques it.
- Read the relevant local docs before drawing conclusions:
  - `readmes/HIGHLIGHTR.md`
  - `src/payload/Lexical/Features/AmbientAudio/feature.md`
  - `src/payload/Lexical/Features/AmbientAudio/feature.v1.md`
  - `src/payload/Lexical/Features/AmbientAudio/plan.md`
- Cross-checked with official docs:
  - Payload custom components and custom views.
  - Payload Lexical rich text and Blocks/InlineBlocks.
  - Next.js 16 Turbopack configuration and upgrade constraints.

## Executive Read

The current system is not trying to replace Payload. It is trying to keep
Payload's data model, auth, permissions, routes, import map, and admin
scaffolding, while replacing the parts that matter to an editorial writer:
the main edit surface, title/body authoring, block authoring, and the public
longform reading output.

The strongest inferred blueprint is:

1. Keep Payload as the operating system.
2. Turn Posts and Surf into a custom editorial writing room inside `/vault`.
3. Make title and body feel like one continuous Lexical document.
4. Treat blocks as editorial objects, not generic CMS rows.
5. Make authoring choices render into the public reading system with
   Highlightr, Ambient Audio, MiniMap, Dynamic Island, and custom prose styles.
6. Prefer Payload-supported extension points where possible, but accept some
   copied internals where Payload does not expose enough control.

That blueprint is directionally sound. The main risk is that the implementation
has grown by copying Payload defaults and hardcoding client feature schemas,
which increases drift risk on every Payload upgrade.

## Active System Map

### 1. Payload Admin Shell

Primary anchors:

- `src/payload.config.ts:40` configures root admin options.
- `src/payload.config.ts:44` registers admin providers and graphics.
- `src/payload.config.ts:52` replaces the dashboard view.
- `src/payload.config.ts:62` sets the import-map base directory.
- `src/payload.config.ts:65` enables live preview for posts, pages, and profile.
- `src/payload.config.ts:101` sets the root editor to `defaultLexical`.
- `src/payload.config.ts:549` mounts the admin at `/vault`.
- `src/app/(payload)/layout.tsx` imports Payload CSS, `custom.scss`, fonts, and
  the generated import map.
- `src/app/(payload)/vault/importMap.js` is generated and actively includes the
  custom editor field, Lexical features, Ambient Audio block component, and
  `EditView`.

Interpretation:

The admin shell is a branded Payload admin, not a separate app. The project
intentionally uses Payload's App Router structure and import-map mechanism,
while layering custom providers, fonts, CSS, dashboard, and collection views on
top.

### 2. Custom Edit View

Primary anchors:

- `src/payload/collections/Posts/index.ts:157` wires Posts edit to
  `@/payload/views/Edit/index.tsx#EditView`.
- `src/payload/collections/Surf/index.ts:86` wires Surf edit to the same custom
  edit view.
- `src/payload/views/Edit/index.tsx` wraps `DefaultEditView`.
- `src/payload/views/Edit/index.client.tsx` is a large copied/customized edit
  implementation.
- `src/payload/elements/DocumentFields/index.tsx` wraps fields in custom
  providers, including the writer provider.
- `src/payload/elements/DocumentControls/index.tsx` customizes the document
  control area.
- `src/payload/elements/AppHeader/index.tsx` and `src/payload/elements/Nav`
  customize surrounding admin chrome.

Interpretation:

The custom edit view is collection-scoped, not global. It is active for the two
editorial content collections where longform authoring matters most: Posts and
Surf. Pages use a layout-block model and do not appear to be the focus of this
writer experience.

### 3. Title and Body as One Writing Surface

Primary anchors:

- `src/payload/fields/Article/Title/index.tsx`
- `src/payload/fields/Article/Title/LexicalProvider/LexicalEditor.tsx`
- `src/payload/fields/Article/Content/index.tsx`
- `src/payload/fields/Article/Content/RichLexical.tsx`
- `src/payload/fields/Article/Content/content.tsx`
- `src/payload/fields/Article/Content/LexicalProvider/LexicalEditor.tsx`
- `src/payload/Lexical/Features/HandOff/contentHandOffPlugin.tsx`
- `src/payload/Lexical/Features/HandOff/handoffBridge.tsx`

Interpretation:

The title is not merely a text field. It has a Lexical editor and a focus
handoff bridge with the content editor. This indicates an intention to make
title-to-body movement feel like a composed writing surface, especially around
Backspace, Arrow navigation, focus, and slash-menu state.

This is a strong product idea for longform writing. It should be protected
during cleanup.

### 4. Content-Specific Lexical Feature Stack

Primary anchors:

- `src/payload/collections/Posts/richContent.ts`
- `src/payload/Lexical/defaultLexical.ts`
- `src/payload/fields/Article/Content/index.tsx`
- `src/payload/Lexical/defaults/*`
- `src/payload/Lexical/Features/*`

Active custom features:

- `HandOff`: title/body editor focus orchestration.
- `Mentions`: user mention nodes, API-backed search, component rendering.
- `RP_CtxMenu`: right-click/context menu and contributor registry.
- `AmbientAudio`: range anchors and track binding.
- `FormatImport`: paste/markdown formatting import.
- `LinkPreview`: link preview node/plugin.

Interpretation:

There are two layers:

- `defaultLexical.ts`: a broader default editor for the site.
- Posts/Surf `RichContent`: a stricter, content-specific editor that filters
  root/default features, then re-adds a curated set.

The implementation currently hardcodes a large `clientFeatures` and
`featureClientSchemaMap` in `src/payload/fields/Article/Content/index.tsx`.
That may be necessary to make custom inline blocks and feature schemas work,
but it is one of the largest upgrade-drift risks in this area.

### 5. Blocks as Editorial Objects

Primary anchors:

- `src/blocks/ImageBlock/config.ts`
- `src/blocks/ImageBlock/Comp/client/component/index.tsx`
- `src/blocks/ImageBlock/Comp/client/plugin/index.tsx`
- `src/blocks/Code/config.ts`
- `src/blocks/Content/config.ts`
- `src/payload/Lexical/Features/AmbientAudio/blocks/AmbientAudioAnchorBlock.ts`

Active block types in rich content include:

- Image block.
- Code block.
- Ambient Audio inline anchor block.

Pages use a separate layout block system, including Content, Archive, CTA,
FOTD, hero blocks, and related posts.

Interpretation:

Blocks are the main bridge between admin authoring and public output. The Image
block is a major product surface by itself: upload/search/crop/reframe/editor
node/rendered image. Its client component is over 2,000 lines, so it should be
treated as a subsystem, not a simple block.

### 6. Ambient Audio Architecture

Primary anchors:

- `src/payload/Lexical/Features/AmbientAudio/feature.md:9`
- `src/payload/Lexical/Features/AmbientAudio/feature.md:20`
- `src/payload/Lexical/Features/AmbientAudio/blocks/AmbientAudioAnchorBlock.ts`
- `src/payload/Lexical/Features/AmbientAudio/plugin/AmbientAudioPlugin.tsx`
- `src/components/UX/AmbientAudio/AnchorMarkers.tsx`
- `src/components/UX/AmbientAudio/AmbientAudioProvider.tsx`
- `src/components/UX/AmbientAudio/AmbientAudioRunner.tsx`
- `src/components/UX/AmbientAudio/AmbientAudioWidget.tsx`
- `.attic/src/payload/Lexical/Features/AmbientAudio/*`

Interpretation:

Ambient Audio has the clearest local documentation. The active direction is
v2: Payload InlineBlocks-backed anchors. The older custom DecoratorNode/server
architecture was moved into `.attic`, so it should not be treated as random
stale code. It is archived precedent.

This is a good example of the intended cleanup rule: remove active wiring only
after confirming the docs and public renderer no longer depend on it.

### 7. Public Rich Text Rendering

Primary anchors:

- `src/components/UX/RichText/index.tsx`
- `src/components/UX/RichText/serialize.tsx`
- `src/components/UX/AmbientAudio/AnchorMarkers.tsx`
- `src/blocks/RenderBlocks.tsx`
- `src/blocks/ImageBlock/Component.tsx`
- `src/blocks/Code/Component.client.tsx`
- `src/blocks/Content/Component.tsx`

Interpretation:

The canonical public renderer appears to be `src/components/UX/RichText/index.tsx`.
It uses Payload's React rich-text converter and custom converters for block and
inline-block types:

- `image` -> `PostedImage`
- `code` -> `CodeBlock`
- `cta` -> `CallToActionBlock`
- `ambientAudioAnchor` -> `AnchorMarkers`

`src/components/UX/RichText/serialize.tsx` appears unused in `src/`. It may be
a legacy manual serializer and should be reviewed as a cleanup candidate.

### 8. Longform Reader Shell

Primary anchors:

- `src/app/(frontend)/(site)/(content)/essays/[slug]/page.tsx`
- `src/components/UX/Highlightr/index.tsx`
- `src/components/UX/Highlightr/providers/*`
- `src/components/UX/Highlightr/MiniMap.tsx`
- `src/components/UX/Highlightr/HighlightMenu.tsx`
- `src/components/UX/Highlightr/responseMap.tsx`
- `src/styles/reading.scss`
- `readmes/HIGHLIGHTR.md`

Interpretation:

The public essay route hands the fetched post to `Narrateur`, which wraps the
article in `AmbientAudioProvider` and renders the reader shell. The reader shell
owns highlighting, float menus, response markers, MiniMap, progress/dynamic
island, and Ambient Audio controls.

The editor blueprint therefore cannot be evaluated only inside `/vault`.
Authoring must be validated against the public `Highlightr` reading contract.

## What Looks Intentional

- Custom admin at `/vault`, not `/admin`.
- Custom dashboard and branded admin shell.
- Collection-scoped custom edit view for Posts and Surf.
- Rich title plus rich content, connected by handoff behavior.
- Hide default Payload rich-text gutter and insert-paragraph-at-end behavior for
  the content field.
- A custom feature stack for editorial authoring.
- Ambient Audio's migration to Payload InlineBlocks.
- Public renderer with custom block converters.
- Highlightr as the canonical essay reader shell.
- `.attic` as the archive mechanism for retired experiments.

## What Looks Risky or Unclear

### Payload Internal Imports

Several files import from `node_modules/@payloadcms/.../dist/...` or copied
Payload internals. Examples include:

- `src/payload/views/index.tsx`
- `src/payload/views/Edit/index.client.tsx`
- `src/payload/views/Account/index.tsx`
- `src/payload/fields/Article/Content/rsc.tsx`
- `src/payload/Lexical/defaults/types.ts`

This is the largest maintenance risk. It may be necessary, but each internal
import should be catalogued with: why public API was insufficient, what Payload
version it was copied from, and how to verify it after upgrades.

### Hardcoded Content Feature Schema

`src/payload/fields/Article/Content/index.tsx` is 728 lines and manually wires
client feature providers and schema-map entries. This is active and important,
but fragile. It should have a short doctrine comment or doc explaining why it
exists and what Payload generation behavior it replaces.

### Duplicate or Legacy Rich Text Paths

Likely cleanup candidates:

- `src/components/UX/RichText/serialize.tsx`: exports `serializeLexical` but has
  no imports in `src/`.
- `src/payload/fields/Article/Title/inline.tsx`: exports an inline rich-text
  field but has no imports in `src/`.
- `src/payload/fields/Article/Content/rsc.tsx`: defines a server field wrapper
  but no imports were found in `src/`.

Do not delete directly. If removed, use `pnpm attic` per project policy.

### Large, Dense Subsystems

- `src/blocks/ImageBlock/Comp/client/component/index.tsx`: 2,063 lines.
- `src/payload/views/Edit/index.client.tsx`: 932 lines.
- `src/payload/Lexical/Features/AmbientAudio/plugin/AmbientAudioPlugin.tsx`:
  656 lines.

These should not be "cleaned up" casually. They need subsystem-specific
contracts and visual/regression checks.

### Styling Is Split Across Many Layers

Admin/editor styling is spread through:

- `src/app/(payload)/custom.scss`
- `src/payload/views/index.scss`
- `src/payload/Lexical/EditorTheme.scss`
- `src/payload/fields/Article/Content/LexicalProvider/LexicalEditor.scss`
- `src/payload/fields/Article/Title/LexicalProvider/LexicalEditor.scss`

Public reading styling is in:

- `src/styles/reading.scss`
- `src/components/UX/Highlightr/styles/*`
- block-specific SCSS files.

This is workable, but cleanup should first classify style files by surface:
admin shell, edit view, Lexical content editable, block editor, public reader,
and feature-specific overlays.

## Evaluator Pass

### Is this a good approximation of Sean's intentions?

Mostly yes.

The code points to an editorial, writer-first CMS, not a generic admin:

- Posts/Surf get custom edit views.
- Title/body handoff makes the document feel continuous.
- Blocks are custom authoring objects.
- Ambient Audio and Highlightr tie authoring to immersive reading.
- Typography and reading style are treated as product surfaces.

The strongest signal is that Ambient Audio has a documented architectural
migration and archived old implementation. That suggests the project has been
iterating toward a coherent model, not merely accumulating experiments.

### Does the plan make logical sense?

Yes, with one caveat.

The logical model is sound:

authoring editor -> serialized Lexical + block fields -> custom converters ->
reader shell -> interactive longform experience.

The caveat is maintainability. The deeper the project copies Payload internals,
the more it owns Payload's upgrade burden. The blueprint should explicitly
distinguish supported Payload extension points from local forks of Payload
internals.

### Does the visual/product direction make sense?

Yes.

The product direction is editorial, quiet, typographic, and writer-centered.
That matches the site's design system and the public reading experience. The
admin should not look like a generic SaaS dashboard. It should feel like an
editorial instrument.

The improvement opportunity is coherence: preserve the strong visual direction,
but reduce the number of overlapping implementation paths.

## Recommended Next Steps

1. Create a small "surface registry" table for this subsystem.
   Columns: file/path, active status, owner surface, public API or forked
   internal, verification route, cleanup decision.

2. Lock the active blueprint in docs before cleanup.
   This audit can become the seed, but the durable doc should include hard
   contracts for:
   - title/content handoff
   - custom Edit view
   - content feature schema map
   - block authoring and public rendering
   - Ambient Audio anchors
   - Highlightr reader compatibility

3. Run a visual/manual verification pass before deleting anything.
   Minimum routes:
   - `/vault/collections/posts/:id`
   - `/vault/collections/surf/:id`
   - public essay route with image, code, link, mention, and ambient anchors
   - public essay route with highlights and MiniMap enabled

4. Convert cleanup candidates through `.attic`.
   Start with files that have no imports and no route entry:
   - `src/components/UX/RichText/serialize.tsx`
   - `src/payload/fields/Article/Title/inline.tsx`
   - `src/payload/fields/Article/Content/rsc.tsx`

5. Put a version fence around Payload-internal forks.
   For every copied/internal Payload dependency, record:
   - current package version: Payload 3.85.1, `@payloadcms/next` 3.85.1,
     `@payloadcms/richtext-lexical` 3.85.1
   - why it is needed
   - how to test it after `pnpm update` or `pnpm generate`

6. Keep Turbopack/import-map regeneration in the workflow.
   Next 16 uses Turbopack by default, and this repo relies on generated Payload
   import-map wiring. Any source movement under custom admin components should
   be followed by import-map regeneration and a `/vault` route smoke test.

## Cleanup Priority

### Protect

- Posts/Surf custom edit view wiring.
- RichTitle/RichContent handoff.
- `src/payload/fields/Article/Content/index.tsx` until a safer replacement is
  proven.
- Ambient Audio v2 InlineBlocks implementation.
- `src/components/UX/RichText/index.tsx` custom converters.
- Highlightr reader shell.

### Audit Before Touching

- `src/payload/views/Edit/index.client.tsx`
- `src/payload/views/index.tsx`
- `src/payload/Lexical/defaults/*`
- `src/blocks/ImageBlock/Comp/*`
- `src/payload/Lexical/Features/RP_CtxMenu/*`
- `src/app/(payload)/custom.scss`

### Candidate Attic

- `src/components/UX/RichText/serialize.tsx`
- `src/payload/fields/Article/Title/inline.tsx`
- `src/payload/fields/Article/Content/rsc.tsx`

### Already Archived Precedent

- `.attic/src/payload/Lexical/Features/AmbientAudio/*`

## Verification Performed

- `git status --short`: clean.
- Import/file search for admin, Payload, Lexical, block, render, and reader
  surfaces.
- Package version check:
  - Next 16.2.9
  - Payload 3.85.1
  - `@payloadcms/next` 3.85.1
  - `@payloadcms/richtext-lexical` 3.85.1
- Official docs check for Payload custom components/views, Payload
  Lexical/Blocks, and Next 16 Turbopack.

Not performed:

- No code changes.
- No dev server or browser QA.
- No lint/type/build run.
- No deletion or attic move.
