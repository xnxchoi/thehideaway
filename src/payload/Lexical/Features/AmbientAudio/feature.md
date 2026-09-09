# Ambient Audio — Developer Reference

Scored passages inside an essay. An editor marks a range of text with a
chosen track; on the public frontend, the reader arms an unobtrusive
Dynamic Island widget, and as they scroll through the range the track
fades in, follows their scroll position as a virtual seek, and fades out
on exit. HideawayFM is snapshotted on take-over and restored on release.

> **Version:** v2 (2026-04-20) — Payload `InlineBlocks`-backed anchors.
> The previous custom-`DecoratorNode` write-up is attic'd
> (`.attic/src/payload/Lexical/Features/AmbientAudio/feature.v1.md`). The migration dropped `nodes/AmbientAudioStartNode.tsx`,
> `nodes/AmbientAudioEndNode.tsx`, `server/populateRegion.ts`, and
> `server/validateRegion.ts` (all in `.attic/`), along with the legacy
> serialized types and track-snapshot helpers in `nodes/types.ts`.

---

## Architecture

Anchors are Payload **InlineBlocks**. A pair of blocks sharing `groupId`
form a region. Payload owns:

- the admin drawer UI for editing `source` / `playback`
- the relationship populate/strip cycle (`source.track` as a real
  `relationship` to `tracks`)
- serialization + JSON schema

Our code owns: the inserter/finalizer state machine, the visual anchor
glyph inside the editor, and the frontend scroll-coupled runtime.

### Files

```
src/payload/Lexical/Features/AmbientAudio/
├── index.ts                       Server feature (createServerFeature).
│                                  Re-exports AmbientAudioAnchorBlock +
│                                  slug so Posts/richContent can register
│                                  it under BlocksFeature.
├── feature.client.tsx             Client feature — registers the plugin
│                                  and store provider.
├── blocks/
│   └── AmbientAudioAnchorBlock.ts Payload Block definition. Fields:
│                                  groupId, kind (radio start|end),
│                                  source (group: provider + track|videoId|url),
│                                  playback (group: volume/loop/fades).
│                                  admin.components.Block →
│                                  AnchorBlockComponent.
├── components/
│   ├── AnchorBlockComponent.tsx   Editor-only glyph. Receives the
│                                  block's formData (including populated
│                                  track) and builds an in-memory
│                                  AmbientRegionData to render via
│                                  AnchorComponent.
│   └── AnchorComponent.tsx        Half-disk + title UI. Registers click →
│                                  openPicker and Backspace/Delete →
│                                  $removeGroup on the node's key.
├── plugin/
│   ├── AmbientAudioPlugin.tsx     Orchestrator. Hosts ContextMenu,
│   │                              SelectModeOverlay, TrackPicker,
│   │                              CaretNavigator, CommitChip,
│   │                              ResetPrompt, AnchorDragReorder.
│   │                              Registers Cmd+Arrow / Esc / outside-
│   │                              click commands while in select-mode.
│   ├── ContextMenu.tsx            base-ui Menu. Right-click / click-
│   │                              anchor entry point.
│   ├── SelectModeOverlay.tsx      Caret-adjacent status pill (placing
│   │                              start / placing end).
│   ├── CaretNavigator.tsx         Focused-block outline + dwell tooltip.
│   ├── CommitChip.tsx             "Set as start/end" floating button.
│   ├── ResetPrompt.tsx            "Tap again nearby to reset" tooltip.
│   ├── AnchorDragReorder.tsx      250ms hold → reorder with partner
│   │                              guard; cross-partner shakes.
│   ├── SelectionFollowOverlay.tsx Placeholder-region visual while the
│   │                              author is still ranging.
│   └── TrackPicker.tsx            floating-ui + cmdk track search over
│                                  searchTracks() in utils/tracks.ts.
├── nodes/
│   └── types.ts                   AnchorKind + AmbientRegionData union
│                                  (provider-discriminated: internal |
│                                  youtube | url). No serialized shapes
│                                  — Payload owns those now.
├── server/
│   └── scrubOnTrackDelete.ts      CollectionAfterDeleteHook on Tracks.
│                                  Walks every Post's Lexical tree; for
│                                  each inlineBlock with
│                                  blockType === AMBIENT_AUDIO_ANCHOR_SLUG
│                                  referencing the deleted track, resets
│                                  source to { provider: "internal",
│                                  track: null } — yields a placeholder
│                                  region the runtime safely skips.
├── store/
│   └── ambientStore.tsx           Zustand-in-context. Phase state
│                                  machine, pending anchor keys,
│                                  context-menu state, drag state.
├── utils/
│   ├── anchors.ts                 $isAmbientAnchor,
│   │                              $isAmbientStartAnchor,
│   │                              $isAmbientEndAnchor,
│   │                              $createAmbientAnchor(kind, groupId,
│   │                              region), $setAnchorRegion,
│   │                              getAnchorGroupId / getAnchorRegion,
│   │                              $findAnchorPair, $removeGroup,
│   │                              $updateGroupRegion,
│   │                              $finalizePlacement,
│   │                              $insertAnchorAtBlockStart/End,
│   │                              $validateProposedRange,
│   │                              $reorderAnchor. Uses nanoid for
│   │                              groupId ("g_...").
│   └── tracks.ts                  searchTracks(query) / getTrackById(id)
│                                  against /api/tracks. toSource() maps
│                                  a track doc → AmbientSourceInternal
│                                  and builds the public URL as
│                                  /track_media/<filename>.
└── feature.md                     This file.

src/components/UX/AmbientAudio/
├── AnchorMarkers.tsx              Frontend-only. Rendered by the
│                                  RichText JSX converter for the
│                                  inlineBlock with blockType ===
│                                  ambientAudioAnchor. Emits an
│                                  invisible layout span with
│                                  data-ambient-anchor /
│                                  data-ambient-group /
│                                  data-ambient-track-id /
│                                  data-ambient-track (JSON of the
│                                  resolved AmbientRegionData).
├── AmbientAudioProvider.tsx       Scroll-coupled state machine. Scans
│                                  DOM for anchors via MutationObserver,
│                                  drives per-group Howl instances,
│                                  snapshots + restores HideawayFM on
│                                  take-over. Exposes useAmbientAudio().
├── AmbientAudioWidget.tsx         Compact pill button for the
│                                  DynamicIsland.
└── AmbientAudioRunner.tsx         ORPHANED; scheduled for attic.
```

### Wiring

- `src/payload/collections/Posts/richContent.ts` registers
  `AmbientAudioFeature()` and adds `AmbientAudioAnchorBlock` to the
  `BlocksFeature({ inlineBlocks: [...] })` config alongside other
  inline-block types.
- `src/payload/fields/Article/Content/index.tsx` registers
  `AmbientAudioClientFeature` under
  `clientFeatures.ambientAudioFeature`.
- `src/payload/fields/RichText/index.tsx` routes the `inlineBlock`
  JSX converter: when `fields.blockType === AMBIENT_AUDIO_ANCHOR_SLUG`
  it renders `<AnchorMarkers />`.
- `src/payload/collections/Radio/Tracks.ts` registers
  `scrubAmbientRefsOnTrackDelete` as an `afterDelete` hook.
- `src/components/UX/Highlightr/index.tsx` wraps `<Article>` inside
  `Narrateur` with `<AmbientAudioProvider>` and adds
  `<AmbientAudioWidget />` as a child of `<DynamicBreadcrumb>`.

---

## Data model

### Persisted (Payload InlineBlock fields)

```ts
{
  blockType: "ambientAudioAnchor",
  id: "<ObjectId, auto>",
  groupId: "g_aB3xQ7",
  kind: "start" | "end",
  source: {
    provider: "internal",
    track: "<trackId>" | { id, ...populated } | null
  } | {
    provider: "youtube",
    videoId: string,
    startSeconds?: number | null,
    endSeconds?: number | null
  } | {
    provider: "url",
    url: string
  },
  playback?: {
    volume?: number,
    loop?: boolean,
    fadeInMs?: number,
    fadeOutMs?: number
  }
}
```

`source.track` is a real Payload `relationship` (depth-controlled). At
`depth: 0` it's a string id; at `depth >= 1` it's the populated track
doc. The scrub hook rewrites it to `null` when the referenced track is
deleted. The frontend tolerates both shapes and treats a missing track
as a placeholder region.

### Runtime (in-memory)

```ts
type AmbientRegionData = {
  source: AmbientSourceInternal | AmbientSourceYouTube | AmbientSourceUrl;
  playback?: AmbientPlayback;
};
```

The provider-discriminated `AmbientSource` union lives in
[`nodes/types.ts`](./nodes/types.ts). `utils/anchors.ts` `encodeRegion`
and `decodeRegion` bridge between the persisted block fields and the
runtime shape — e.g. `AmbientSourceInternal.trackId` on the runtime
side ↔ `source.track` (string | populated | null) on the persisted
side.

### Placeholder regions

A region with `source.provider === "internal"` and no track (id empty
or null) is a **placeholder**. It renders editor-only (so the author
can see where they committed the region before picking a track), and
both the JSX converter and the frontend runtime skip it.

---

## Playback URL

`utils/tracks.ts` `toSource()` builds:

```
url: `/track_media/${encodeURIComponent(doc.filename)}`
```

The Tracks collection uploads to `/public/track_media/`. Next.js serves
this as a static path. No auth, no custom endpoint. If `doc.filename`
is missing, falls back to `doc.url`.

Because `source.track` is a real relationship, re-uploading a track
(which Payload handles by renaming on collision, e.g. `foo-1.mp3`)
doesn't orphan the anchor: the next page load fetches the current
`filename` via the populated relationship.

---

## Runtime state machine (scroll-coupled)

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
`fmControls.play()` only if `wasPlaying` was true.

### Autoplay unlock

The widget's `toggle()` call is a user gesture. Inside it we:
1. Resume `Howler.ctx` if suspended.
2. Play a 0.05s silent data-URL WAV via `new Audio()` — flips browser's
   "user has interacted with audio" flag for the session.
3. `play()` every loaded Howl at volume 0, then `pause()` each 20ms
   later (warms them up, unlocks their underlying `<audio>` elements).

### Fade robustness

`Howl.fade(from, to, ms)` doesn't always run if called before the audio
has begun playing. `fadeIn()` registers `h.once("play", runFade)` and
backs it up with a 600ms timeout that sets `volume(HEAD_ROOM)` directly
if the fade never kicked in.

---

## Editor — select-mode state machine

Select-mode behaves like a calendar date-range picker: every interaction
either advances the phase, adjusts a boundary, or gracefully finalizes
the region. Invalid states (overlap, orphan anchor) are unreachable by
construction.

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
| No track    | Placeholder region (`source.track === null`). |

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

### Anchor interactions (settled phase)

- **Click anchor** → unified `ContextMenu` (base-ui `Menu.Root` +
  `AmbienceHandle`) with Change track / Adjust range / Reload track
  info / Remove this region. Right-click anywhere inside a region opens
  the same menu; right-click outside any region offers "Add ambient
  audio…".
- **Pointer-hold 250ms on anchor** → `AnchorDragReorder` takes over;
  indicator bar shows proposed slot; cannot cross partner anchor
  (shake + pin at partner-adjacent slot if attempted).
- **Click inside range (not on anchor)** → opens 1.4s / 96px reset
  window; second click nearby → remove both anchors, re-enter
  `placingStart`.

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

- **Overlap impossible**: `$validateProposedRange` runs post-commit
  with rollback.
- **Orphan impossible**: every cancel path flows through
  `$finalizePlacement`, which always yields a valid (possibly
  placeholder) region.
- **Editor lock**: select-mode `KEY_DOWN` listener at
  `COMMAND_PRIORITY_CRITICAL` catches text-entry keystrokes and
  converts them into exit-finalize + passthrough.

---

## Track-delete integrity

`scrubAmbientRefsOnTrackDelete` (see [`server/scrubOnTrackDelete.ts`](./server/scrubOnTrackDelete.ts))
fires as an `afterDelete` hook on the Tracks collection.

It paginates every Post (`depth: 0`, `draft: true`), walks the Lexical
tree, and for each `inlineBlock` whose `fields.blockType ===
AMBIENT_AUDIO_ANCHOR_SLUG` and `fields.source` references the deleted
track id (either as a string or as a populated object), rewrites
`fields.source` to `{ provider: "internal", track: null }`. The post
is re-saved only when at least one node changed.

Older versions retain the stale reference by design (version history).
The runtime tolerates `null`-populated `source.track`, so a partial
scrub is a cleanliness hazard, not a correctness one.

---

## Removing the feature cleanly

Remove `AmbientAudioAnchorBlock` from `BlocksFeature.inlineBlocks` in
`Posts/richContent.ts` and the `AmbientAudioClientFeature` entry in
`fields/Article/Content/index.tsx`. Existing documents retain the
inline-block nodes in their JSON; they simply stop rendering. Drop the
widget and provider in Highlightr.

The `scrubAmbientRefsOnTrackDelete` hook on `Tracks` can be removed
last (no-op once no Posts carry ambient anchors).
