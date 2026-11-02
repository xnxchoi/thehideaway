# Settings source inventory

Date: 2026-09-10. Scope: current `/me/settings` layout, spacing, typography, surfaces, and component ownership. Product files were read only. The sole pre-existing tracked modification was `readmes/ECOMMERCE.md`; it was untouched.

This inventory separates source observations, derived geometry, and visible evidence. It does not establish fidelity to Fey or claim browser-tested interaction quality. Line pointers describe the inspected snapshot and may move after implementation.

## Evidence and confidence

- **Source-observed:** classes, layout rules, documentation, and component composition cited below.
- **Derived:** dimensions calculated from the 10px root and ordinary Tailwind spacing/container defaults. Confirm against computed browser styles before treating them as measured dimensions.
- **Visually observed:** `current/security.png`, captured by the parent agent and opened by this inventory agent, shows the Two-factor panel stretching to the height of a neighboring ten-session panel. Its empty lower area is substantial. The rail is Korean while the pane title and content are English. The screenshot is 1530 × 990 pixels; capture viewport/density metadata belongs to the parent capture record. No Fey source was opened by this inventory agent.
- Memory search yielded no relevant prior facts used in these conclusions.

## Preserve: Hideaway boundaries

| Boundary | Source | Design consequence |
|---|---|---|
| Sparse, typographically confident, restrained; sparse does not mean empty | `readmes/DESIGN_SYSTEM.md:200–223` | Improve task hierarchy and density rather than adding decorative containment. |
| Sans on working surfaces; established type personalities | `readmes/DESIGN_SYSTEM.md:225–237`; `src/styles/globals.css:1035–1040` | Settings uses SUIT. Calibrate optical size, weight, and leading without replacing identity. |
| Existing warm neutral palette and token/opacity hierarchy | `readmes/DESIGN_SYSTEM.md:239–247`; `src/styles/globals.css:401–411` | Keep the off-white/warm dark spine; do not import Fey hex colors as a second palette. |
| Legible controls, state, focus, error and recovery | `readmes/DESIGN_SYSTEM.md:269–280` | Quiet styling must not hide editability or shrink useful hit areas. |
| Compact, neutral, factual copy; bilingual parity | `readmes/VOICE.md` | Visual direction does not authorize invented promises, branded explanations, or English-only additions. |
| Accepted settings transition and navigation | `src/components/UX/Settings/SettingsRail.tsx:90–110`; `SettingsPane.tsx:19–105`; `readmes/SETTINGS.md:26–47` | Preserve pending click intent, `next/link` with `scroll={false}`, SHELL, outgoing retention, fade and no y motion. Preserve page-level RPage and async pages without page-level Suspense. |
| Existing auth boundaries | User handoff | Do not modify AuthShell, auth lab, social-provider scope, or LOSTINSEOUL sign-in as a side effect of settings work. |

The design guide explicitly classifies code as observed precedent, not authority (`readmes/DESIGN_SYSTEM.md:173–198`). Experiments should not become rules without successful use or user acceptance (`:168–182`).

## Component inventory and layout issues

### 1. Shell width changes discontinuously

Source: `src/app/(frontend)/(site)/(auth)/me/settings/layout.tsx:52`; `src/styles/globals.css:106–107,195`.

The shell uses `max-w-7xl` until `2xl:max-w-[1440px]`. Root font size is 62.5%, or 10px under normal browser defaults. Standard Tailwind `max-w-7xl` is 80rem, therefore an 800px cap here. Project breakpoints are xl=1280px and 2xl=1440px, not Tailwind's usual 1536px 2xl.

Derived dimensions, not browser measurements:

- At 1280–1439px viewport: 800px shell minus 50px horizontal padding, 224px rail, and 20px gap leaves about 506px pane.
- At 1440px: 1440px shell minus 60px horizontal padding, 224px rail, and 25px gap leaves about 1131px pane.
- `PanelBento` simultaneously switches to two columns, approximately 558px each after its 15px gap.

This can account for a narrow laptop composition suddenly becoming a broad desktop grid. Define usable content width deliberately rather than inferring intent from the `7xl` name. Confirm computed width at 1279, 1280, 1439, 1440, and 1600px.

### 2. Rail and working controls use different optical scales

Source: `src/components/UX/Settings/SettingsRail.tsx:102–124`; `fields/FieldRow.tsx:70–72`; `src/styles/globals.css:61–68`.

The rail uses `px-6 py-6 gap-9`, a `size-14` tile, and a hardcoded 35px glyph. At the 10px root this implies a 35px tile and approximately 65px row. Rail text-base is 14px; field text-sm is 12px and helper text-xs 10px. The Security capture visibly reinforces the large navigation versus small controls relationship.

Reconsider tile/glyph/padding ratios while preserving the accepted moving active pill and click behavior. The rail's fixed 224px width is an implementation choice, not a global identity boundary.

### 3. Repeated containment needs a functional rationale

Source: `src/components/UX/Settings/Panel.tsx:32–49`; `fields/FieldRow.tsx:49–54`.

Every panel receives tint, gradient top hairline, rounded corners, and shadow. Every field row repeats tint and a gradient hairline. This is a reusable implementation, but not evidence that every setting benefits from both layers. Decide whether containment belongs around a task, group, or row instead of automatically using all levels.

### 4. PanelBento is ordinary CSS grid, not independent-height packing

Source: `src/components/UX/Settings/Panel.tsx:61–69,83–84`.

The comment claims neighboring panels stay at natural heights. The implementation uses ordinary two-column grid with `grid-auto-rows:min-content`; default grid-item stretch still shares row height between neighbors. `current/security.png` confirms this visibly: the one-action Two-factor panel stretches to match the ten-session list.

Related unequal-content pairs exist in Profile (`src/app/(frontend)/(site)/(auth)/me/settings/profile/page.client.tsx:34–92`) and General (`general/page.client.tsx:46–65`). Determine grouping by content and task before selecting columns. An `items-start` change alone would stop stretch, but would not necessarily solve empty composition or ordering; assess the full layout first.

### 5. Vertical clearance protects persistent chrome

Source: settings `layout.tsx:52–53`; `readmes/SETTINGS.md:29–31`; chrome owner `src/components/Shells/FXFrame/index.tsx`.

The layout deliberately reserves 140px vertical padding below xl and 180px at xl+, with rail top 180px and max-height `100vh - 360px`. This avoids FXFrame frost. Do not reduce those values without measuring chrome occlusion and the usable viewport. A shared clearance model can improve alignment while preserving access to first/last controls.

### 6. Page and panel rhythms are not expressed as roles

Sources: General/Profile/Account/Security top-level page wrappers; `notifications/page.tsx:22`; hub `page.client.tsx:76`; `Panel.tsx:120,227`.

- General/Profile/Account/Security title-to-content gap: `gap-8`, derived 20px.
- Notifications: `gap-6`, derived 15px.
- Hub: `gap-10 xl:gap-12`, derived 25/30px.
- PanelGrid padding: `p-6 xl:p-8 2xl:p-9`, derived 15/20/22.5px.
- Panel heading-to-controls gap: `gap-6 xl:gap-7`, derived 15/17.5px.
- PanelControls row gap: `gap-1`, derived 2.5px.

Name local spacing roles—title-to-content, group-to-group, heading-to-row, row inset, label-to-value and control separation—and allow deviations only for content reasons.

### 7. Long values can claim the row

Source: `src/components/UX/Settings/fields/FieldRow.tsx:62–85`.

The label side is `min-w-0`; the trailing slot is `shrink-0`. Emails, links, translated control text, and active editing can crowd labels. Browser-test long, empty, editing and error values at the actual narrow pane width before setting label/control tracks. Stacked long-form fields already exist as an explicit alignment mode and should remain available.

### 8. Hit areas require measured review

Source-derived values at the 10px root:

| Control | Source | Derived optical box |
|---|---|---|
| Switch | `fields/ToggleField.tsx:83` | `h-5 w-9` = 12.5 × 22.5px |
| Save/cancel | `fields/EditableField.tsx:259,276` | `size-7` = 17.5px square |
| Choice button | `fields/ToggleField.tsx:213` | 10px text, 3.75px vertical padding |
| Action button | `fields/ActionField.tsx:108` | 10px text, 3.75px vertical padding |

Check computed sizes, inherited primitive styling and target-spacing exceptions before classifying accessibility failures. Larger hit boxes can coexist with restrained optical controls. Review focus visibility independently of pointer hover.

## Demote: inherited benchmark experiments

| Existing direction | Evidence | Treatment |
|---|---|---|
| Description-left/controls-right on every panel | `.claude/skills/admin-fey-surfaces/SKILL.md:34` | Stale: actual PanelGrid is vertical (`Panel.tsx:101–120`). Do not restore it as a rule. |
| Every row must be a pill, never dividers | Same skill `:35` | Re-evaluate against task grouping and actual Fey evidence. Not Hideaway identity. |
| Five colored category tiles | Same skill `:36–42`; duplicated `SettingsRail.tsx:57–64` and `SectionLink.tsx:26–35` | Retain only if useful as navigation identity; use shared ownership if retained. |
| Near-black L8–10 canvas | Same skill `:31` | Conflicts with actual warm-gray L22 token (`globals.css:411,794`). Resolve locally; do not darken the global theme silently. |
| Apple/macOS/iOS recipe comments | Rail, PanelGrid and hub comments | Provenance only. They are not Fey source evidence or mandatory local rules. |
| Plaque/lanyard status object | Same skill `:45`; `readmes/SETTINGS.md` open work | Not started and not needed to solve settings spacing. Do not add it. |
| Legacy settings SCSS | `src/styles/__settings.scss:1–67` | Targets older profile/password conventions. Verify active consumers before reusing; do not promote as grammar. |

## Reuse ownership

Prefer central geometry changes in existing primitives when their semantics fit:

- Shell/chrome clearance: settings `layout.tsx`, coordinated with FXFrame measurements.
- Navigation: `SettingsRail.tsx`; keep behavioral code untouched unless separately authorized by a reproduced defect.
- Panel/task grouping: `Panel.tsx` (`Panel`, `PanelGrid`, `PanelBento`, `PanelHeader`, `PanelControls`).
- Field layout: `fields/FieldRow.tsx`; field state owners remain `EditableField`, `EditableLink`, `EditableLocation`, `LockedField`, `ToggleField`/`ChoiceField`, and `ActionField`.
- Hub navigation: `SectionLink.tsx`; existing category classes overlap with the rail.
- Page title: `SubRouteHeader.tsx:51–81`; current title sizes derive to 24/32/36px at base/xl/2xl.

Several rows bypass FieldRow: Security sessions/providers/passkeys (`security/page.client.tsx:347,422,479`), General reduced-motion status (`general/page.client.tsx:128`), Notifications (`notifications/page.tsx:42–69`), and Account billing rows (`account/page.client.tsx:152–187`). Inventory them before declaring system consistency. Reuse must preserve their specific interaction, loading, empty, error and destructive states.

## Existing copy and API debt affecting layout

Profile (`profile/page.client.tsx:29–87`), Account (`account/page.client.tsx:69` onward), Security (`security/page.client.tsx:69` onward), and hub contain hardcoded English. The Security capture shows a Korean rail with English pane content. General (`general/page.client.tsx:39`) is the current translation-based pattern.

`PanelHeader` still exposes `eyebrow` and `blurb` (`Panel.tsx:151–179`), and SubRouteHeader exposes `blurb`. These are legacy API names, not conventions to copy. Migrate safely within touched ownership if implementation reaches them. Do not let styling introduce more hardcoded text or invented descriptions.

## Acceptance checks before implementation is called complete

1. Capture shell at 1279, 1280, 1439, 1440 and 1600px plus narrow mobile. Record computed root size, shell width, rail width, pane width, gaps, and available height.
2. Match title baselines, control alignment, and group spacing across General, Profile, Account, Security and Notifications; allow content-driven differences explicitly.
3. Check Security with one and many sessions; Profile with short/long/empty bio and link; Account with long email/handle. No oversized empty panel merely matching a neighboring list.
4. Test English and Korean content, text zoom, wrapping, full values, and focused/editing/error states. No clipped action controls or label collapse.
5. Check actual pointer/touch target sizes, keyboard focus, and edit affordances; retain cancel/recovery behavior.
6. Verify first and last settings controls clear FXFrame frost and persistent chrome at short viewport heights.
7. Preserve accepted rail/pane synchronization, outgoing fade, incoming ease, no vertical jump, no shell wipe, no page-level skeleton teardown, and in-settings scroll behavior.
8. Compare proposed local grammar against real Fey references with explicit dates/confidence; classify reference observations separately from Hideaway adaptations.
9. Use a source visual target plus rendered implementation for design QA; this inventory alone is not a fidelity pass.
10. Keep product changes scoped; preserve unrelated `readmes/ECOMMERCE.md`, auth/lab/provider boundaries, global theme, and LOSTINSEOUL.
