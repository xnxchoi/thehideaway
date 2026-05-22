# Day n Night One-Sheet System

Date: 2026-05-23
Scope: practical mode inside `/day-n-night`
Status: working direction

## Purpose

`Essentials` should not feel like a collapsed app drawer.

It should feel like the official one-sheet for the night:

- immediate
- legible
- culturally authored
- dense with information
- still visually charged

This is the practical counterpart to story mode.

Story mode says:

- this is how the night feels

One-sheet mode says:

- this is the night in one page

## Core idea

One-sheet mode is a single-page composition inside the shared event frame.

It is not:

- a utility sidebar
- a floating modal pretending to be a summary
- a second route with unrelated layout logic

It is:

- one full composition
- one strong typographic system
- one hero idea
- one tightly controlled information hierarchy

## Visual thesis

The reference logic is closer to:

- title sequence graphics
- film one-sheets
- record sleeves
- cultural-event flyers with real typographic authority

It is not nostalgia for its own sake.

What we borrow:

- oversized type as image
- dense metadata that still scans quickly
- limited but forceful colour
- composition that treats information as part of the poster, not as a support panel

## Tone

The one-sheet should feel:

- nocturnal
- urban
- composed
- slightly dangerous
- exact, not noisy

It should not feel:

- cute
- scrapbooked
- faux-vintage
- over-textured
- SaaS clean

## Layout anatomy

The page should read in five zones.

### 1. Masthead strip

Purpose:

- orient the user
- establish event identity
- preserve continuity with the shared frame

Contents:

- back / home affordance
- event slug or section marker
- mode label

Visual rule:

- low height
- mono or narrow sans
- quiet compared with the title block

### 2. Hero field

Purpose:

- carry the poster impact
- make the page readable from a distance

Contents:

- `Day n Night`
- one short proposition line
- possibly one abstract sun / eclipse / horizon mark

Visual rule:

- title should be able to dominate the page by itself
- no decorative image should outrank the headline

### 3. Essential facts grid

Purpose:

- answer the customer's first six questions immediately

Contents:

- day window
- night window
- location
- entry
- invite-only note

Visual rule:

- tight grid
- no card UI
- should feel like billing metadata, not dashboard widgets

### 4. Night promise block

Purpose:

- preserve desire, not just logistics

Contents:

- what the night becomes after dark
- host / DJ / social promise

Visual rule:

- one strong paragraph or one short sequence of lines
- this is the emotional payload of practical mode

### 5. Reserve rail

Purpose:

- close the loop cleanly

Contents:

- reserve CTA
- invite-code expectation
- deadline / capacity line
- contact

Visual rule:

- should feel final and decisive
- operational text must be clear, not poetic

## Typography system

Use the project's existing families deliberately.

### Hero title

Role:

- primary image

Recommended:

- `font-serif` or `font-wide`
- extremely large
- tight tracking
- high contrast

Rule:

- hero type may be more expressive than functional, but must still read instantly

### Section labels / metadata keys

Role:

- orientation
- scanning

Recommended:

- `font-mono`
- uppercase
- small
- wide tracking

Rule:

- labels should never compete with values

### Primary factual values

Role:

- answer-bearing text

Recommended:

- `font-serif` for event-defining values
- `font-sans` for dense operational text if clarity needs it

Rule:

- values must look more important than labels

### Operational microcopy

Role:

- gate explanation
- reserve instruction
- deadlines

Recommended:

- `font-sans`
- sentence case
- clearer and less stylized than the hero system

Rule:

- when a line instructs, clarity wins over atmosphere

## Colour system

The practical mode should not inherit a generic monochrome dark theme.

It needs a poster palette with one dominant ground and one signal colour.

### Ground

- near-black with warmth, not blue-black
- should feel like ink, not app chrome

### Main foreground

- warm off-white
- readable at small sizes

### Accent

Choose one main accent that can appear in:

- CTA emphasis
- rules / dividers
- one typographic gesture
- one symbolic motif

Candidate accent directions:

- sodium amber
- acidic chartreuse
- electric cyan

Rule:

- choose one dominant accent, two at most
- if two are used, one must clearly lead

## Information density rules

Practical mode should be information-rich, but not busy.

Rules:

- use modules, not cards
- use alignment, type scale, and spacing to structure information
- avoid repeated headings that restate the obvious
- keep copy tight enough that the poster still breathes

Good density:

- a lot to read
- obvious where to start
- obvious what matters most

Bad density:

- everything boxed
- every fact treated as a separate component
- too much empty space between logically related facts

## Motion and transitions

The transition from loader into one-sheet mode should feel intentional.

Desired behavior:

- loader resolves
- event frame remains stable
- practical composition settles in quickly
- no heavy cinematic setup should mount if the user chose `Essentials`

Motion language:

- brisk
- confident
- less theatrical than story mode

## Copy structure for one-sheet mode

The one-sheet should be able to stand on this content set alone:

- title
- one-line premise
- day window
- night window
- place
- entry
- invite-only note
- after-dark promise
- hosts / YM.FM
- reserve CTA
- reserve helper line
- contact / late-arrival / plus-one

If more content is needed than this, it should be earned, not automatically added.

## Relationship to story mode

Story mode and one-sheet mode should not contradict each other.

Story mode can expand.
One-sheet mode must distill.

That means:

- same facts
- different density
- different emotional tempo

Story mode:

- gradual
- atmospheric
- sequenced

One-sheet mode:

- immediate
- composed
- decisive

## Implementation implications

- keep one shared outer frame
- swap inner payload by mode
- practical mode should not mount immersive-only systems
- practical mode should have its own layout component, not be a drawer stretched beyond its natural use
- if a drawer remains, it should be secondary inside story mode, not the definition of practical mode

## Standard to judge against

The one-sheet is successful when:

- it looks like a piece someone would screenshot and keep
- a first-time invited guest can understand the event in under ten seconds
- a returning guest can get every operational detail without entering story mode
- it feels authored, not summarized
