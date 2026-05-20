# Day n Night — Dress act redesign + Polaroid texture system

PRP / implementation plan. Source spec: `/frontend-design` output produced 2026-05-19 (turn). Consumer: `/feature-dev` (multi-phase).

> Cross-session doc; lives in `readmes/` alongside `DAY_N_NIGHT.md`. If the redesign ships and stabilises, fold its outcomes into `DAY_N_NIGHT.md` § 6 (Immersive view).

## Summary

Redesign the **Dress** act of `/day-n-night`'s immersive timeline into a horizontal-parallax corridor with two option "rooms" (≥150 vw each), promote polaroids to the protagonist of each room, apply the existing polaroid-texture PNGs (mint-tinted frames + back-card stickers) as a typed variant system, unify all polaroid captions to one serif style, relocate the "Something quiet, unannounced" line out of Dress into Night below "Mood shift."

## User Story

As a visitor to the Day n Night immersive landing, I want the Dress section to feel like flipping through someone's moodboard for the night rather than reading two squashed columns of body copy, so that I read the option labels first, then the photos, then the "explainer" — paced by my own scroll, not all at once.

## Problem → Solution

**Current state:** Dress is a two-column grid pinned at `--act-w: 1.1` (≈1.1 vw). Each column has tiny serif heading (24–36 px) and 19 px body, with polaroids stuffed in above the label as an afterthought. Captions are split between italic-serif and Permanent-Marker cursive — two voices. Intro paragraph adds friction. "Secret" line dangles below the columns. Nothing reveals progressively — everything fires on `whileInView`.

**Desired state:** Dress becomes a 3.2 vw corridor. Two 1.5 vw "rooms" (01, 02) with a 0.2 vw eyebrow lead-in. Each room has 3 internal bands (Anchor → Cluster → Read) gated by GSAP horizontal-scroll progress. Polaroids are visually larger (≥220 px width), all portrait 0.76 aspect, with mint-tinted texture frames. Single caption voice: serif normal weight, no clipping. Intro deleted. Secret line moved to Night.

## Metadata

| Field | Value |
|---|---|
| Complexity | **Large** (Polaroid component refactor + JSX rewrite + 4 PNG assets + GSAP per-room reveal + i18n + caption-style ripple across all 4 acts that use polaroids) |
| Source PRD | N/A — direct from `/frontend-design` spec |
| Estimated files | 5–6 (Timeline.tsx, Polaroid.tsx, styles.module.scss, en.json, ko.json, optional new DressRoom.tsx) |
| Estimated tasks | 18 across 3 phases |

---

## Phase plan

### Phase 1 — Caption unification + secret relocation (≈30 min)

Pure copy/style. No layout changes. Validates fast.

- Unify all polaroid captions to one serif style. Delete `captionStyle="marker"` from the type union; delete `.polaroidMarker` SCSS.
- Replace `.polaroidSerif` with `.polaroidCaption` (drop italic, drop line-clamp).
- Delete `dressCode.intro` from both message files, delete `.dressIntro` / `.dressIntroWrap` SCSS, delete the JSX block.
- Delete `secret` from both message files, delete `.actSecret` SCSS, delete the JSX usage in Dress.
- Add `act.night.announcement` to both message files; add `.nightAnnouncement` SCSS; insert `<RevealItem>` in Night's `.nightMain` after `.nightSectionTitle`.
- Update `dressCode.heading` → `"One rule: Don't dress your age."` in both message files.

Gate: build green, preview shows new kicker copy, single caption style across Cookout/Dress/Night polaroids, "Something quiet…" appears in Night.

### Phase 2 — Polaroid texture variant system (≈45 min)

Polaroid.tsx refactor only. Timeline.tsx call sites updated to pass `variant` + `overlay` / `backTexture` props. No layout changes yet — variant just visually replaces the plain frame.

- Add `variant: "clean" | "stamped" | "back"` to PolaroidProps. Default `"clean"` so existing call sites stay valid.
- Add `overlay?: "card-2_front-clear" | "card-4_front-clear"` (front-clear variant texture key).
- Add `backTexture?: "card-2_back" | "card-4_back-2"` (back variant texture key).
- Render order inside `.polaroidFrame`:
  - `clean`: existing path — `<NextImage>` photo + caption.
  - `stamped`: `<NextImage>` photo + absolute-positioned overlay `<NextImage>` on top of frame, both inside fixed 0.76 portrait aspect; caption below.
  - `back`: full-card `<NextImage>` of the back texture only; no photo source; no caption.
- All variants share **fixed portrait aspect** (0.76). Photo `object-fit: cover`. The per-photo `aspect` prop becomes irrelevant for the new look but stays in the type union so the prop deprecation can be gradual (or just dropped — see Task 2.5).

Gate: dress polaroids visually swap to textured frames; layout still 2-column.

### Phase 3 — Dress corridor + per-room GSAP choreography (≈90 min)

The architectural change.

- Bump `.actDress --act-w: 1.1` → `3.2`.
- Replace `.dressColsBespoke` flex/grid with `.dressCorridor` (`display: flex; align-items: stretch; height: 100%`).
- Replace each `.dressColBespoke` with a `<DressRoom>` instance (`width: 150vw`, three internal positional bands).
- Each room hosts: option marker (`01` / `02`) + heading anchored bottom-left of Band A, polaroid scatter in Band B (absolute-positioned within the room), body copy bottom-left of Band C.
- Per-room reveal driven by GSAP ScrollTrigger child timeline (NOT `whileInView` — see Gotchas). Three keyframes: 0.0–0.15 heading in, 0.20–0.55 polaroid cascade, 0.55–0.85 body reveal, 0.85–1.0 exit fade to 0.6 opacity.
- Add 1 decorative back-variant polaroid per room.

Gate: vertical scroll drives a long horizontal pan through 2 stacked rooms, per-room reveals fire as the cursor enters each room. Type-check + build green. Other acts visually unchanged.

---

## Mandatory reading (P0)

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/components/sections/DayNNight/Immersive/Polaroid.tsx` | 1–202 | Component being refactored. Has the existing `paraX` parallax pattern that the new variants must preserve. |
| P0 | `src/components/sections/DayNNight/Immersive/Timeline.tsx` | 1–230 | Pin / ScrollTrigger setup. The act-track is one horizontally-scrolled element; vertical scroll drives horizontal `x` translate. Critical for understanding why per-room reveals can't use `whileInView`. |
| P0 | `src/components/sections/DayNNight/Immersive/Timeline.tsx` | 395–510 | Current Dress JSX to replace + Night JSX where the announcement gets inserted. |
| P0 | `src/components/sections/DayNNight/Immersive/Reveal.tsx` | 100–175 | `RevealStage` `active` prop pattern — for the controlled-by-state Stage. Phase 3 may need a similar progress-driven primitive. |
| P0 | `src/components/sections/DayNNight/store.ts` | 60–161 | Section keys + ANCHOR_DRESS (=0.478). Confirms the dress anchor doesn't move; only the act's horizontal width grows. |
| P0 | `src/components/sections/DayNNight/styles.module.scss` | 541–820 | The act-width system (`--act-w`) + current Dress classes being deleted. |
| P0 | `messages/en.json` + `messages/ko.json` | 300–390 | Dress / Night message blocks. Both files mirror each other — edit in lockstep per CLAUDE.md i18n rule. |
| P1 | `readmes/DAY_N_NIGHT.md` | 1–120 | Project anchor doc. Defines simplified vs immersive views and the daytime → sunset → night arc that Dress sits on. |
| P1 | `public/assets/textures/photograph/*.png` | (binary) | The 4 PNG assets. Confirm sizes; `card-2_back@2x.png` has the unique filename prefix (`672a4022c04412b253b0af22_card-2_back@2x.png`) — encode the prefix in the texture-key → path map. |
| P2 | `src/components/sections/DayNNight/Immersive/Reveal.tsx` | 197–238 | `LoaderReveal` — a precedent for "store-progress-driven reveal." Use as a model for `<DressRoomReveal>` if a non-GSAP path is needed. |

## External documentation

None needed. All patterns are internal (GSAP, Motion, next-intl, next/image). The polaroid texture concept ports an asset we already own.

---

## Patterns to mirror

### MOTION_IMPORT — always default-export the namespace
```ts
// SOURCE: src/components/sections/DayNNight/Immersive/Polaroid.tsx:6
import * as m from "motion/react-m";
```
Never `import { motion } from "motion/react"` — per CLAUDE.md the `m.*` style avoids the full-bundle import.

### NEXT_IMAGE_FILL_POLAROID
```tsx
// SOURCE: src/components/sections/DayNNight/Immersive/Polaroid.tsx:142-149
<NextImage
  src={src}
  alt={alt}
  fill
  sizes={`${Math.round(width)}px`}
  priority={priority}
  className="object-cover"
/>
```
Parent must be `position: relative` for `fill` to layout. `.polaroidPhoto` already provides that.

### ZUSTAND_GETSTATE_IN_RAF
```ts
// SOURCE: src/components/sections/DayNNight/Immersive/Polaroid.tsx:98-106
const tick = () => {
  if (!active) return;
  const p = useDayNNightScene.getState().progress;
  let d = p - anchor;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  paraX.set(d * depth * range);
  raf = requestAnimationFrame(tick);
};
```
Read store with `.getState()` inside rAF — don't subscribe (would re-render every progress write).

### MOTION_VARIANTS_STAGE_PATTERN
```tsx
// SOURCE: src/components/sections/DayNNight/Immersive/Reveal.tsx:79-86, 169-173
const STAGE_VARIANTS: Variants = {
  hidden: { opacity: 1 },              // benign no-op preserves stage propagation
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.15 }
  }
};
```
The benign-no-op trick on `hidden` is load-bearing — Motion short-circuits stage propagation when both states are empty.

### STAGE_ACTIVE_GATE
```tsx
// SOURCE: src/components/sections/DayNNight/Immersive/Reveal.tsx:154-168
const motionProps = active !== undefined
  ? { initial: "hidden" as const, animate: active ? "visible" : "hidden" }
  : { initial: "hidden" as const, whileInView: "visible" as const, viewport };
```
When `active` is provided, `whileInView` is bypassed. Mirror this if Dress reveals need a non-IntersectionObserver gate.

### CSS_VARIABLE_ACT_WIDTH
```scss
// SOURCE: src/components/sections/DayNNight/styles.module.scss:541-573, 644, 719, 788
.act {
  width: calc(var(--act-w, 1) * 100vw);
  // ...
}
.actDress { --act-w: 1.1; }    // change this
```
Per-act width is purely CSS. The Timeline measures resulting widths in `setLayout`; no JS table to keep in sync.

### I18N_NAMESPACE
```tsx
// SOURCE: src/components/sections/DayNNight/Immersive/Timeline.tsx (Timeline + ActSet)
const t = useTranslations("Event.DayNNight");
// t("dressCode.heading"), t("act.night.body"), etc.
```
Single namespace `Event.DayNNight`. All Dress + Night keys live under it.

### POLAROID_GROUP_VIEWPORT
```tsx
// SOURCE: src/components/sections/DayNNight/Immersive/Polaroid.tsx:185-200
<m.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount }}
  variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: 0.1 } } }}
>
  {children}
</m.div>
```
The existing `PolaroidGroup` is `whileInView`-driven. **Phase 3 must replace this** for Dress polaroids with a progress-driven equivalent (see GOTCHA "horizontal-scroll IntersectionObserver").

---

## Files to change

| File | Phase | Action | Justification |
|---|---|---|---|
| `messages/en.json` | 1 | UPDATE | Drop `dressCode.intro`, drop `secret`, update `dressCode.heading`, add `act.night.announcement`. |
| `messages/ko.json` | 1 | UPDATE | Same edits — must mirror en.json (project i18n rule). |
| `src/components/sections/DayNNight/Immersive/Polaroid.tsx` | 1 + 2 | UPDATE | Phase 1: drop `marker` from union, rename caption class. Phase 2: add variant system + texture overlay/back rendering. |
| `src/components/sections/DayNNight/Immersive/Timeline.tsx` | 1 + 3 | UPDATE | Phase 1: delete `dressIntroWrap` block + secret span + update kicker text; insert Night announcement. Phase 3: replace `.dressColsBespoke` with `<DressCorridor>`/`<DressRoom>`. |
| `src/components/sections/DayNNight/styles.module.scss` | 1 + 2 + 3 | UPDATE | Phase 1: rename `.polaroidSerif` → `.polaroidCaption`, drop `.polaroidMarker` + `.dressIntro*` + `.actSecret`, add `.nightAnnouncement`. Phase 2: add `.polaroidOverlay`, `.polaroidBack`, lock polaroid frame to 0.76 aspect. Phase 3: bump `--act-w` for Dress, replace `.dressCols*` with corridor/room/band classes. |
| `src/components/sections/DayNNight/Immersive/DressRoom.tsx` | 3 | CREATE (optional) | Encapsulates per-room layout + GSAP reveal timeline. Optional — could inline in Timeline.tsx if it stays tight. Recommended: create the file. |

## NOT building

- Background color transitions across the Dress corridor (gentlerain's teal → orange). The sky palette is already coupled to scene progress; adding a Dress-only chromatic shift is its own decision. **Defer.**
- Right-edge anchor buttons (P / C). The Scrubber already plays this role. **Skip.**
- Handwritten doodles/stickers added by hand on polaroid frames beyond the texture PNGs themselves (no extra SVG overlays). The textures already carry their own annotation chrome (smiley, "best team", "03.04"). **Skip.**
- A new motion preset library for the per-room reveals. Use `ITEM_VARIANTS` / `STAGE_VARIANTS` patterns already in `Reveal.tsx`. **Reuse.**
- The marker-pen caption voice. Even on Cookout / Night polaroids. **Permanently retired.**
- Touch / gyro-driven polaroid drift. Stays scroll-only. **Skip.**
- Modifying `ANCHOR_DRESS` (currently `0.478`). The sun stays at sunset for the Dress center; widening the act doesn't move the anchor. **Do not touch.**

---

## Step-by-step tasks

### Phase 1 — Caption unification + secret relocation

#### Task 1.1: Update i18n keys (en + ko)
- **ACTION**: Edit both message files together. Replace `dressCode.heading` value. Delete `dressCode.intro` and top-level `secret` keys. Add `act.night.announcement`.
- **IMPLEMENT**:
  ```jsonc
  // en.json + ko.json — both files, same diff (ko.json currently mirrors en.json verbatim per the inspected snippet)
  "act": {
    "day": { ... },
    "night": {
      "label": "NIGHT",
      "time": "20:00 → late",
      "sectionTitle": "Mood shift.",
      "announcement": "Something quiet, unannounced, will be there.",   // NEW
      "dressLabel": "Dress code, after dark",
      "heading": "Sharp. Chic. Dressed to impress.",
      "body": "..."
    }
  },
  "dressCode": {
    "heading": "One rule: Don't dress your age.",                        // UPDATED
    // DELETE: "intro": "Standing at the edge..."
    "option1": { ... },
    "option2": { ... }
  },
  // ...
  // DELETE the top-level: "secret": "Something quiet, unannounced, will be there."
  ```
- **MIRROR**: `I18N_NAMESPACE`. Both files edited in the same commit.
- **GOTCHA**: ko.json mirrors en.json verbatim (no actual Korean translation in tree). Don't accidentally translate to actual Korean; mirror as-is. If a real KO copy is provided later, swap in.
- **VALIDATE**:
  ```bash
  jq '.Event.DayNNight.dressCode.intro // "removed"' messages/en.json   # → "removed"
  jq '.Event.DayNNight.secret // "removed"' messages/en.json            # → "removed"
  jq '.Event.DayNNight.act.night.announcement' messages/en.json         # → "Something quiet..."
  jq '.Event.DayNNight.dressCode.heading' messages/en.json              # → "One rule..."
  # Same checks on ko.json.
  ```

#### Task 1.2: Drop `marker` caption style from Polaroid component
- **ACTION**: Open `Polaroid.tsx`. Remove `"marker"` from the `captionStyle` union; remove the default and the prop entirely OR keep prop for back-compat and ignore it (recommend: REMOVE — cleanest).
- **IMPLEMENT**:
  ```diff
   interface PolaroidProps {
     src: string;
     alt?: string;
     caption?: ReactNode;
  -  captionStyle?: "serif" | "marker";
     width?: number;
     // ...
   }
   // ...
  -  captionStyle = "serif",
   // ...
  -  {caption ? (
  -    <figcaption
  -      className={
  -        captionStyle === "marker" ? s.polaroidMarker : s.polaroidSerif
  -      }
  -    >
  -      {caption}
  -    </figcaption>
  -  ) : null}
  +  {caption ? (
  +    <figcaption className={s.polaroidCaption}>{caption}</figcaption>
  +  ) : null}
  ```
- **MIRROR**: NEXT_IMAGE_FILL_POLAROID — render path unchanged otherwise.
- **GOTCHA**: All call sites in Timeline.tsx pass `captionStyle="marker"` in 4 places (Cookout vibe, Dress pink, Dress notDads, Night jacket — `grep -n 'captionStyle="marker"' src/components/sections/DayNNight/Immersive/Timeline.tsx`). They become invalid props. Delete them.
- **VALIDATE**:
  ```bash
  grep -n 'captionStyle' src/components/sections/DayNNight/Immersive/Timeline.tsx   # → no matches
  grep -n 'polaroidMarker\|marker' src/components/sections/DayNNight/Immersive/Polaroid.tsx   # → no matches
  pnpm tsc --noEmit --pretty false 2>&1 | grep "Polaroid\|captionStyle"             # → no new errors
  ```

#### Task 1.3: Rename caption class + drop italic + drop line-clamp
- **ACTION**: In `styles.module.scss`, replace `.polaroidSerif` with `.polaroidCaption`. Delete `.polaroidMarker`. Drop italic, drop `-webkit-line-clamp`.
- **IMPLEMENT**:
  ```scss
  // Replaces .polaroidSerif. Unified single style for all polaroid
  // captions. Upright Caslon at 16px so the caption reads as a printed
  // photo label without italic stroke loss. No line-clamp — captions
  // display in full, however many lines (per design spec § 9 #3).
  .polaroidCaption {
    margin-top: 12px;
    font-family: var(--font-serif, "Adobe Caslon Pro", "Georgia", serif);
    font-style: normal;
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
    color: oklch(20% 0.02 60);
    text-align: center;
    letter-spacing: 0.005em;
    // no overflow rules — caption grows the polaroid's bottom margin
  }
  // DELETE: .polaroidMarker { ... }
  // DELETE: .polaroidSerif  { ... }
  ```
- **MIRROR**: existing `.polaroidSerif` block (delete in-place, write the replacement there).
- **GOTCHA**: The class is referenced by both raw class name (`s.polaroidSerif`) and the Polaroid component. After this task the component reads `s.polaroidCaption` (per Task 1.2). No other consumers — grep to confirm.
- **VALIDATE**:
  ```bash
  grep -rn "polaroidSerif\|polaroidMarker" src/   # → no matches
  grep -rn "polaroidCaption" src/                  # → matches in Polaroid.tsx + styles.module.scss only
  ```

#### Task 1.4: Delete `.dressIntro*` and `.actSecret` from SCSS + JSX
- **ACTION**: SCSS — delete `.dressIntro` and the wrapper logic, `.actSecret`. JSX — delete the `<RevealStage as="div" className={s.dressIntroWrap}>...</RevealStage>` block and the `<span className={s.actSecret}>` line from Dress.
- **IMPLEMENT**: Straight deletion.
- **MIRROR**: N/A.
- **GOTCHA**: `.dressIntroWrap` may or may not have a corresponding SCSS class — check both `.dressIntro` and `.dressIntroWrap` and remove whichever exist. The JSX uses `RevealStage as="div" className={s.dressIntroWrap}` — both the Stage AND `.dressIntro` go.
- **VALIDATE**:
  ```bash
  grep -rn "dressIntro\|actSecret" src/    # → no matches
  ```

#### Task 1.5: Update kicker copy
- **ACTION**: In Timeline.tsx Dress section, the kicker reads `t("dressCode.heading")`. The English value already updated in 1.1; no JSX change needed. Just confirm.
- **IMPLEMENT**: No code edit — already covered by 1.1.
- **VALIDATE**: Open preview at `/day-n-night` immersive view, scroll to Dress, kicker reads "III · One rule: Don't dress your age."

#### Task 1.6: Insert Night announcement
- **ACTION**: In Timeline.tsx Night section, after `<RevealItem as="h2" className={s.nightSectionTitle}>` and before `<div className={s.nightTribute}>`, insert a new `<RevealItem>` reading `t("act.night.announcement")`.
- **IMPLEMENT**:
  ```tsx
  <RevealStage as="div" className={s.nightMain}>
    <RevealItem as="h2" className={s.nightSectionTitle}>
      {t("act.night.sectionTitle")}
    </RevealItem>
    {/* NEW — relocated from Dress */}
    <RevealItem as="p" className={s.nightAnnouncement}>
      {t("act.night.announcement")}
    </RevealItem>
    <div className={s.nightTribute}>
      <RevealItem as="h3" className={s.nightTributeHeading}>
        {t("tribute.heading")}
      </RevealItem>
      <RevealItem as="p" className={s.nightTributeBody}>
        {t("tribute.body")}
      </RevealItem>
    </div>
  </RevealStage>
  ```
- **MIRROR**: MOTION_VARIANTS_STAGE_PATTERN — sits inside the existing `RevealStage` so the announcement cascades in with the section title.
- **GOTCHA**: Two ActSet instances render the Night section — one visible, one DOM-duplicate for the seamless wrap. Don't duplicate the announcement insertion; the `<ActSet>` function body is the single source.
- **VALIDATE**: Preview both Night occurrences in the timeline; the announcement reads in both.

#### Task 1.7: Add `.nightAnnouncement` SCSS
- **ACTION**: After `.nightSectionTitle` block, add:
  ```scss
  // Relocated from .actSecret (was in Dress as a quiet aside). Now the
  // headline announcement after "Mood shift." — italic serif, the editorial
  // voice that names the unannounced thing on the night side of the loop.
  .nightAnnouncement {
    font-family: var(--font-serif, "Adobe Caslon Pro", serif);
    font-style: italic;
    font-weight: 500;
    font-size: clamp(2.2rem, 2.2vw, 2.8rem);  // 22–28px in 10px-rem scale
    line-height: 1.4;
    color: var(--dn-fg);
    opacity: 0.85;
    max-width: 36ch;
  }
  ```
- **VALIDATE**: Preview shows announcement at ~22-28px italic.

### Phase 1 gate

```bash
pnpm tsc --noEmit --pretty false 2>&1 | tail -20     # no new errors
pnpm build 2>&1 | tail -10                            # green
# Preview server: open /day-n-night, switch to immersive (story) view,
# scroll through. Check:
#   1. Dress kicker reads "One rule: Don't dress your age."
#   2. No intro paragraph above the dress options.
#   3. All polaroids (Cookout + Dress + Night) have the same caption style.
#   4. No "Something quiet, unannounced..." line in Dress.
#   5. "Something quiet, unannounced..." appears in Night below "Mood shift."
```

If anything fails, ROLLBACK is `git restore` on the 5 files — no schema or runtime state changes in Phase 1.

---

### Phase 2 — Polaroid texture variant system

#### Task 2.1: Add variant types + texture-key map
- **ACTION**: In `Polaroid.tsx`, define a closed union of variant + texture keys, and a key → path map.
- **IMPLEMENT**:
  ```ts
  export type PolaroidVariant = "clean" | "stamped" | "back";
  type FrontOverlay = "card-2_front-clear" | "card-4_front-clear";
  type BackTexture  = "card-2_back" | "card-4_back-2";

  // The `card-2_back` PNG happens to be prefixed with a CMS-id-looking
  // string in the filename (672a4022c04412b253b0af22_card-2_back@2x.png).
  // The other three are clean names. Keep the prefix in the path map
  // so the asset name on disk stays untouched.
  const FRONT_PATHS: Record<FrontOverlay, string> = {
    "card-2_front-clear": "/assets/textures/photograph/card-2_front-clear@2x.png",
    "card-4_front-clear": "/assets/textures/photograph/card-4_front-clear@2x.png"
  };
  const BACK_PATHS: Record<BackTexture, string> = {
    "card-2_back":   "/assets/textures/photograph/672a4022c04412b253b0af22_card-2_back@2x.png",
    "card-4_back-2": "/assets/textures/photograph/card-4_back-2@2x.png"
  };

  // Polaroid card master aspect (matches the texture PNGs, 956×1247-1268).
  // Photos cover-fit into this aspect regardless of source dimensions.
  const POLAROID_ASPECT = 0.76;
  ```
- **VALIDATE**: `find public/assets/textures/photograph -name '*.png'` → 4 PNGs match the map values.

#### Task 2.2: Extend PolaroidProps
- **ACTION**: Add `variant`, `overlay`, `backTexture` to props; make `src` + `aspect` + `caption` conditional on variant.
- **IMPLEMENT**:
  ```ts
  interface PolaroidProps {
    /** "clean" (default): photo + plain frame. "stamped": photo + texture overlay (mint frame + doodle). "back": no photo, full-card back texture, no caption. */
    variant?: PolaroidVariant;
    /** Required for variant="clean"|"stamped". */
    src?: string;
    alt?: string;
    /** Required for variant="clean"|"stamped". Omitted for "back". */
    caption?: ReactNode;
    /** Required when variant="stamped". */
    overlay?: FrontOverlay;
    /** Required when variant="back". */
    backTexture?: BackTexture;

    width?: number;
    // aspect prop deprecated for variant="stamped"|"back" — kept on the type
    // for variant="clean" callers; defaults to POLAROID_ASPECT for non-clean.
    aspect?: number;
    angle?: number;
    depth?: number;
    anchor?: number;
    range?: number;
    priority?: boolean;
  }
  ```
- **MIRROR**: Existing prop docstrings keep their voice. Use TS-comment annotations consistent with the surrounding file.
- **GOTCHA**: Existing call sites pass `aspect={...}` per photo. They keep working under `variant="clean"`. Under `variant="stamped"` the per-photo aspect is ignored — the polaroid card is always portrait 0.76. Document this in the prop comment.
- **VALIDATE**: `pnpm tsc --noEmit --pretty false 2>&1 | grep Polaroid` — no errors.

#### Task 2.3: Render variants
- **ACTION**: Branch inside `<Polaroid>` on `variant`:
  ```tsx
  return (
    <m.div className={s.polaroidPara} style={{ x: paraX, width }} variants={POLAROID_PARA_VARIANTS}>
      <m.div className={s.polaroid} style={{ rotate: angle }} data-variant={variant}>
        <div className={s.polaroidFrame}>
          {variant === "back" ? (
            <div className={s.polaroidBack} style={{ aspectRatio: POLAROID_ASPECT }}>
              <NextImage src={BACK_PATHS[backTexture!]} alt="" fill sizes={`${Math.round(width)}px`} className="object-cover" />
            </div>
          ) : (
            <>
              <div className={s.polaroidPhoto} style={{ aspectRatio: variant === "stamped" ? POLAROID_ASPECT : (aspect ?? 1) }}>
                <NextImage src={src!} alt={alt} fill sizes={`${Math.round(width)}px`} priority={priority} className="object-cover" />
                {variant === "stamped" && overlay ? (
                  <NextImage
                    src={FRONT_PATHS[overlay]}
                    alt=""
                    fill
                    sizes={`${Math.round(width)}px`}
                    className={s.polaroidOverlay}
                  />
                ) : null}
              </div>
              {caption ? <figcaption className={s.polaroidCaption}>{caption}</figcaption> : null}
            </>
          )}
        </div>
      </m.div>
    </m.div>
  );
  ```
- **MIRROR**: NEXT_IMAGE_FILL_POLAROID for every image; preserve the `paraX` outer Motion layer and the inner rotate.
- **GOTCHA**: When `variant="stamped"`, the overlay `<NextImage>` covers the photo with `inset:0` (via `.polaroidOverlay` CSS). The transparent middle of the PNG lets the underlying photo show through. If the overlay PNG has any non-transparent pixels in the photo region, those will hide content — verify on first render.
- **VALIDATE**: Visually, in the preview, dress polaroids should now show the mint-tinted frame border + corner doodle.

#### Task 2.4: SCSS — overlay + back + frame-aspect lock
- **ACTION**: Add `.polaroidOverlay` and `.polaroidBack` classes. The existing `.polaroidPhoto` keeps its dynamic `aspect-ratio` from JSX (so variant="clean" still respects per-photo `aspect`).
- **IMPLEMENT**:
  ```scss
  // Front-clear texture overlay — sits on top of the photo, transparent
  // in the middle, frame + doodle composited on top.
  .polaroidOverlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    object-fit: contain;
    object-position: center;
    user-select: none;
  }

  // Back-variant — full-card back texture, no photo source. Sits inside
  // the polaroid frame at the master aspect, no overlay layer needed
  // because the PNG already provides its own frame.
  .polaroidBack {
    position: relative;
    width: 100%;
  }
  ```
- **VALIDATE**: Preview a stamped polaroid (Task 2.5) — frame border visible, smiley doodle present in corner.

#### Task 2.5: Update Timeline call sites for Dress (Phase 2 scope only — corridor layout deferred to Phase 3)
- **ACTION**: For each existing Dress polaroid in `<PolaroidGroup>`, change `captionStyle` (already removed in 1.2) to `variant="stamped"` + `overlay=...`. Add 2 back-variant polaroids (one per option group).
- **IMPLEMENT**: Per the spec distribution:
  - Option 01 cluster:
    - Romeo: `variant="stamped" overlay="card-2_front-clear"`
    - Pink Mean Girls: `variant="stamped" overlay="card-4_front-clear"`
    - NEW back card: `variant="back" backTexture="card-2_back"` (no caption, decorative)
  - Option 02 cluster:
    - Steve Carrell: `variant="stamped" overlay="card-4_front-clear"`
    - Pulp Fiction not-dads: `variant="stamped" overlay="card-2_front-clear"`
    - The Dude: `variant="stamped" overlay="card-4_front-clear"`
    - NEW back card: `variant="back" backTexture="card-4_back-2"` (no caption, decorative)
- **MIRROR**: Existing `<Polaroid>` calls; only mutate the props.
- **GOTCHA**: All `variant="stamped"` polaroids now render at portrait 0.76 aspect regardless of the original photo aspect. The Steve Carrell still (0.636 aspect, portrait) will look right; the Romeo (1.499, landscape) gets cropped — the texture window crops to portrait. Confirm Romeo's face remains in frame by reviewing the cropped image in preview; if not, adjust `object-position` for that specific polaroid (not implemented yet — keep `object-cover` for now, see if it lands well; only add per-polaroid `object-position` if needed).
- **VALIDATE**:
  ```bash
  grep -n 'variant="stamped"\|variant="back"' src/components/sections/DayNNight/Immersive/Timeline.tsx   # → 7 matches (5 stamped + 2 back)
  # Preview: all Dress polaroids show framed; 2 unlabeled back cards float behind.
  ```

#### Task 2.6: Cookout + Night polaroids — keep as `clean` for now
- **ACTION**: No edit. Cookout and Night polaroids stay at `variant="clean"` (the default). They've already been unified to one caption style via Phase 1.
- **JUSTIFICATION**: Phase 2 scope is the Dress refresh + the underlying variant system. Cookout / Night may adopt textured frames later — that's a separate design decision per the design-spec § 10 "What's out of scope (deferred)."
- **VALIDATE**: Cookout polaroids still render with plain white frame + photo + unified caption.

### Phase 2 gate

```bash
pnpm tsc --noEmit --pretty false 2>&1 | tail -20
pnpm build 2>&1 | tail -10
# Preview: Dress polaroids show mint-tinted frame + doodle; layout still 2-column.
# Decorative back cards visible. No console errors about missing images.
# Cookout + Night polaroids unchanged.
```

ROLLBACK plan: revert `Polaroid.tsx` and the Timeline call-site diffs; SCSS additions are additive and harmless to leave. Phase 1 stays.

---

### Phase 3 — Dress corridor + per-room choreography

#### Task 3.1: Bump act width + introduce corridor wrapper
- **ACTION**: In SCSS, set `.actDress { --act-w: 3.2; }`. The act-track auto-grows via the existing `calc(var(--act-w, 1) * 100vw)` rule. The Timeline `setLayout` re-measures on resize so the Scrubber + handoff math stay accurate.
- **IMPLEMENT**:
  ```scss
  .actDress {
    --act-w: 3.2;  // 1.5 (room 01) + 1.5 (room 02) + 0.2 (eyebrow lead-in)
  }

  .actDress > .actInner {
    // Replace the prior grid with a horizontal flex corridor. The eyebrow
    // sits at the start; the corridor fills the rest.
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .dressCorridor {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    height: 100%;
    width: 100%;
  }

  .dressRoom {
    position: relative;
    flex: 0 0 150vw;          // each room is exactly 150% viewport wide
    height: 100%;
    overflow: visible;        // polaroids drift across room edges
  }

  // Three internal bands (anchor / cluster / read) as absolute positional
  // zones. Polaroids and copy anchor to bands rather than to css grid cells.
  .dressRoomAnchor   { position: absolute; left:  0;        top: 0; bottom: 0; width: 50vw; }
  .dressRoomCluster  { position: absolute; left:  50vw;     top: 0; bottom: 0; width: 50vw; }
  .dressRoomRead     { position: absolute; left:  100vw;    top: 0; bottom: 0; width: 50vw; }
  ```
- **GOTCHA**: `.actInner` previously used `display: grid` for Dress. The `display: flex; flex-direction: column` change above puts the eyebrow above the corridor — only Dress uses this shape; other acts' `.actInner` are unaffected (Dress has its own `> .actInner` selector). Double-check the cascade order.
- **VALIDATE**:
  ```bash
  # Inspect via preview eval:
  document.querySelector('[class*="actDress"]').getBoundingClientRect().width
  # Expected: ~3.2 * viewport.width
  ```

#### Task 3.2: `<DressRoom>` component
- **ACTION**: Create `src/components/sections/DayNNight/Immersive/DressRoom.tsx`. Encapsulates the 3-band JSX + a GSAP ScrollTrigger child timeline.
- **IMPLEMENT**:
  ```tsx
  "use client";

  import { useEffect, useRef, type ReactNode } from "react";
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  import * as m from "motion/react-m";
  import s from "../styles.module.scss";

  interface DressRoomProps {
    /** "01" or "02". Drives marker text + a data attribute hook. */
    number: string;
    heading: string;
    body: string;
    /** Polaroid scatter — rendered inside the Cluster band. */
    children: ReactNode;
  }

  export function DressRoom({ number, heading, body, children }: DressRoomProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const heading = el.querySelector<HTMLElement>("[data-role='heading']");
      const body    = el.querySelector<HTMLElement>("[data-role='body']");
      const polaroids = el.querySelectorAll<HTMLElement>("[data-role='polaroid']");
      if (!heading || !body) return;

      // Per-room horizontal-scroll-driven timeline. The room itself is
      // 150vw wide; ScrollTrigger measures the room's horizontal travel
      // against the viewport and gates the keyframes by progress.
      const ctx = gsap.context(() => {
        gsap.set(heading,   { opacity: 0, y: 32 });
        gsap.set(body,      { opacity: 0, y: 24 });
        gsap.set(polaroids, { opacity: 0, x: 80 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start:  "left 90%",     // when the room enters from the right
            end:    "right 10%",    // when the room exits left
            scrub:  true,
            horizontal: true        // <-- critical for horizontal-pinned tracks
          }
        });
        // 0.00 → 0.15 — heading anchor reveals
        tl.to(heading, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0);
        // 0.20 → 0.55 — polaroid cascade (staggered)
        tl.to(polaroids, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out", stagger: 0.08 }, 0.2);
        // 0.55 → 0.85 — body copy reveals
        tl.to(body, { opacity: 1, y: 0, duration: 0.30, ease: "power2.out" }, 0.55);
        // 0.85 → 1.00 — exit fade
        tl.to([heading, body, ...polaroids], { opacity: 0.6, duration: 0.15 }, 0.85);
      }, el);

      return () => ctx.revert();
    }, []);

    return (
      <div ref={ref} className={s.dressRoom} data-room={number}>
        <div className={s.dressRoomAnchor}>
          <div className={s.dressOptionMarker}>
            <span className={s.dressOptionMarkerRule} aria-hidden />
            <span>{number}</span>
          </div>
          <h3 data-role="heading" className={s.dressOptionHeading}>{heading}</h3>
        </div>

        <div className={s.dressRoomCluster}>
          {/* polaroids are placed by JSX (Timeline.tsx) with their own
              absolute positioning relative to the cluster band; each must
              carry data-role="polaroid" so the timeline picks them up */}
          {children}
        </div>

        <div className={s.dressRoomRead}>
          <p data-role="body" className={s.dressOptionBody}>{body}</p>
        </div>
      </div>
    );
  }
  ```
- **MIRROR**:
  - GSAP setup mirrors Timeline.tsx's existing `gsap.context(() => { ... }, scope)` pattern.
  - The `horizontal: true` flag on ScrollTrigger is required because the parent track is pinned and translated horizontally.
- **GOTCHA**: GSAP's `horizontal` ScrollTrigger fires off the parent scroller's horizontal position. Since the Day n Night Timeline is a vertical scroll that's being mapped to horizontal `x` translate on the track, the ScrollTrigger needs to read the **vertical** scroll. **Test this carefully.** Fallback: use `gsap.quickTo` on the timeline driven manually by the store's `progress` (mirror `LoaderReveal` pattern from Reveal.tsx:218-238). If horizontal=true doesn't fire, drive the timeline progress from `useDayNNightScene` directly inside an rAF — same pattern as the polaroid parallax.
- **VALIDATE**: As the user scrolls vertically and the timeline pans, the Dress room reveals heading → polaroids → body in order. Use `preview_eval` to inspect the room's progress.

#### Task 3.3: Wire `<DressRoom>` into Timeline
- **ACTION**: Replace the entire `<RevealStage as="div" className={s.dressColsBespoke}>...</RevealStage>` block in `Timeline.tsx` with two `<DressRoom>` instances inside a `<div className={s.dressCorridor}>`.
- **IMPLEMENT**:
  ```tsx
  <div className={s.dressCorridor}>
    <DressRoom
      number="01"
      heading={t("dressCode.option1.label")}
      body={t("dressCode.option1.body")}
    >
      <Polaroid
        data-role="polaroid"
        variant="stamped" overlay="card-2_front-clear"
        src="/assets/day-n-night/DraggedImage-1.png"
        alt={t("moodboard.dress.romeo.alt")} caption={t("moodboard.dress.romeo.caption")}
        width={260} angle={-4} depth={0.4} anchor={ANCHOR_DRESS}
      />
      <Polaroid
        data-role="polaroid"
        variant="stamped" overlay="card-4_front-clear"
        src="/assets/day-n-night/DraggedImage-2.png"
        alt={t("moodboard.dress.pink.alt")} caption={t("moodboard.dress.pink.caption")}
        width={240} angle={3} depth={-0.5} anchor={ANCHOR_DRESS}
      />
      <Polaroid
        data-role="polaroid"
        variant="back" backTexture="card-2_back"
        width={220} angle={-7} depth={0.6} anchor={ANCHOR_DRESS}
      />
    </DressRoom>

    <DressRoom number="02"
      heading={t("dressCode.option2.label")}
      body={t("dressCode.option2.body")}
    >
      {/* 3 stamped + 1 back, same shape */}
    </DressRoom>
  </div>
  ```
- **MIRROR**: Existing Dress polaroid prop shape; only mutate `variant`, `overlay`, `width`. Keep `anchor={ANCHOR_DRESS}` everywhere.
- **GOTCHA**: `<Polaroid>` is a `forwardRef`-less component — `data-role="polaroid"` won't pass through unless we add it. Two options: (a) wrap each `<Polaroid>` in a `<div data-role="polaroid">` (cheap), or (b) thread `data-role` through `<Polaroid>` props. Recommend (a) — keeps Polaroid surface clean.
- **VALIDATE**: Visual + `preview_eval`:
  ```js
  document.querySelectorAll('[class*="dressRoom"]').length  // → 2
  document.querySelectorAll('[data-role="polaroid"]').length  // → 7 (3 in room 01, 4 in room 02 — adjust as built)
  ```

#### Task 3.4: New SCSS — option marker / heading / body
- **ACTION**: Add to `styles.module.scss`:
  ```scss
  .dressOptionMarker {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 14px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--dn-fg-faint);
  }
  .dressOptionMarkerRule {
    display: inline-block;
    width: 56px;
    height: 1px;
    background: var(--dn-fg);
    opacity: 0.55;
  }
  .dressOptionHeading {
    font-family: var(--font-serif, "Adobe Caslon Pro", serif);
    font-weight: 700;
    font-size: clamp(40px, 5.4vw, 80px);
    line-height: 0.98;
    letter-spacing: -0.022em;
    color: var(--dn-fg);
    max-width: 18ch;
  }
  .dressOptionBody {
    font-size: clamp(22px, 2vw, 28px);
    line-height: 1.5;
    font-weight: 400;
    color: var(--dn-fg-mute);
    max-width: 38ch;
  }
  ```
- **VALIDATE**: Preview shows headings at 40-80px, bodies at 22-28px. Both larger than the deleted `.dressColHeading` / `.dressColBody`.

#### Task 3.5: Delete obsolete Dress SCSS
- **ACTION**: After Phase 3 wiring is green in preview, delete the following classes:
  - `.dressColsBespoke`, `.dressColBespoke`, `.dressColLabel`, `.dressColHeading`, `.dressColBody`, `.dressDivider`, `.dressColMoodboard`, `.dressIntro`, `.dressIntroWrap` (the latter two may already be gone from Phase 1).
- **VALIDATE**: `grep -rn "dressCol\|dressIntro\|dressDivider\|dressColMoodboard" src/` → no matches.

#### Task 3.6: Reduced-motion fallback
- **ACTION**: Inside `<DressRoom>`'s `useEffect`, gate the GSAP timeline on `matchMedia("(prefers-reduced-motion: reduce)")`. When reduced motion is on, skip the timeline and immediately set heading/body/polaroids to opacity 1 + y 0 + x 0.
- **IMPLEMENT**:
  ```ts
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    gsap.set([heading, body, ...polaroids], { opacity: 1, x: 0, y: 0 });
    return;
  }
  // ... existing timeline ...
  ```
- **VALIDATE**: Browser DevTools → Rendering → Emulate CSS prefers-reduced-motion → check Dress reveals are instant.

### Phase 3 gate

```bash
pnpm tsc --noEmit --pretty false 2>&1 | tail -20
pnpm build 2>&1 | tail -10

# Preview validation (use mcp__Claude_Preview tools):
# 1. /day-n-night immersive view loads
# 2. Loader → playing handoff is unchanged
# 3. Scroll vertically — track translates horizontally as before
# 4. Cookout → Dress transition: act-track widens by ~2vw
# 5. Inside Dress: room 01 reveals heading first, then polaroids, then body
# 6. Room 02 follows the same pattern
# 7. Night announcement is visible ("Something quiet, unannounced...")
# 8. Scrubber labels still align (it reads layout from setLayout)
# 9. Resize → reveals re-fire correctly (ScrollTrigger.refresh handles this)
```

ROLLBACK (Phase 3 only — keeps Phase 1+2 intact):
1. Revert `.actDress { --act-w: 1.1; }`.
2. Revert Timeline.tsx Dress section to the post-Phase-2 form (two `dressColBespoke` columns with stamped polaroids inside).
3. Delete `DressRoom.tsx` and the corridor/room SCSS classes.
4. Restore the deleted `.dressColsBespoke` etc. blocks (consult git diff).
5. Run `pnpm build`; preview should render the Phase-2 Dress (textured polaroids + 2-column grid).

The corridor change is the load-bearing risk — if `ScrollTrigger horizontal: true` doesn't fire inside the parent pinned timeline, fall back to the store-driven rAF reveal pattern (see Task 3.2 GOTCHA).

---

## Testing strategy

### Unit / type-check
- TS strict mode catches caption prop, variant union mismatches.
- No new unit tests required — this is presentational, not logic. Existing tests untouched.

### Manual / preview validation

Per-phase gate already lists this. Additional cross-cutting checks:

| Check | How |
|---|---|
| All 4 PNG assets serve | `curl -I http://localhost:3000/assets/textures/photograph/card-2_front-clear@2x.png` returns 200 |
| Image budget unchanged | The 4 PNGs are ≤140 KB each; total <600 KB added to first scroll into Dress |
| Captions never clip | preview_eval: `Array.from(document.querySelectorAll('[class*="polaroidCaption"]')).every(el => el.scrollHeight <= el.clientHeight)` → true |
| Track width updates | preview_eval: `document.querySelector('[class*="track"]').getBoundingClientRect().width` → matches `(opening + cookout + 3.2 + night + closing) × viewport_width` |
| Scrubber pin still works | Scroll fully through, scrubber dot stays in sync with section centers |
| Loader handoff unchanged | Refresh `/day-n-night`, loader → playing → Opening sky lands at full daytime (sky_palette stop 0.088) — no jump |
| Reduced motion fallback | DevTools emulate reduce-motion, Dress reveals are instant |

### Edge cases checklist

- [ ] User refreshes mid-Dress — ScrollTrigger re-measures, room timelines re-init at correct progress
- [ ] User resizes viewport during Dress — `ScrollTrigger.refresh()` already fires in Timeline's resize handler; per-room timelines re-fire correctly
- [ ] Translation falls back to a missing key — next-intl throws `MISSING_MESSAGE` loudly; CLAUDE.md i18n rule covers this
- [ ] PNG fails to load — NextImage shows broken icon; not catastrophic, but check console for 404s
- [ ] Tap / touch scroll on mobile — track is pinned with `ScrollTrigger`, touch should still drive it. Mobile typically uses Simplified view (lg breakpoint), so Dress corridor is desktop-only experience.

---

## Validation commands

```bash
# Static analysis
pnpm tsc --noEmit --pretty false 2>&1 | tail -20         # zero new errors
pnpm lint --max-warnings 0 src/components/sections/DayNNight 2>&1 | tail -5

# Build
pnpm build 2>&1 | tail -10                                # green

# Asset audit
ls -la public/assets/textures/photograph/                 # 4 PNGs present

# Translation lockstep
diff <(jq '.Event.DayNNight | keys' messages/en.json) <(jq '.Event.DayNNight | keys' messages/ko.json)
# → no diff (mirror in lockstep)

# Preview server (already running)
# Use mcp__Claude_Preview tools per phase gates.
```

---

## Acceptance criteria

The 14 from the design spec + 4 derived from the texture addendum. Each phase covers a subset:

| # | Criterion | Phase |
|---|---|---|
| 1 | Kicker reads "III · One rule: Don't dress your age." | 1 |
| 2 | No intro paragraph in Dress | 1 |
| 3 | All polaroid captions unified (serif normal, no clipping, no marker) | 1 |
| 4 | Polaroids visually larger (≥220 px width) | 2 + 3 |
| 5 | Each option room ≥150 vw wide | 3 |
| 6 | Heading reveals before body; body reveals on scroll progress | 3 |
| 7 | "Something quiet, unannounced..." in Night | 1 |
| 8 | Stamped polaroids show mint frame + doodle | 2 |
| 9 | Each room has 1 ambient back card | 2 + 3 |
| 10 | All polaroids 0.76 portrait aspect | 2 |
| 11 | Dress act total width = 3.2 vw | 3 |
| 12 | Reduced-motion users see instant reveals | 3 |
| 13 | Loader → Opening handoff visually unchanged | (regression check, every phase) |
| 14 | Cookout / Night / Closing layouts visually unchanged | (regression check, every phase) |

## Completion checklist

- [ ] Each phase's gate passes before the next starts
- [ ] `pnpm tsc --noEmit` returns no new errors
- [ ] `pnpm build` is green
- [ ] All 4 texture PNGs are referenced and 200-served
- [ ] No `polaroidMarker` / `polaroidSerif` references anywhere in src/
- [ ] No `dressCode.intro` / `secret` references anywhere in src/ or messages/
- [ ] `messages/en.json` and `messages/ko.json` keys are identical (mirror)
- [ ] Scrubber + handoff math still works
- [ ] Reduced-motion preview passes

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `ScrollTrigger horizontal: true` doesn't fire inside the parent pinned track | M | H | Fallback: drive `<DressRoom>` reveals from `useDayNNightScene.getState().progress` in rAF (mirror `LoaderReveal`). Pattern is already in the codebase. |
| Widening Dress to 3.2 vw breaks the Scrubber's center math | L | M | `setLayout` re-measures; Scrubber reads from layout. Verify on resize + after Dress widens. |
| Stamped overlay PNG has non-transparent pixels intruding on photo area | L | M | Inspect via dev preview; if so, adjust the overlay's `object-fit: contain` or layer with `mix-blend-mode: multiply`. Worst case: re-export the overlay PNG with a clean transparent window. |
| Romeo photo (landscape 1.499) crops poorly to 0.76 portrait | M | L | First check visual; if his face cuts off, add `object-position: top` for that single polaroid. Per-photo opt-in, not a system change. |
| ko.json drifts from en.json | L | M | Both files edited in same commit per CLAUDE.md i18n rule; validate via the `diff <(jq …)` check above. |
| `data-role` attributes don't carry through `<Polaroid>` to DOM | L | L | Wrap polaroids in `<div data-role="polaroid">` (Task 3.3 GOTCHA) — already mitigated. |

## Notes

- The texture filename `672a4022c04412b253b0af22_card-2_back@2x.png` retains its CMS-id prefix. Don't rename the asset on disk — the path map handles it. Renaming would un-cache CDN entries unnecessarily.
- After this redesign ships, fold the outcome into `readmes/DAY_N_NIGHT.md` § 6.4 (or the equivalent immersive-view section). This PRP can then be archived or deleted.
- The marker-pen caption voice was charming on small polaroids but didn't earn its keep at this scale. Permanently retiring `font-family: "Permanent Marker"` from this codebase is fine; that font isn't used elsewhere (grep to confirm during Phase 1).
- Confidence for single-pass implementation: **7/10**. The corridor + GSAP per-room timeline is the load-bearing unknown; the rest is mechanical. If Phase 3 stalls at the ScrollTrigger horizontal issue, fall back to the store-driven rAF pattern and accept slightly less precise timing.

---

> Next step: `/feature-dev` to execute Phase 1 first, then 2, then 3 with gates between.
