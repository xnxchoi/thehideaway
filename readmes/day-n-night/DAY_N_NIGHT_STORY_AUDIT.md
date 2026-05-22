# Day n Night Story Audit

Date: 2026-05-23
Scope: `/day-n-night` and its reserve handoff to `/tickets/day-n-night`
Lens: customer comprehension, copy strategy, information hierarchy, CTA clarity

## Why this exists

The current page is visually ambitious, but the customer story is not yet coherent enough to carry the experience. The implementation currently has multiple valid surfaces:

- immersive story
- details drawer
- simplified card
- ticket gate

The problem is that they do not behave like one narrative told at different densities. They behave like separate interpretations of the same event.

That is why the page can feel unintelligible even when individual components are polished.

## Core diagnosis

### 1. The page asks how to enter before it explains why to care

First visit currently begins with a loader that offers:

- `Enter`
- `Enter without audio`
- `TL;DR`

This is a mode choice before the guest has been given a proposition. A first-time visitor should not have to decide between experience modes before they understand:

- what this event is
- whether they are the intended audience
- why it is worth reserving

### 2. There are three different "quick" paths doing overlapping jobs

Today the page has three low-friction affordances that partly overlap:

- `TL;DR` in the loader
- `Info` in immersive mode
- `Card` in the view toggle

They all reduce complexity, but in different ways:

- `TL;DR` opens practical details
- `Info` opens a detail drawer
- `Card` swaps to a different page mode

That is too much IA for a single question. The user is only asking:

`Can you just tell me what this is and what I need to know?`

### 3. Practical details are over-repeated and under-prioritized

The same logistics recur in multiple places:

- the invitation card in opening
- the details drawer
- the simplified card view
- the closing section
- the Survival Kit block

Repetition is not the issue by itself. The issue is that the repeated block arrives before the event has earned interest, and it appears without a clear hierarchy of:

1. emotional promise
2. social proof / host credibility
3. timeline of the night
4. logistics
5. reserve action

### 4. Too much of the copy is suggestive, not informative

Several lines are atmospheric but thin:

- `Early summer day cookout.`
- `Chill`
- `Cool to the touch...`
- `One thing we made just for the night.`
- `To all we've met, and will meet.`

These lines are not wrong tonally, but they are not doing enough work. They do not answer the customer's actual questions:

- What kind of gathering is this?
- Why should I go?
- What will happen there?
- Who is behind it?
- What makes this different from a generic rooftop party?

### 5. Some facts currently compete with each other

The biggest visible contradiction is dress guidance:

- immersive caption says `Blue & teal.`
- Survival Kit says `No code.`

Even if the intended meaning is "optional color direction, not a strict dress code", the page is currently making the customer resolve that ambiguity alone.

### 6. The reserve handoff is operationally abrupt

`Reserve` lands on `/tickets/day-n-night`, which immediately asks for a passcode.

That gate may be correct operationally, but the landing page does not prepare the user well enough for it. The user should know before clicking:

- that the event is invite-only
- that reservation requires the invite code
- where that code comes from

Without that framing, the click feels like a dead end instead of a deliberate next step.

## What the page should do

The page has one job:

`Turn a curious invited guest into a confident reserver.`

To do that, every version of the page should let the guest answer these seven questions in under ten seconds:

1. What is this?
2. Who is it for?
3. What will the night feel like?
4. What exactly happens first, then later?
5. Where and when is it?
6. What does it cost and what is included?
7. What happens when I hit Reserve?

If any surface cannot answer those seven questions quickly, it is decorative first and useful second.

## Recommended narrative structure

This is the canonical story the page should tell, regardless of surface.

### Beat 1. Invitation

Goal: orient the guest immediately.

Must answer:

- this is a private Day n Night gathering in Haebangchon
- it moves from cookout into night session
- it is capped and invite-led

Content rule:

- one headline
- one sentence of proposition
- one short line explaining invite-only status

### Beat 2. Why this night exists

Goal: make the event feel intentional, not generic.

Must answer:

- why the hosts are gathering people
- what makes this distinct from an ordinary rooftop event

Content rule:

- two to three sentences max
- concrete social promise over mood-only language

### Beat 3. The arc of the evening

Goal: replace abstraction with sequence.

Must answer:

- what happens during the day portion
- what changes at sunset
- what the night portion becomes

Content rule:

- three beats, each concrete
- name the transition, not just the vibe

### Beat 4. Practical terms

Goal: remove friction before the reserve click.

Must answer:

- date and arrival window
- location
- price and inclusions
- attire guidance
- plus-one rule
- late-arrival rule

Content rule:

- one authoritative logistics block
- all other versions summarize or deep-link to that same block

### Beat 5. Reserve handoff

Goal: set expectation for the next screen.

Must answer:

- reservation requires the invite code
- the next screen is private
- the code is the same one shared in the invite/DM

Content rule:

- CTA label stays short
- helper line does the operational explanation

## Surface roles

Each UI surface should have one role only.

### Loader

Role: mood-setting entry only.

Should do:

- present the invitation
- offer one obvious primary path
- offer one obvious reduced-information path

Should not do:

- introduce multiple overlapping ways to simplify the page

### Story view

Role: emotional delivery of the canonical story.

Should do:

- dramatize the same five beats
- privilege atmosphere after orientation is already established

Should not do:

- become the only place where important facts live

### Card view

Role: the compressed answer sheet.

Should do:

- answer the seven customer questions fast
- be the benchmark for clarity

Should not do:

- become a second storyline with different facts

Note:

- this role may be retired if the drawer/sidebar becomes the single fast path for practical information

### Info drawer

Role: logistics reference while staying inside story view.

Should do:

- show practical details only
- help users who already want the story mode

Should not do:

- compete with `Card` as another "summary mode"

### Ticket gate

Role: continuation of the reserve action.

Should do:

- feel expected
- restate that the event is private and code-protected

Should not do:

- feel like a surprise blockage

## Immediate copy priorities

If only a small copy pass happens first, rewrite these in order:

1. `opening.lede`
2. `act.day.body`
3. `act.night.heading`
4. `act.night.body`
5. `closing.kicker`
6. `tribute.body`
7. attire language across `dressCode` and `survivalKit.dress`
8. reserve helper text

## Recommended content model

Future iterations should write one canonical event brief first, then derive every surface from it.

Suggested shape:

```ts
type EventNarrativeBrief = {
  premise: {
    title: string;
    oneLiner: string;
    inviteOnlyNote: string;
  };
  hostIntent: {
    whyNow: string;
    socialPromise: string;
  };
  eveningArc: {
    day: string;
    sunset: string;
    night: string;
  };
  logistics: {
    date: string;
    time: string;
    place: string;
    entry: string;
    included: string;
    attire: string;
    plusOne: string;
    lateArrival: string;
  };
  reserve: {
    cta: string;
    helper: string;
    gateExpectation: string;
  };
};
```

Then each surface becomes a formatter:

- immersive = expanded cinematic formatter
- card = compressed factual formatter
- drawer = logistics formatter
- ticket page = reserve formatter

If the standalone card view is removed, the drawer/sidebar becomes the sole compressed factual formatter.

## LLM / agent workflow

This page is a strong candidate for an agentic copy loop, but only if the inputs are structured.

### Step 1. Write the canonical brief

One source of truth, no component thinking yet.

Output:

- one markdown or JSON brief in the shape above

### Step 2. Run a customer-questions pass

Agent prompt:

`Can a first-time invited guest answer the seven questions in under ten seconds? Flag every missing or ambiguous answer.`

### Step 3. Generate surface-specific copy

Separate prompts for:

- immersive story
- card summary
- info drawer
- reserve handoff

Constraint:

- no new facts may be invented outside the canonical brief

### Step 4. Run a contradiction pass

Agent prompt:

`Find any pair of lines across surfaces that could both be true in code but feel inconsistent to a guest.`

This catches issues like:

- `Blue & teal` vs `No code`
- `Reserve` vs passcode gate surprise
- poetic line vs operational instruction mismatch

### Step 5. Implementation mapping

Only after copy is approved should an implementation agent map each line to:

- translation key
- component slot
- CTA target
- fallback / mobile treatment

### Step 6. Browser QA

Final QA prompt:

`Act like a first-time invited guest. In ten seconds, answer the seven questions. Report where the page slows you down or makes you infer too much.`

## Concrete recommendations

### Recommended simplification

Preferred model:

- `Enter` = story view
- `Essentials` = logistics drawer / sidebar shortcut
- `Info` = logistics drawer inside story view

Drop `TL;DR` as a separate affordance. If the loader needs a fast path, rename it to `Essentials` and point it to the same practical-information surface used elsewhere.

### Discussion update: likely direction after review

Current working direction from discussion:

- keep the loader as the intentional threshold moment
- preserve `Enter` as the primary first-visit path
- rename the quick path to `Essentials`
- do not create a separate route or separate overall page path for practical mode
- keep one shared event frame/layout and switch what is rendered inside it
- treat the immersive sequence as a shell/mode within that shared frame
- have `Essentials` open the practical-info surface inside that same frame
- shift the practical-info surface away from a mere sidebar/drawer and toward a full-page single-page composition inside the shared frame
- likely retire the standalone simplified/card view as a distinct page mode if the practical surface can live inside the shared frame cleanly

Reasoning:

- the page should feel like one coherent event surface, not branching microsites
- a shared frame preserves continuity while still allowing distinct densities of information
- the immersive sequence becomes one rendering mode, not the definition of the route itself
- practical mode can be faster and clearer without implying the user has gone somewhere else
- a dedicated single-page practical composition can carry far more information than a sidebar while still feeling authored
- keeping both a dedicated simplified view and a drawer still risks redundant information architecture unless their roles are made materially different

### Performance / rendering note

If the loader's `Essentials` path opens directly into the practical-info drawer/sidebar, implementation should not pay the full immersive cost before the user asks for it.

This should be treated as a load-bearing requirement:

- the quick path should avoid mounting heavy immersive-only systems until needed
- immersive-only visuals, scene code, and audio setup should stay behind explicit entry gates
- the practical-info path can reuse the shared shell, but should bypass unnecessary cinematic initialization

Implementation implication:

- introduce an early entry-intent or render-mode flag
- gate immersive-only work behind that flag
- keep the outer event frame/layout shared across modes, but let the inner payload differ by mode
- document this in the implementation pass so "skip to essentials" is a real performance shortcut, not just a cosmetic shortcut

### Working architecture model

The page should now be thought of as:

- one route
- one shared event frame
- multiple content modes inside that frame

Suggested mental model:

- frame = persistent shell, event identity, route continuity, shared chrome
- immersive mode = full cinematic payload inside the frame
- practical mode = reduced factual payload inside the same frame, potentially as a full-page poster-style composition

This is preferable to splitting the experience into separate paths because it preserves continuity while still allowing strong mode differentiation and better transitions between them.

## Practical mode art direction

Latest discussion direction:

- practical mode should likely be a full-page composition, not just a narrow info drawer
- the reference grammar is closer to a strong movie-poster one-pager than to an app sidebar
- it should combine:
  - a dark ground
  - one or two strong accent colours
  - oversized high-impact headline treatment
  - tightly structured metadata / credits / logistics blocks
  - dense but highly legible information

The key idea is not "retro decoration." It is the poster discipline of:

- one page
- one hero composition
- one strong typographic hierarchy
- a lot of information delivered without collapsing the image

That makes practical mode feel authored and memorable rather than merely abbreviated.

### Recommended reserve framing

Add helper copy near the primary CTA:

- `Invite only. You’ll need the passcode shared in your invite to complete your reservation.`

This preserves privacy without making the next page feel broken.

### Recommended attire framing

Pick one of these and use it everywhere:

- `Blue and teal encouraged. Not required.`
- `No dress code. Blue and teal if you feel like leaning in.`

Do not split the recommendation across two different systems.

## Definition of done

This page is not done when it looks polished.

It is done when:

- the guest understands the event without needing to decode mood fragments
- the reduced-information path is singular and obvious
- the reserve click feels prepared, not blocked
- every surface expresses the same facts at different density
- no line exists purely because it sounds nice
