# Design System — Drift Audit & Remediation Backlog

> Companion to [`DESIGN_SYSTEM.md`](../../readmes/DESIGN_SYSTEM.md).
> Catalogs where the shipped code drifts from the canonical design system, organized by severity and remediation effort.
>
> **How to read this doc:** each finding has a **F-id** (so agents can cite them in commits and PRs), a **severity**, a **scope** (how many files are affected), a **fix** (proposed resolution), and **evidence** (file:line citations where possible).

**Status:** Iteration 1 — Foundations audit (tokens, color, type, and the highest-severity structural drift). Component/pattern/motion drift is catalogued in later iterations.

---

## Severity legend

| Level | Meaning |
|---|---|
| **🔴 Blocking** | Contradicts a published rule in `DESIGN_SYSTEM.md` or `CLAUDE.md` *and* ships to users. Fix before the next design-led release. |
| **🟠 High** | Causes visible drift or violates a discipline. Fix within the current cleanup pass. |
| **🟡 Medium** | Internal hygiene; users don't notice but agents make worse decisions because of it. |
| **🟢 Low** | Cosmetic, future-looking, or "nice to have." |

---

## 1. Token-layer drift

### F-001 · 🔴 Typography scale has three bugs

**Location:** `src/styles/globals.css` (`@theme` block)

**Problem:**
- `--text-base` and `--text-lg` are both `1.4rem` (duplicate).
- `--text-5xl` (`2.8rem`) is **smaller** than `--text-4xl` (`3.2rem`) — the scale inverts.
- `--text-6xl` (`3.2rem`) duplicates `--text-4xl`.

**Impact:** Any component reaching for `text-5xl` shrinks when upgraded from `text-4xl`. Tailwind utilities generated from the `@theme` block are wrong. Every hero on the site is implicitly broken.

**Fix:** Adopt the canonical scale in `DESIGN_SYSTEM.md` §4.3:

```css
--text-xs:  1.0rem;
--text-sm:  1.2rem;
--text-base:1.4rem;
--text-md:  1.6rem;
--text-lg:  1.8rem;
--text-xl:  2.0rem;
--text-2xl: 2.4rem;
--text-3xl: 3.0rem;
--text-4xl: 3.6rem;
--text-5xl: 4.8rem;
--text-6xl: 6.0rem;
--text-7xl: 7.2rem;
```

Run a follow-up sweep for any component that was visually tuned against the broken scale and may need its class revised.

---

### F-002 · 🟠 Easing tokens have inconsistent naming

**Location:** `src/styles/globals.css` (`@theme` block — easing section)

**Problem:** 13 easing curves are defined with inconsistent capitalization and suffixes: `--ease-Sine` (capital S, outlier), `--ease-in-out-2` (suffixed `-2` with no `-1`), and duplication between `--ease-out` / `--ease-out-power2`.

**Impact:** Agents pick inconsistent easings; visual rhythm across the site is incoherent; naming is unpredictable.

**Fix:** Reduce to **five canonical easings**, documented with the motion section in Iter 2:

```css
--ease-linear:       linear;
--ease-standard:     cubic-bezier(0.4, 0, 0.2, 1);   /* default */
--ease-decelerate:   cubic-bezier(0.16, 1, 0.3, 1);  /* enter */
--ease-accelerate:   cubic-bezier(0.4, 0, 1, 1);     /* exit */
--ease-emphasized:   cubic-bezier(0.2, 0, 0, 1);     /* editorial */
```

Keep old tokens as aliases for one release, then remove.

---

### F-003 · 🔴 No spacing scale

**Location:** `src/styles/globals.css` line ~83 (`--spacing` commented out)

**Problem:** No token-level spacing scale exists. Every component invents its own padding/margin values.

**Impact:** Spacing rhythm is vibes-based. Cards drift from `p-3.5` to `p-4` to `p-5` across the app with no reason. Redesigns have nothing to pivot on.

**Fix:** Define a canonical 4-based scale in Iter 2:

```css
--space-0: 0;
--space-1: 0.4rem;  /*  4px */
--space-2: 0.8rem;  /*  8px */
--space-3: 1.2rem;  /* 12px */
--space-4: 1.6rem;  /* 16px */
--space-5: 2.4rem;  /* 24px */
--space-6: 3.2rem;  /* 32px */
--space-7: 4.8rem;  /* 48px */
--space-8: 6.4rem;  /* 64px */
--space-9: 9.6rem;  /* 96px */
```

Tailwind spacing utilities (`p-*`, `gap-*`, etc.) already follow this rhythm with `1rem=10px`, so the scale formalizes what already half-exists.

---

### F-004 · 🟠 No motion duration scale

**Location:** `globals.css`

**Problem:** Durations are hardcoded per-component (`150ms`, `200ms`, `220ms`, `300ms`, `350ms`, `400ms`, `500ms` all observed in code).

**Fix:** Iter 2 defines:
```css
--dur-instant: 100ms;
--dur-fast:    150ms;
--dur-base:    220ms;
--dur-slow:    350ms;
--dur-crawl:   500ms;
```
Use `--dur-fast` for hover/focus, `--dur-base` for overlays, `--dur-slow` for panels, `--dur-crawl` only for hero reveals.

---

### F-005 · 🟡 No blur scale

**Location:** `globals.css`

**Problem:** Backdrop blurs are ad-hoc (`backdrop-blur-md`, `backdrop-blur-sm`, raw `backdrop-blur-[8px]` in places).

**Fix:** Standardize in Iter 2: `--blur-sm: 4px; --blur-md: 8px; --blur-lg: 16px;` — and forbid arbitrary `backdrop-blur-[…]` in app code.

---

### F-006 · 🔴 Z-index chaos

**Problem:** Z-index values observed across the codebase range from `-2` to `999` with no documented scale. Cursor, Radio, CommandKey, Tour, and Modal all fight for stacking.

**Fix:** Iter 2 publishes the canonical scale:

| Layer | z-index | Example |
|---|---|---|
| Below content | `-1` to `-10` | Decorative backgrounds |
| Base | `0`–`9` | Default content |
| Sticky UI | `10`–`19` | Sticky headers/footers |
| Overlays | `20`–`29` | Dropdowns, popovers |
| Dialogs | `30`–`39` | Modals, sheets |
| Toasts | `40`–`49` | Notifications |
| System | `50`–`59` | Command palette, cursor |
| Debug | `100+` | Dev tools only |

---

### F-007 · 🟡 Legacy `--n-*` nav tokens partially live, partially commented

**Location:** `globals.css`

**Problem:** Nav/chrome tokens `--n-s-*`, `--n-c-*`, `--n-o-*` exist in half-committed state. Some are referenced, most are commented. This is archaeology, not design.

**Fix:** Kill them all — replace the remaining references with Tier 2 semantic tokens + opacity. Iter 3 handles this as part of the component canon.

---

## 2. Color drift

### F-010 · 🟠 Raw `text-gray-*` usage

**Problem:** At least a dozen `text-gray-500`, `text-gray-400`, `text-zinc-*`, `text-neutral-*` calls ship. Every one of these violates the "opacity over grays" discipline (DESIGN_SYSTEM.md §2.2).

**Fix:** Sweep + replace with `text-foreground/70`, `text-muted-foreground/60`, `text-muted-foreground/40` per context. Add an ESLint/stylelint rule that forbids raw Tailwind gray scales in app code (allow them only inside `src/components/ui/` during the shadcn migration window).

---

### F-011 · 🟠 Banned opacity stops (`/50`, `/80`, `/90`) still used on text

**Problem:** Spot-checks show `text-foreground/50`, `text-muted-foreground/50`, `bg-background/80`, `bg-background/90` in use. `/80` and `/90` are legitimate on *surfaces* (sticky header backdrop is explicitly `bg-background/90`), but **banned on text**.

**Fix:** Audit, then replace:
- `text-*\/50` → `/70` or `/60` per intent
- `text-*\/80` → `/100` or `/70`
- `text-*\/90` → `/100`

Leave `bg-*\/80` and `bg-*\/90` alone (surfaces are an allowed exception).

---

### F-012 · 🟠 Rouge used outside permitted contexts

**Problem:** Spot-checks suggest rouge/piercing-orange is used for notification badges and certain hover glows — neither is permitted (DESIGN_SYSTEM.md §3.4).

**Fix:** Iter 3 component canon enumerates every rouge usage and replaces non-permitted ones with `foreground` + opacity (for badges) or border transitions (for hovers). Retain rouge for: selection, focus ring, destructive CTA, editorial emphasis.

---

## 3. Typography drift

### F-020 · 🔴 Forbidden heavy weights in production code

**Problem:** `font-semibold` and `font-bold` appear in dozens of files. This contradicts §4.2 of DESIGN_SYSTEM.md ("Hideaway does not shout").

**Fix:** Bulk replace:
- Card titles: `font-semibold` → `font-medium`
- Labels / headings meant to be prominent: `font-semibold` → `font-light` (at a larger scale, or add `tracking-tight`)
- "Bold emphasis" in prose: use italics or a new `<em>` treatment, not `font-bold`

Add stylelint rule forbidding `font-semibold|bold|extrabold|black` in `src/` except inside `reference/` and `.grave/`.

---

### F-021 · 🟡 Blase and Saint fonts loaded but unused

**Location:** Font loader (likely `src/app/layout.tsx` or equivalent)

**Problem:** Two typefaces ship bytes on every page-load but are never used.

**Fix:** Remove the `next/font` declarations for Blase and Saint. Confirm via build diff that bundle shrinks.

---

### F-022 · 🟡 Hardcoded px type in SCSS (`hideaway.scss`, `reading.scss`)

**Problem:** SCSS modules contain raw px font sizes and hardcoded pixel dimensions that don't reference `--text-*` tokens.

**Fix:** Iter 4 (patterns) — rewrite these files to consume CSS custom properties, or migrate rules into Tailwind layers where practical. The reading surface (`reading.scss`) is the more critical one because Highlightr depends on it.

---

### F-023 · 🟠 No typography wrapper components

**Problem:** Every `<h1>`, `<h2>`, `<p className="text-sm font-medium leading-snug tracking-tight xl:text-base">` is hand-rolled. Six-plus call sites reimplement the canonical card title.

**Fix:** Iter 3 introduces wrappers:

```
src/components/typography/
  Display.tsx          // hero h1
  Heading.tsx          // h2/h3 with variants
  Label.tsx            // mono eyebrow / nav label
  Metadata.tsx         // mono secondary text
  CardTitle.tsx        // the one used in every card
  Prose.tsx            // long-form serif body
```

Each wraps a CLAUDE.md-compliant className. Refactors can adopt these incrementally.

---

## 4. Component drift

### F-030 · 🔴 Two competing button systems

**Problem:**
- `src/components/ui/button.tsx` — shadcn CVA, ships `default` (filled) and `destructive` (filled) variants, `rounded-md`.
- `src/components/core/Button/index.tsx` — Hideaway's own `RP_Btn`, `MotionBtn`, `PillButton`, `MotionPillButton`.

Both are used. They have different APIs, different defaults, different motion semantics, different accessibility stories.

**Fix:** Iter 3 picks one — the pragmatic choice is to **keep shadcn's `button.tsx` as the internal engine** (Radix `<Slot />`, `asChild`, `aria-*`) but:
1. Remove the `default` and `destructive` filled variants.
2. Add `outline` as the default.
3. Keep `ghost` and `link`.
4. Deprecate `core/Button` — migrate consumers, grave the file.

The `MotionBtn` cases that need motion wrap the canonical Button in a `motion.div`; no parallel button system.

---

### F-031 · 🔴 shadcn Card uses `rounded-xl` vs. canonical `rounded-sm`

**Location:** `src/components/ui/card.tsx`

**Problem:** Ships `rounded-xl`; CLAUDE.md (card anatomy) and DESIGN_SYSTEM.md both specify `rounded-sm`.

**Fix:** Patch the component to `rounded-sm`, `border-border/20`, with a `dense` variant that bumps to `p-3.5 xl:p-4`.

---

### F-032 · 🟡 `isPremium` defined in 3 places

**Problem:** Three files each redeclare:
```ts
const isPremium = (role: string) => ["patron","author","editor","admin"].includes(role);
```

**Fix:** Single source of truth in `src/utilities/roles.ts` (or `src/access/`), exported once. Iter 4 does this as part of the layout/role-tiering pattern section.

---

### F-033 · 🟠 No layout container primitive

**Problem:** `mx-auto max-w-7xl px-6 xl:px-10` is reimplemented in at least six places. Narrow variant (`max-w-2xl px-6`) is reimplemented in four.

**Fix:** Iter 4:
```
src/components/layout/
  Container.tsx       // wide (max-w-7xl)
  NarrowContainer.tsx // prose (max-w-2xl)
  FullBleed.tsx       // w-full
```

---

### F-034 · 🟠 Loading / skeleton / error UI essentially absent

**Problem:** The codebase has sparse loading states. Error boundaries are minimal. Skeletons exist for a couple of features only.

**Fix:** Iter 4 publishes canonical:
- `<Skeleton />` — rounded-sm, `bg-muted/40`, animate-pulse
- `<LoadingRow />` — for lists
- `<LoadingHero />` — for content pages
- `<ErrorState />` — `<EmptyState />` sibling with canonical mono eyebrow + retry action
- Global route-level `loading.tsx` and `error.tsx` in `app/(frontend)/`

---

### F-035 · 🟡 Sticky header opacity drift

**Problem:** Canonical sticky header uses `border-border/30`, `z-20`, `bg-background/90`. At least one header file uses `border-border/20`, `z-10`.

**Fix:** Iter 4 pattern canon enforces one sticky header pattern; offending files are adjusted.

---

### F-036 · 🟡 Empty-state pattern inconsistency

**Problem:** Empty states exist (profile, lists, saved) but some use `py-16` instead of canonical `py-24`; some use Lucide icons instead of the canonical mono symbol.

**Fix:** Iter 4 ships `<EmptyState symbol="◫" headline="No saved posts yet" sub="…" cta="Explore essays" />` component; sweep replaces ad-hoc versions.

---

## 5. SCSS / Styling architecture drift

### F-040 · 🟠 `hideaway.scss` is a catch-all

**Problem:** Contains typography overrides, layout overrides, random component overrides. It's legacy and hard to untangle.

**Fix:** Iter 5 does a file-by-file audit: move rules to Tailwind, move the rest into component-scoped CSS modules, delete the remainder.

---

### F-041 · 🟠 `reading.scss` mixes concerns

**Problem:** Essay reading surface depends on this file for type rhythm, highlight classes, and container layout. Highlightr also depends on it. Any edit risks cross-feature breakage.

**Fix:** Iter 4 splits this into:
- `styles/prose.scss` — long-form type only
- `src/components/UX/Highlightr/highlightr.scss` — annotation visuals only
The reading layout container moves into a React `<ReadingContainer />` primitive.

---

## 6. Gaps (not drift — genuinely missing)

### F-050 · Design tokens not exported to JS

**Problem:** Motion values and colors live in CSS. `Motion` / `Framer` components hardcode these values in JS because there's no typed export.

**Fix:** Iter 2: generate `src/styles/tokens.ts` from `globals.css` at build-time (a tiny script) so JS motion code can reference `tokens.duration.base`, `tokens.easing.standard`.

---

### F-051 · No iconography system

**Problem:** The project uses `lucide-react` plus custom SVGs scattered in components. No canonical icon set, sizing scale, or stroke convention.

**Fix:** Iter 5 picks one icon family (Lucide is fine), defines sizing (`14`, `16`, `20`, `24` — no others), defines stroke weight (`1.5` default, `1.25` for small), and wraps it in an `<Icon />` component that enforces these.

---

### F-052 · No microcopy / voice guide

**Problem:** Button labels, empty-state sub-copy, notification text, error messages — all drift in tone. Some formal, some terse, some cute.

**Fix:** Resolved. See **`readmes/VOICE.md`** — the canonical voice and translation guide. It covers English register, the verb set (hospitality vs technical), Korean porting rules, the three-register suffix system, the glossary, and the working procedure for adding new strings. All new copy must pass against §5 of that doc.

---

### F-053 · No accessibility commitments

**Problem:** No published contrast targets, focus-visible checks, reduced-motion policy, or keyboard-navigation minimums.

**Fix:** Iter 5 ships:
- Contrast: WCAG AA on body copy (`text-foreground/70` on background must pass)
- Focus: visible ring on every interactive element (use `--ring`)
- Reduced motion: every Motion animation gates on `useReducedMotion()`
- Keyboard: tour, command-key, dialog, radio must all be keyboard-complete

---

### F-054 · No reference criteria

**Problem:** We import aesthetic inspiration but have no test for whether a reference fits.

**Fix:** Iter 6 ships a one-page rubric:
1. Does it treat type as the primary design element?
2. Does it use a single-charge accent or a full palette? (single-charge passes)
3. Is the interaction design quiet or performative? (quiet passes)
4. Is the hierarchy typographic or chromatic? (typographic passes)
5. Would it survive in monochrome? (if yes, consider; if no, reject)

---

## Remediation roadmap

| Iteration | Findings addressed |
|---|---|
| **Iter 1** (this commit) | F-001, F-003, F-010 (rule), F-011 (rule), F-020 (rule) — all established as rules in DESIGN_SYSTEM.md; code sweeps deferred. |
| **Iter 2** | F-001 (fix scale in `globals.css`), F-002, F-004, F-005, F-006, F-007, F-050. |
| **Iter 3** | F-012, F-023, F-030, F-031, F-032. |
| **Iter 4** | F-022, F-033, F-034, F-035, F-036, F-041. |
| **Iter 5** | F-040, F-051, F-052, F-053. |
| **Iter 6** | F-054 and a final pass. |

Each iteration commits a delta to both `DESIGN_SYSTEM.md` and `DESIGN_SYSTEM_AUDIT.md`; findings flip from `open` to `closed` (with a commit SHA) as remediation ships.

---

## Conventions for contributors

- Cite a finding by its F-id in commit messages: `fix(design): F-001 typography scale (duplicates + inversion)`.
- Closing a finding means: (a) code is updated, (b) this file is updated to mark it closed, (c) `DESIGN_SYSTEM.md` is updated if it referenced the finding.
- **Never silently "fix" a drift without documenting it here** — a single file diff is not a design decision.

---
