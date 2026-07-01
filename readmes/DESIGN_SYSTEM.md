# Design System

Status: draft 0.3, meant to stay lean and durable.

This document is a source of truth for future agents, developers, and
designers working on The Hideaway. It should prevent generic output,
accidental inconsistency, arbitrary novelty, and stale precedent from becoming
law.

It is not a complete inventory of the UI. It is the operating logic for making
new UI feel authored by the same intelligence.

## Purpose

Use this before creating or changing visible interface work.

Every design decision should answer:

1. What must remain recognizable?
2. At what scope must it remain consistent?
3. What existing lineage does this belong to?
4. What may vary?
5. What is intentionally different?

If a decision cannot answer those questions, it is not ready to become a
system rule.

## Scope Hygiene

Keep this file durable enough to be useful as initialization context long after
the current implementation has changed.

Do not add:

- historical explanations that future agents do not need,
- detailed one-off page recipes,
- exact class lists unless they are stable technical conventions,
- implementation trivia likely to stale,
- old rejected ideas unless the rejection remains a live guardrail.

Prefer:

- invariants,
- scopes,
- lineage rules,
- force levels,
- review protocols,
- compact classification examples.

When a detail is likely to drift, instruct agents to inspect current code
instead of freezing the detail here.

## Core Philosophy

Consistency should be strongest at the highest and lowest levels of
abstraction, with controlled variation in the middle.

The goal is recognizability across difference, not sameness.

Highest-level consistency is global:

- brand posture,
- narrative philosophy,
- editorial attitude,
- emotional register,
- relationship between content, interface, and audience,
- overall authorship.

Lowest-level consistency is local but strict:

- components,
- layout units,
- surface treatment,
- spacing rhythm,
- typography execution,
- interaction behavior,
- motion behavior,
- states.

The middle may vary. Pages, layouts, content formats, campaign treatments, and
composition strategies may differ when they preserve global identity and keep
their local grammar coherent.

Global concepts require global consistency. Local inventions require local
consistency.

## Three Axes

### 1. Abstraction Level

Name the level of the decision.

High-level decisions usually concern brand, posture, audience relationship,
editorial attitude, and emotional register.

Low-level decisions concern the smallest meaningful unit in the current
problem. That unit may be a button, card, row, scrubber, text block, media
element, section, layout, or page.

Once the meaningful unit is introduced, execute it consistently inside its
boundary.

### 2. Enforcement Scope

Name the radius of the decision.

A rule is incomplete unless it says:

- what remains consistent,
- where it remains consistent,
- where it does not apply.

Reuse should not become overreach.

### 3. Design Lineage

New work is not a blank slate.

Before creating or changing visible UI, decide whether the work is:

1. direct reuse,
2. a variant,
3. an extension of a style family,
4. a deliberate contrast,
5. a new local grammar,
6. a new system-level style.

Variation must be genealogical, not arbitrary.

## Force Levels

Every guideline should declare its force.

### Law

Must be followed unless the user explicitly changes it or the product would be
broken without an exception.

Use for accessibility, localization, technical correctness, routing contracts,
user-stated hard bans, and durable brand boundaries.

Examples:

- User-facing strings live in `messages/*.json`, with locale files updated
  together.
- Motion component imports use `import * as m from "motion/react-m";`.
- Frontend-visible work should be verified in browser when possible.

### Default

The normal starting point. Adapt when the local surface has a better reason.

Example:

- Editorial cards usually use restrained borders, locked media ratios, and
  quiet metadata.

### Preference

A tilt, not a rule. Prefer it when options are otherwise close.

Example:

- Prefer typography and rhythm over colored chrome.

### Experiment

A deliberately unresolved move. Do not generalize it until it repeats
successfully or the user confirms it.

### Observed Precedent

Something that exists in the codebase. It is evidence, not authority.

Do not promote precedent into a default unless it has:

- explicit user approval,
- repeated use across unrelated surfaces,
- a clear product reason,
- or a technical constraint.

### Open Question

Something not yet calibrated. Keep it visible rather than inventing certainty.

## Source Of Truth Order

1. The user's latest explicit instruction.
2. Accepted user feedback on a rendered implementation.
3. Hard project contracts: accessibility, i18n, routing, auth, data safety.
4. This guide.
5. `AGENTS.md` and subsystem readmes.
6. Current code patterns.
7. External references.

External references are vocabulary, not destination.

## Global Invariants

The Hideaway is an editorial platform with the posture of a quiet private
members' club.

The governing tone is:

- sparse,
- intentional,
- typographically confident,
- composed rather than loud,
- discovered rather than advertised.

This does not mean:

- sparse means empty,
- monochrome means lifeless,
- typographic means imageless,
- premium means glossy,
- editorial means old magazine cosplay,
- club-like means ornate hotel nostalgia,
- restraint means every page must be visually quiet,
- one accepted page means every page should copy it.

### Content And Interface

Content should feel held by the interface, not crowded by it.

Editorial and reading surfaces bias toward content-forward hierarchy.
Operational surfaces bias toward clarity and repeat-use efficiency. Campaign
and immersive surfaces may become more atmospheric when atmosphere is part of
the offer.

### Typography

Typography carries hierarchy and identity.

The four type personalities are:

- `font-serif`: theatrical, marketing, hero, and customer-experience moments.
- `font-sans`: working surfaces such as settings, vault, reading UI,
  dashboards, profiles.
- `font-wide`: editorial weight where serif feels too soft.
- `font-mono`: metadata, counts, captions, editorial chrome, code.

Do not mix all four faces on one screen unless there is a visible local reason.

### Color And Surface

Prefer project tokens and opacity before inventing new color.

Readable text must clear the contrast floor. If text is informative, do not
treat it as decorative atmosphere.

Color may become more forceful inside campaign, event, ticket, or product
surfaces, but the force must belong to the local grammar.

### Motion

Motion should stage hierarchy, reinforce action, or create one memorable local
moment. Avoid animation that exists only because it is easy.

Use Motion for UI animation. Use GSAP when the interaction is genuinely
timeline, scroll, or WebGL coordinated.

Component prefix import:

```tsx
import * as m from "motion/react-m";
```

Hook and orchestration imports:

```tsx
import { AnimatePresence, useScroll } from "motion/react";
```

### Interaction

Controls should be legible as controls. A beautiful form that obscures state,
focus, error, or recovery is a failed form.

Use project primitives where they fit:

- `src/components/core/Link/Link.tsx` for app links.
- `src/components/core/Button/index.tsx` for button actions.

Raw `next/link` or native `<button>` belongs only at a narrow integration
boundary or while implementing the primitive itself.

### Type Scale

The standard document font size is `10px`, not the browser default `16px`.
Tailwind text utilities already assume the app scale. When porting external
references, translate visual intent instead of copying raw `rem` values.

## Local Grammars

A local grammar is a bounded visual and interaction system introduced for a
component, section, layout, route, or page.

Local grammars may define:

- type roles,
- spacing rhythm,
- media ratios,
- color behavior,
- surface treatment,
- motion behavior,
- density,
- responsive behavior,
- copy posture.

Local grammars are allowed to differ from the rest of the site. They are not
allowed to be internally careless.

Use the smallest boundary that fully explains the design.

## Style Families

Style families describe lineage. They are not prisons. A surface may combine
families, but the combination must be explicit.

### Editorial / Magazine

Typography-centric, content-forward, composed, literary, restrained,
hierarchy-sensitive.

Use for essays, Surf, archives, article lists, legal/policy reading, and
publication-like surfaces.

Do not use as an excuse to make every page quiet, old-fashioned, or
content-only.

Risks:

- dashboard clutter on essay surfaces,
- too many pills and badges,
- treating "editorial" as nostalgia.

### Glass / Atmospheric Minimalism

Sleek, spatial, layered, blur-aware, depth-oriented, polished.

Use for settings/vault-like operational surfaces, ambient overlays, floating
chrome, and immersive controls when depth clarifies hierarchy.

Do not use blur, transparency, or lifted panels as decoration.

Risks:

- generic glassmorphism,
- weakened contrast,
- applying admin chrome to editorial content.

### Pop / Poster Modernism

Bold, graphic, color-forward, poster-like, punchy, modernist or
brutalism-adjacent.

Use for event, ticket, promotional, and campaign moments where information can
become graphic.

Do not treat this as the default site mode.

Risks:

- cute poster pastiche,
- loudness without hierarchy,
- campaign language leaking globally.

### Campaign / Immersive

Page-local worldbuilding for product, campaign, or launch surfaces. Often
media-led, motion-heavy, WebGL-aware, or custom-interaction-aware.

Use when the experience is part of the offer.

Do not generalize campaign behavior into core navigation, settings, legal, or
normal editorial components.

Risks:

- spectacle hiding broken layout,
- poor mobile interaction,
- uncleared body/document side effects.

### Formal Artifact / Receipt

Printed or printable brand documents: invoices, receipts, certificates,
membership artifacts, order confirmations, and similar records.

Use when the interface becomes an object of record rather than an app screen.
Lineage may reference Cartier-like receipt typography: centered brand ritual,
wide margins, sparse unruled tables, precise metadata, and restrained legal
copy.

Rules:

- Treat the document as a formal artifact, not an admin table.
- Prefer typography, tabular alignment, whitespace, and one or two hairlines
  over boxes, cards, pills, or grid chrome.
- Header and footer may repeat across pages; page identity should be minimal
  and archival, such as `2 / 3`, not loud navigation.
- Totals belong after the final line item, even when line items continue onto
  later pages.
- Preallocated empty rows are only a fillable-template affordance. Finalized
  generated artifacts must render only actual purchase/payment rows, then pull
  totals, terms, payment details, and footer-adjacent content up accordingly.
- Metadata is conditional. Service periods belong to services and memberships,
  not physical SKU orders.
- Payment records should include enough receipt evidence to stand alone:
  method, amount, date, and reference where available.

Risks:

- importing dashboard density into a document,
- making the artifact too decorative to audit,
- copying luxury references as ornament rather than using their restraint,
- letting legal copy overwhelm the receipt hierarchy.

## Component Lineage Protocol

Run this before generating or modifying visible UI.

1. Identify the functional role.
2. Search for existing components or patterns with a similar role.
3. Decide the lineage: reuse, variant, extension, deliberate contrast, local
   invention, or system-level style.
4. Select the relevant style family.
5. Compare against precedent: typography, spacing, layout, color, surface,
   texture, motion, interaction, hierarchy, density, tone, visual weight.
6. Decide whether alignment or difference is intended.
7. Declare the enforcement boundary.
8. Enforce local consistency inside that boundary.
9. Avoid accidental novelty.

If similar work exists and the new work differs, name the difference:

- functional,
- narrative,
- spatial,
- editorial,
- expressive,
- technical,
- responsive/adaptive.

Do not introduce a new visual language merely because the prompt is new.

## Reuse Vs Variation

Reuse when the functional role, surface, density, and interaction model are the
same.

Create a variant when the role is similar but the context changes.

Extend a family when the work has the same ancestry but needs a new shape.

Use deliberate contrast when difference has a job.

Introduce a new local grammar only when existing families cannot serve the
narrative, interaction, or spatial need.

Introduce a new system-level style only when it solves a recurring need across
multiple surfaces or the user explicitly confirms it.

## Enforcement Boundaries

### Global

Brand posture, accessibility, localization, technical conventions, durable
interaction principles.

Strictness: high.

### Surface-Level

A class of surfaces such as editorial, settings/vault, commerce, campaign,
tickets, or legal.

Strictness: high inside that surface, adaptable elsewhere.

### Page-Level

One route or campaign page.

Strictness: high on that page. Do not export globally without promotion.

### Layout-Level

A layout structure such as a rail/content split, bento grid, archive, checkout
flow, or reader shell.

Strictness: medium-high.

### Section-Level

A hero, facts block, product grid, rail, footer, or CTA band.

Strictness: high inside the section.

### Component-Level

A reusable component and its variants.

Strictness: high for API, states, motion, spacing, and interaction behavior.

### State-Level

Hover, focus, active, loading, error, expanded, checked-in, disabled, and
transitional states.

Strictness: high. State inconsistency is directly felt.

### One-Off Exception

A named exception only.

Strictness: high inside itself, low outside itself. Record it as an experiment
or accidental precedent if future agents might overread it.

## Weighting

Highest weight:

- clarity of task and reading flow,
- accessibility, contrast, focus, touch targets,
- localization and copy accuracy,
- surface fit,
- browser-verified reality over CSS intention.

High weight:

- typography,
- composition,
- mobile ergonomics,
- performance on media, WebGL, animation, and scroll surfaces,
- declared lineage and scope.

Medium weight:

- color restraint,
- border, radius, shadow, and surface treatment,
- motion as staging and feedback,
- reuse of existing primitives and patterns.

Lower weight:

- matching a prior one-off exactly,
- preserving a decorative flourish,
- novelty for its own sake,
- symmetry when hierarchy wants another shape.

## Mobile

Mobile is not a smaller desktop. Review it as a distinct interaction model.

Always assess:

- real estate,
- aspect,
- access of interaction,
- tactile behavior.

## Review Checklist

Before finalizing visible design, answer:

- What style family does this belong to?
- Does similar work already exist?
- Is this reuse, variant, extension, deliberate contrast, local invention, or
  new system-level style?
- What is the enforcement boundary?
- What remains consistent globally?
- What remains consistent locally?
- What is intentionally different?
- What would make this feel orphaned?
- Does this preserve recognizability across difference?
- Is the novelty functional, narrative, spatial, editorial, expressive,
  technical, or responsive/adaptive?
- Have motion, spacing, and state behavior stayed consistent inside the
  boundary?
- Has the rendered result been checked in browser when frontend-visible?

## Agent Instructions

- Do not treat each prompt as a blank-slate design request.
- Check existing components and patterns before creating new ones.
- Preserve global identity.
- Enforce local coherence.
- Declare style lineage.
- Declare enforcement scope.
- Prefer reuse when the same functional role already exists.
- Prefer variants when function is similar but context differs.
- Introduce new styles only when existing families cannot serve the purpose or
  the user explicitly asks for a new local world.
- Avoid generic UI defaults.
- Avoid arbitrary novelty.
- Avoid flattening the whole site into a single uniform style.
- Do not promote page-local experiments into global rules without evidence.
- When the user says a design feels wrong, reconstruct the intent, inspect the
  rendered surface, and adjust the rule if the rule caused the miss.

## Anti-Patterns

Avoid:

- generic SaaS aesthetic,
- unexplained one-off components,
- treating every component as a new attempt,
- applying local styles globally without intent,
- mixing style families without declared lineage,
- inconsistent motion within the same component,
- inconsistent spacing within the same local grammar,
- reusing components where the narrative role has changed,
- creating variants without explaining why the existing component is
  insufficient,
- over-systematizing the middle layers until the site loses expressive range,
- copying an external reference as a complete identity,
- using style-family labels as excuses for weak execution.

## Classification Examples

Examples teach the protocol; they are not frozen recipes.

- Editorial hero: extension of editorial / magazine family at section scope.
- Settings control group: variant inside glass / atmospheric family at surface
  scope.
- Ticket artifact: component-local grammar inside pop / poster family.
- Campaign storefront: page-local immersive grammar without global promotion.

## Design Decision Template

Use this shape when adding or revising guidance:

```md
### [Decision Name]

Force: Law | Default | Preference | Experiment | Observed precedent | Open question
Scope: global | surface | page | layout | section | component | state | one-off
Style family: editorial | glass | pop | campaign | other
Lineage: reuse | variant | extension | deliberate contrast | local invention | system-level style
Evidence: user-stated | accepted implementation | production pattern | technical constraint | external reference
Last reviewed: YYYY-MM-DD

Intent:
[What user/product/design goal this protects.]

Guidance:
[Rule or preference in plain language.]

This does not mean:
[Likely misreadings.]

Break when:
[Conditions where a better local answer wins.]
```

## Promotion And Demotion

Promote a pattern only when at least one is true:

- the user explicitly names it as desired,
- it succeeds across multiple unrelated surfaces,
- it solves a recurring product problem,
- it protects accessibility, localization, or technical correctness.

Demote a pattern when:

- the user pushes back on it,
- it was copied from a one-off page without reason,
- it makes a different surface worse,
- it turns a weak preference into a fight.

When revising, replace the old principle rather than stacking contradictory
rules.

## Accidental Precedents

Use this section only for live risks that future agents are likely to overread.

Current entries:

- None recorded.

## Open Questions

- Which campaign or immersive pages deserve their own local visual worlds?
- Where is the boundary between editorial sparsity and product discoverability?
- Is "pop / poster modernism" the right family name, or should the project
  split event-poster work from harder neo-brutalist UI?
