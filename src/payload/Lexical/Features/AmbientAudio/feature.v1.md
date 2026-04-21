# Ambient Audio — Developer Reference

Scored passages inside an essay. An editor marks a range of text with a
chosen track; on the public frontend, the reader arms an unobtrusive
Dynamic Island widget, and as they scroll through the range the track
fades in, follows their scroll position as a virtual seek, and fades out
on exit. HideawayFM is snapshotted on take-over and restored on release.

---

## Current status (2026-04-20, post select-mode overhaul)

**Select-mode overhaul: ✅ landed.** See "Select-mode state machine" below.
**Frontend runtime: ✅ working end-to-end.**
- Widget lives inside `Highlightr/DynamicIsland.tsx` as a sibling of the
  bookmark button. Visible at end-of-article (where DynamicBreadcrumb shows).
- Armed widget + scroll into range → grace delay → fade in.
- Scroll-direction-coupled playback (down/idle plays, up pauses + tracks seek).
- FM snapshot/restore works (won't resurface a random FM track on exit).
- Loops by default; seek is driven by scroll progress within the range.

**Editor: ✅ working but fragile.**
- Right-click → "Add ambient audio…" → arm select mode → ⌘↓ start / ⌘↑ end.
- cmdk picker hits `/api/tracks` and writes a snapshot of the track into
  each anchor node.
- **Known fragility:** the track is snapshotted (title/artist/url) into
  the anchor JSON. If the Track is re-uploaded (Payload renames with
  `-1` / `-2` suffixes on collision), the anchor still points at the
  original filename and plays nothing. See "Phase B — Payload refactor"
  below for the proper fix.

**Phase A playback work: ✅ complete.**
**Phase B Payload refactor: ⏳ not started.**

---

## Architecture

### Files

```
src/payload/Lexical/Features/AmbientAudio/
├── index.ts                       Server feature (Payload). Exports
│                                  AmbientAudioFeature().
├── feature.client.tsx             Client feature — wires nodes, plugin,
│                                  and store provider into the Lexical
│                                  editor.
├── nodes/
│   ├── types.ts                   AnchorKind, AmbientTrackRef, serialized
│   │                              shapes. AMBIENT_START_TYPE /
│   │                              AMBIENT_END_TYPE constants.
│   ├── AmbientAudioStartNode.tsx  DecoratorNode. Stores groupId + track.
│   │                              getType() = "ambientAudioStart".
│   └── AmbientAudioEndNode.tsx    Mirror of Start with
│                                  getType() = "ambientAudioEnd".
├── components/
│   └── AnchorComponent.tsx        Editor-only decoration (half-disk +
│                                  title). Registers click → openPicker
│                                  and Backspace/Delete → $removeGroup.
├── plugin/
│   ├── AmbientAudioPlugin.tsx     Orchestrator. Hosts ContextMenu,
│   │                              SelectModeOverlay, TrackPicker. Registers
│   │                              Cmd+Arrow / Esc commands while selecting.
│   ├── ContextMenu.tsx            Right-click menu on editor root.
│   ├── SelectModeOverlay.tsx      Caret-adjacent status pill. Portals to
│   │                              body, anchors above focused block during
│   │                              placingStart/placingEnd only.
│   └── TrackPicker.tsx            floating-ui + cmdk track search. Uses
│                                  searchTracks() from utils/tracks.ts.
│                                  Calls editor.update(() => $insertAnchor).
├── store/
│   └── ambientStore.tsx           Zustand-in-context. Holds select-mode,
│                                  pending anchor kind, picker anchor el,
│                                  context-menu state.
├── utils/
│   ├── anchors.ts                 $insertAnchor, $insertAnchorPair,
│   │                              $findAnchorPair, $listGroups,
│   │                              $removeGroup, $removeGroupByKey,
│   │                              $updateGroupTrack. Uses nanoid for
│   │                              groupId ("g_...").
│   └── tracks.ts                  searchTracks(query) and getTrackById(id).
│                                  REST against /api/tracks. toRef() maps
│                                  track doc → AmbientTrackRef, builds the
│                                  public URL as /track_media/<filename>
│                                  (see "Playback URL" below).
├── feature.md                     This file.
└── plan.md                        Original sketch. Superseded by this doc
                                   and the archived PRP plan.

src/components/UX/AmbientAudio/
├── AnchorMarkers.tsx              Frontend-only. Rendered by the RichText
│                                  JSX converter for ambientAudioStart/End
│                                  types. Emits an invisible but
│                                  layout-participating span with
│                                  data-ambient-anchor / data-ambient-group /
│                                  data-ambient-track-id / data-ambient-track
│                                  (JSON of track snapshot).
├── AmbientAudioProvider.tsx       Scroll-coupled state machine. Scans DOM
│                                  for anchors via MutationObserver, drives
│                                  per-group Howl instances, snapshots +
│                                  restores HideawayFM on take-over.
│                                  Exposes useAmbientAudio() context.
├── AmbientAudioWidget.tsx         Compact pill button for the DynamicIsland.
│                                  Reads context, renders morphing label.
└── AmbientAudioRunner.tsx         ORPHANED. Early standalone version
                                   replaced by Provider+Widget. Safe to
                                   delete.
```

### Wiring

- `src/payload/collections/Posts/richContent.ts`
  registers `AmbientAudioFeature()` and adds `ambientAudioFeature` to
  `customizedFeatureKeys`.
- `src/payload/fields/Article/Content/index.tsx`
  registers `AmbientAudioClientFeature` under `clientFeatures.ambientAudioFeature`.
- `src/payload/fields/RichText/index.tsx`
  has `ambientAudioStart` / `ambientAudioEnd` entries in `jsxConverters`.
  These render `<AnchorMarkers />` for each node type.
- `src/components/UX/Highlightr/index.tsx`
  wraps `<Article>` inside `Narrateur` with `<AmbientAudioProvider>` and
  adds `<AmbientAudioWidget />` as a child of `<DynamicBreadcrumb>`.

---

## Runtime behavior

### Data model (saved in Lexical JSON)

```ts
{ type: "ambientAudioStart", version: 1, groupId: "g_aB3xQ7",
  track: { trackId, title?, artist?, url?, duration?, cover? } }
{ type: "ambientAudioEnd",   version: 1, groupId: "g_aB3xQ7",
  track: { ... same snapshot ... } }
```

Start and end share `groupId`. Track snapshot is duplicated on both nodes
(redundant but fast).

### Playback URL

`utils/tracks.ts` `toRef()` builds:
```
url: `/track_media/${encodeURIComponent(doc.filename)}`
```
The Tracks collection uploads to `/public/track_media/`. Next.js serves
this as a static path. No auth, no custom endpoint.

If `doc.filename` is missing (unlikely), falls back to `doc.url` as
returned by Payload.

### Lazy re-hydration

On page load the `AmbientAudioProvider` scans the rendered DOM. If a group
has no `track.url` (old anchor saved before this field was captured), the
provider calls `getTrackById(trackId)` and patches the group in state,
**preserving the existing Howl instance** so we don't orphan audio
elements and exhaust Howler's html5 pool.

### State machine (scroll-coupled)

```
                    ┌──────────┐  arm button flip  ┌──────────┐
                    │ unarmed  │ ───────────────▶  │  armed   │
                    └──────────┘ ◀─────────────── └──────────┘
                                                       │
                                          scroll into range
                                                       ▼
                                            ┌───────────────────┐
                                            │   armed · grace   │  ARM_GRACE_MS = 1000ms
                                            └───────────────────┘
                                                       │
                                                       ▼
                             ┌──────────────── armed + in-range ───────────────┐
                             │                                                  │
                       scroll DOWN / idle                                scroll UP
                             │                                                  │
                             ▼                                                  ▼
                     ┌───────────────┐                              ┌────────────────┐
                     │ Howl PLAYING  │    ◀────── scroll idle / down
                     │  seek ~ scroll│                              │ Howl PAUSED    │
                     └───────────────┘                              │ seek tracks    │
                             │                                      └────────────────┘
                             │ scroll exits range
                             ▼
                     ┌───────────────┐
                     │ RELEASE FM    │   ← restore snapshot: seek + play if it was playing
                     └───────────────┘
```

Key constants (in `AmbientAudioProvider.tsx`):
- `FADE_IN_MS = 2200`
- `FADE_OUT_MS = 1200`
- `ARM_GRACE_MS = 1000`
- `SCROLL_IDLE_MS = 400`
- `HEAD_ROOM = 0.72` (target ambient volume)
- `DEFAULT_TRACK_SECONDS = 60` (fallback if duration missing)

### FM snapshot / release

On first take-over we capture `{ wasPlaying, seekSec }` from
`useHideawayFM`. On release we `fmControls.seek(snap.seekSec)` and
`fmControls.play()` only if `wasPlaying` was true. Otherwise we leave FM
paused. This fixes the "phantom FM track on exit" bug.

### Autoplay unlock

The widget's `toggle()` call is a user gesture. Inside it we:
1. Resume `Howler.ctx` if suspended.
2. Play a 0.05s silent data-URL WAV via `new Audio()` — flips browser's
   "user has interacted with audio" flag for the session.
3. `play()` every loaded Howl at volume 0, then `pause()` each 20ms later
   (warms them up, unlocks their underlying `<audio>` elements).

### Fade robustness

`Howl.fade(from, to, ms)` doesn't always run if called before the audio
has actually begun playing. `fadeIn()` registers `h.once("play", runFade)`
and backs it up with a 600ms timeout that just sets `volume(HEAD_ROOM)`
directly if the fade never kicked in.

---

## Phase B — Payload refactor (not done)

### The problem

The anchor stores a snapshot of the track ref (`{ trackId, title, artist,
url, duration, cover }`). If the Track doc is updated (file re-uploaded,
renamed, etc.) the snapshot in the anchor gets stale.

We saw this in testing: the Track had been uploaded twice, so Payload
renamed the new upload to `MOTION FREESTYLE-1.mp3`, but the anchor still
pointed at `MOTION FREESTYLE.mp3` (the original, now missing).

The current lazy-fetch patch (`AmbientAudioProvider` re-fetches by ID on
load) works but is fragile — if the DB's `filename` itself is stale for
any reason, we still play the wrong file or 404.

### The fix

Replace the two DecoratorNode anchors with Lexical **inline Blocks**
(`InlineBlocksFeature`) that carry a proper **upload relationship** to
the Tracks collection. Payload auto-populates related documents on fetch,
so the frontend always receives the current track shape — no snapshot
drift possible.

### Shape proposal

Option A — two blocks sharing `regionId`:
```ts
{
  slug: "ambient-audio-start",
  fields: [
    { name: "regionId", type: "text", required: true },
    { name: "track", type: "upload", relationTo: "tracks", required: true,
      maxDepth: 1 },
    { name: "startSeek", type: "number", defaultValue: 0 },
  ],
}
{
  slug: "ambient-audio-end",
  fields: [
    { name: "regionId", type: "text", required: true },
    { name: "endSeek", type: "number" }, // defaults to track.duration at render
  ],
}
```

Pros: mirrors existing two-anchor mental model; block-level serializer
stays simple.
Cons: two nodes to keep in sync; orphaned `end` must be tolerated.

Option B — single block with range metadata:
```ts
{
  slug: "ambient-audio",
  fields: [
    { name: "track", type: "upload", relationTo: "tracks", required: true,
      maxDepth: 1 },
    { name: "startSeek", type: "number", defaultValue: 0 },
    { name: "endSeek", type: "number" },
    { name: "anchorMode", type: "select",
      options: ["range", "inline-marker"], defaultValue: "range" },
  ],
}
```
Needs a different mechanism for marking the end of the range (e.g.,
walking siblings until next ambient block, or a region-end marker).

**Recommendation:** Option A. It preserves the current structural model
and drops in cleanly.

### Tracks collection hooks

Add to `src/payload/collections/Radio/Tracks.ts`:

1. `afterDelete` hook: when a Track is deleted, find every Post whose
   `content` JSON references this track's id (scan for
   `ambient-audio-start` / `ambient-audio-end` blocks with a matching
   upload id) and remove the region (or flag the Post for review).

2. `afterChange` hook: invalidate any ISR/CDN caches for posts
   referencing the changed track, so a re-upload propagates.

Payload 3 exposes `populate` / `depth` — with `maxDepth: 1` on the upload
field, the track doc will be hydrated into the Lexical JSON automatically
on fetch. The frontend converter then reads `node.fields.track.url` /
`.filename` directly — no lazy-fetch needed.

### Migration

Existing anchors (two decorator nodes with snapshot) need to be migrated:

1. Walk every Post's `content` JSON.
2. For each `ambientAudioStart` / `ambientAudioEnd` pair (matched by
   `groupId`), translate to the new block type, copying `groupId` →
   `regionId` and `track.trackId` → `track` relationship id.
3. Drop the old `track` snapshot fields.

Write as a Payload migration in `src/lib/migrations/`.

### Editor-side changes

- Delete `nodes/AmbientAudioStartNode.tsx` and `AmbientAudioEndNode.tsx`.
- Register ambient audio blocks via
  `BlocksFeature({ blocks: [AmbientAudioStart, AmbientAudioEnd] })` or
  `InlineBlocksFeature({...})` if available.
- The Select-Mode plugin still exists; `$insertAnchor` inserts a
  blocks-feature node instead of a DecoratorNode.
- TrackPicker still returns a track; instead of writing a snapshot, we
  write `{ regionId, track: trackId }`.
- `AnchorComponent.tsx` becomes the block's `components.Block` in the
  field config — same half-disk glyph + title rendering.

### Frontend-side changes

- `AnchorMarkers.tsx` is replaced by a Block component in
  `RichText/index.tsx` `jsxConverters.blocks["ambient-audio-start"]`. It
  reads `node.fields.track` (populated) to emit the marker span.
- `AmbientAudioProvider.tsx` needs only a small tweak: `readAnchors()`
  can drop the JSON.parse of the full track snapshot and instead read
  only `trackId`, then fetch fresh via `getTrackById` on mount. Or the
  block can serialize the fresh track shape into the data attribute at
  render time — simpler, matches current pattern.

### Order of operations

1. Add new block configs + serializer converters.
2. Ship a dual-read frontend (handle both old decorator nodes and new
   blocks) so the site doesn't break during rollout.
3. Write the migration; run against staging; verify.
4. Remove the old DecoratorNode code paths.

---

## Known issues / loose ends

- `AmbientAudioRunner.tsx` is orphaned (replaced by Provider + Widget).
  Safe to delete in a cleanup pass.
- `serialize.tsx` has a legacy `if (typedNode.type === "ambientAudioStart"...)`
  branch that's unreachable because the live path is `jsxConverters` in
  `RichText/index.tsx`. Safe to clean up later.
- `StreamHandler` at `src/payload/collections/Radio/endpoints/stream.ts`
  has a pre-existing bug — it does `realpath(track.url)` where `track.url`
  is a URL path, not a filesystem path, so it 404s for newly-uploaded
  tracks. Unrelated to this feature; we bypassed by using `/track_media/`
  static URLs instead. Worth fixing separately.
- Widget visibility is tied to `shownDynamicIsland && isAtEnd` (the
  Highlightr breadcrumb appears near the end of articles). If the user
  wants the widget visible earlier, relax that condition in
  `Highlightr/index.tsx` around line 1036.

---

## Removing the feature cleanly

Delete the `AmbientAudioFeature()` call in `Posts/richContent.ts` and the
`ambientAudioFeature` entry in `fields/Article/Content/index.tsx`.
Existing documents keep the anchor nodes in their JSON; they simply stop
rendering. The widget and provider in Highlightr can also be removed.

---

## Select-mode state machine

The editor's select-mode behaves like a calendar date-range picker: every
interaction either advances the phase, adjusts a boundary, or gracefully
finalizes the region. Invalid states (overlap, orphan anchor) are
unreachable by construction.

### Phases

```
IDLE
  │ right-click → "Add ambient audio"
  ▼
PLACING_START ── commit → PLACING_END ── commit → PICKING_TRACK
  │ exit (any trigger)          │                    │ track chosen
  ▼                              ▼                    ▼
IDLE (finalized)         IDLE (finalized)         SETTLED
                                                       │
                                                       │ exit trigger
                                                       ▼
                                                     IDLE
```

### Exit-to-finalize (never destructive)

Every exit path calls `$finalizePlacement` with this resolution:

| State at exit | Result |
|---|---|
| 0 anchors   | **No-op.** Plugin skips `$finalizePlacement` — user cancelled before committing anything. Prevents a ghost region from spawning at viewport center (which could encase an existing settled region and violate "no overlapping areas"). |
| 1 anchor    | Missing one placed at end-of-block of the existing anchor. |
| 2 anchors   | Left as-is. |
| No track    | `PLACEHOLDER_TRACK` (track.trackId === ""). |

Placeholder regions render editor-only; the frontend JSX converter and
the runtime provider both skip them.

### Exit triggers

| Trigger | Detected via |
|---|---|
| Esc | `KEY_DOWN_COMMAND` |
| Enter while settled/picking | `KEY_DOWN_COMMAND` |
| Typed key during select-mode | `KEY_DOWN_COMMAND` at CRITICAL priority — finalize synchronously, return `false`, keystroke flows through |
| Outside-click | Document-level `pointerdown` capture |
| Page hide / route change | `window.addEventListener("pagehide", ...)` |
| Re-invoke "Add ambient audio" | ContextMenu action calls finalize before re-arming |

### Commit paths (while in placing phases)

| Input | Behavior |
|---|---|
| ⌘⏎ or Enter | `commitFocused()` |
| Option/Alt + Arrow | Debounced commit (180ms) |
| Click CommitChip ("Set as start/end") | Primary mobile path |

### CaretNavigator

Listens to `SELECTION_CHANGE_COMMAND`, computes the block-level ancestor
of the caret as the "focused node", writes it to the store, and renders
a thin outline + 700ms dwell tooltip.

### Anchor interactions (settled phase)

- **Click anchor** → unified `ContextMenu` (base-ui `Menu.Root` +
  `AmbienceHandle`) with Change track / Adjust range / Reload track info /
  Remove this region. Right-click anywhere inside a region opens the same
  menu; right-click outside any region offers "Add ambient audio…".
- **Pointer-hold 250ms on anchor** → `AnchorDragReorder` takes over;
  indicator bar shows proposed slot; cannot cross partner anchor.
- **Click inside range (not on anchor)** → opens 1.4s / 96px reset window;
  second click nearby → remove both anchors, re-enter `placingStart`.

### Timing constants

```ts
CARET_DWELL_MS = 700
OPT_ARROW_COMMIT_DEBOUNCE_MS = 180
RESET_WINDOW_MS = 1400
RESET_WINDOW_RADIUS_PX = 96
DRAG_HOLD_MS = 250
ARM_GRACE_MS (runtime) = 1000
```

### Invariants

- **Overlap impossible**: `$validateProposedRange` runs post-commit with
  rollback.
- **Orphan impossible**: every cancel path flows through
  `$finalizePlacement`, which always yields a valid (possibly placeholder)
  region.
- **Editor lock**: select-mode KEY_DOWN listener at
  `COMMAND_PRIORITY_CRITICAL` catches all text-entry keystrokes and
  converts them into exit-finalize + passthrough.

### File map (additions)

```
plugin/
├── CaretNavigator.tsx            focused-node outline + dwell tooltip
├── CommitChip.tsx                floating "Set as start/end" button
├── ResetPrompt.tsx               "Tap again nearby to reset" tooltip
├── ContextMenu.tsx               base-ui Menu.Root (left-click anchor + right-click region)
├── AnchorDragReorder.tsx         hold-250ms drag, partner-anchor guard
├── AmbientAudioPlugin.tsx        REWRITTEN — state-machine driver
└── SelectModeOverlay.tsx         UPDATED — shows phase + hint

store/
└── ambientStore.tsx              EXTENDED — phase, focusedNodeKey,
                                  pendingStart/EndKey, resetWindow,
                                  dragState, anchorMenu*

utils/
└── anchors.ts                    EXTENDED — PLACEHOLDER_TRACK,
                                  $findBlockAncestor,
                                  $findViewportCenterBlock,
                                  $validateProposedRange,
                                  $insertAnchorAtBlockStart/End,
                                  $finalizePlacement, $reorderAnchor
```

---

## Resuming in a fresh session

Tell the next session:

> Read `src/payload/Lexical/Features/AmbientAudio/feature.md`.
> Frontend runtime is working; we're now doing Phase B — converting the
> anchor nodes from DecoratorNodes-with-snapshots to Payload inline Blocks
> with upload relationships to the Tracks collection, plus hooks on the
> Tracks collection to propagate updates/deletes.
> Proceed with the "Phase B — Payload refactor" plan in feature.md,
> starting with the dual-read frontend so we can ship incrementally.
