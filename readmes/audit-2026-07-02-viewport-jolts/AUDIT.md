# Hideaway Viewport Jolt Audit

Date: 2026-07-02
Surface: https://hideawayseoul.com/
Capture: Chrome fallback after the in-app browser repeatedly timed out on the live homepage.
Output: Local folder in this directory.

## Scope

This audit focuses on visible scroll stability and motion comfort when graphic, canvas, or image-heavy content enters the viewport. Screenshots are evidence of the captured states; they do not by themselves prove the runtime cause of a jolt.

## Steps

### Step 1 - Home top

Screenshot: `screenshots/01-home-top.png`

Health: Needs attention.

Notes:
- Strength: The top chrome is minimal and consistent with the Hideaway visual system.
- UX risk: The first viewport is almost entirely empty dark space. Even after the page reports `readyState: complete`, no editorial or navigational content is visible beyond the header, footer edge, and custom cursor.
- UX risk: This makes a later scroll reveal feel more abrupt because the user moves from near-empty canvas into actual content.
- Accessibility risk: The visible page gives little semantic or visual orientation to a keyboard, reduced-motion, or screen-magnifier user.
- Evidence limit: Screenshot evidence confirms the visible state, but performance tracing is still needed to identify whether canvas initialization, animation gating, or late hydration causes the perceived jolt.

### Step 2 - Home bottom

Screenshot: `screenshots/02-home-bottom.png`

Health: Needs attention.

Notes:
- Strength: The footer typography, dividers, and legal structure are visually consistent and calm once reached.
- UX risk: The homepage jumps from an almost blank top viewport to footer/legal content with little intermediate narrative content. That makes the scroll feel like a reveal failure rather than an intentional landing experience.
- UX risk: The sticky header changes from edge-pinned chrome to a centered pill during scroll. The motion may be intentional, but paired with the empty first viewport it makes the page feel like its frame is moving more than its content.
- Accessibility risk: Low-contrast footer metadata appears below the practical contrast floor for readable legal/business information, especially on the dark background.
- Evidence limit: The screenshot captures the before/after states but not the transition curve, animation frame timing, or whether the header move is driven by scroll, hydration, or a late layout change.

### Step 3 - Essays top

Screenshot: `screenshots/03-essays-top.png`

Health: Needs attention.

Notes:
- Strength: The route title is clear and uses a strong editorial hierarchy.
- UX risk: The route shows no article cards, list affordance, empty-state explanation, or loading/error state in the first viewport. The page reports no image elements in the captured state.
- UX risk: If content is intentionally absent, the empty area needs an explicit empty state. If content is expected, the route is failing silently.
- Accessibility risk: A screen reader may encounter the route title and structural chrome but no explanation of what happened to the list.
- Evidence limit: The screenshot shows the rendered state after load, but not whether the list was withheld by CMS permissions, draft state, an API failure, or an animation gate.

### Step 4 - Essays bottom

Screenshot: `screenshots/04-essays-bottom.png`

Health: Needs attention.

Notes:
- Strength: The footer is reachable and visually consistent.
- UX risk: The only meaningful scroll destination is the footer. The experience feels like a page shell, not an editorial index.
- UX risk: Since the top viewport has a large title and the lower viewport is legal/footer content, scrolling creates a hard content discontinuity even without images.
- Accessibility risk: Users who rely on keyboard navigation or page search get no obvious signal that the route has no article results.
- Evidence limit: The screenshots do not prove the underlying data state; they only show that the live page renders no article content in this captured session.

### Step 5 - Surf index attempt

Screenshot: `screenshots/05-surf-top.png`

Health: Blocked.

Notes:
- Strength: The 404 page has a memorable, brand-consistent graphic treatment.
- UX risk: `/surf` presents a 404 even though Surf is a known content type in the product. Users who infer `/surf` as an index from article URLs or navigation vocabulary hit a dead end.
- UX risk: The giant red type is visually forceful and fills the viewport. If it enters unexpectedly, it can feel like a graphic jolt rather than a calm recovery state.
- Accessibility risk: The huge decorative text competes with the tiny actionable copy, "Come Back." The actual recovery action is visually secondary.
- Evidence limit: This capture confirms the production route state, not whether a Surf index is intended to exist.

### Step 6 - Essays paginated index attempt

Screenshot: `screenshots/06-essays-in-top.png`

Health: Blocked.

Notes:
- Strength: The 404 visual is consistent with Step 5.
- UX risk: `/essays/in` also presents the same 404 state even though the repo exposes a paginated essay-index route. If this route is linked internally or appears in history, it creates an abrupt visual interruption.
- UX risk: The full-viewport error graphic is a high-contrast, image-like surface. It is strong as a brand moment, but too loud for routine route recovery.
- Accessibility risk: The recovery instruction is tiny and centered inside a visually noisy field. It may be missed at high zoom or by low-vision users.
- Evidence limit: The screenshot captures production behavior only; it does not prove whether the route mismatch is deployment config, route grouping, data gating, or an intentional public/private split.

### Step 7 - Radio top

Screenshot: `screenshots/07-radio-top.png`

Health: Mixed.

Notes:
- Strength: The cassette/radio treatment is distinctive and gives the route a strong identity.
- Strength: The background and player controls create a clear mood without requiring external images; the captured route uses two canvas elements and no image elements.
- UX risk: The background dominates the viewport while the controls, labels, track title, and play action are comparatively tiny. The first impression is atmospheric, but the usable controls are easy to miss.
- UX risk: A heavy canvas-led visual entrance here is a plausible source of perceived jolt, especially because the route changes from the blank/quiet shell to a large red animated-looking field.
- Accessibility risk: Several labels and time marks are low contrast against the red/black background, and the primary play action is visually delicate for its importance.
- Evidence limit: The screenshot confirms canvas-heavy composition and control scale. It does not measure animation frame rate, GPU cost, reduced-motion behavior, or input latency.

### Step 8 - Radio archive section

Screenshot: `screenshots/08-radio-archive.png`

Health: Needs attention.

Notes:
- Strength: The archive and forthcoming sections continue the same editorial/radio language.
- UX risk: The graphic background remains visually louder than the empty-state message. The user scrolls into an area whose functional content is sparse, low-contrast, and visually secondary.
- UX risk: The empty archive state uses a faint circular mark that can be read as a loading spinner. That creates ambiguity: the user may wait for releases that are not coming.
- Accessibility risk: Low-contrast metadata and empty-state copy are below a comfortable readability floor in this captured state.
- Evidence limit: The screenshot captures the section after scrolling, but not whether the background continues animating, whether the canvas repaints during scroll, or whether reduced-motion preferences are respected.

### Step 9 - Plans top

Screenshot: `screenshots/09-plans-top.png`

Health: Mostly healthy.

Notes:
- Strength: Unlike the homepage and essays route, the first viewport has a clear offer, price, copy, and scannable benefit list.
- Strength: The atmospheric background supports the membership tone without fully hiding the primary text.
- UX risk: The pricing card starts low in the first viewport, so users see the hero and offer in the same visual field but may not immediately understand whether the page is an essay-like manifesto or a transaction surface.
- UX risk: The page uses a canvas/background layer; any delayed initialization here could be felt as a visual jolt, but the captured static state is more coherent than Radio.
- Accessibility risk: Several supporting lines and benefit bullets are thin/low contrast. The main headline is readable; the secondary buying details are less robust.
- Evidence limit: The screenshot confirms composition and contrast risk, not animation smoothness or input responsiveness.

### Step 10 - Plans mid-scroll

Screenshot: `screenshots/10-plans-mid.png`

Health: Needs attention.

Notes:
- Strength: The request-access button is large and clear when visible.
- UX risk: The page has a large vertical dead zone between the pricing CTA and the next "Apply" section. The user scrolls through mostly empty black space before the next headline arrives.
- UX risk: This kind of spacing amplifies perceived jolts because the next text section enters after a long quiet gap rather than through a continuous layout rhythm.
- Accessibility risk: Sparse mid-scroll content gives little orientation for screen magnifier users. It is easy to lose context between the pricing decision and the application prompt.
- Evidence limit: The screenshot shows the spatial gap but not whether scroll-linked animation intentionally creates it.

### Step 11 - Plans bottom

Screenshot: `screenshots/11-plans-bottom.png`

Health: Mixed.

Notes:
- Strength: The footer remains consistent with the wider site.
- UX risk: The lower page resolves into the same footer-heavy close as the homepage, with business/legal text occupying the main visible area.
- UX risk: The journey from membership offer to application CTA to footer is not well scaffolded. The page may feel like it falls away after the pricing decision.
- Accessibility risk: The same low-contrast legal/footer readability issue appears here.
- Evidence limit: The screenshot captures the ending state only; it does not validate whether the request-access flow works.

## Cross-Step Findings

1. The most visible jolt pattern is not only image loading. It is abrupt contrast between almost-empty viewports and dense or oversized graphic states.
2. Several public routes render no list content or route to the large graphic 404. That makes routine exploration feel unstable.
3. Canvas-backed surfaces are central to the brand language, especially Radio and Plans, but the usable UI often becomes secondary to the atmosphere.
4. Footer/legal copy is visually elegant but repeatedly too faint for information users need to read.
5. Screenshots alone are enough to identify layout rhythm and contrast risks. They are not enough to prove CLS, GPU cost, animation frame drops, hydration delay, or reduced-motion behavior.

## Recommendations

1. Add explicit empty states or content placeholders for empty editorial routes. Do not let a title plus blank page stand in for a list.
2. Reduce scroll dead zones on the homepage and Plans. If a viewport is intentionally quiet, leave a visible cue for the next section.
3. Make graphic 404 treatment less dominant for routine missing routes, or increase the recovery action's visual weight.
4. On Radio, lift key controls and labels above the atmospheric background with stronger contrast and clearer sizing.
5. Add a motion/performance follow-up pass for Radio and Plans: record scroll, check reduced-motion behavior, and inspect canvas repaint/frame timing.

## How To Use This As A One-Person Team

- Keep audit folders local to the repo when the goal is to give Codex future UX context. Figma is better when you need stakeholder presentation or collaborative annotation.
- For future UX work, point Codex at this folder and name the route or screenshot number. Example: "Use `readmes/audit-2026-07-02-viewport-jolts`, fix the Step 10 dead-zone issue on Plans."
- Repeat this pattern for narrow UX concerns: one folder, numbered screenshots, notes tied to each screenshot, then a short cross-step diagnosis.
- If the issue is motion, pair screenshot evidence with a short screen recording or performance trace in the next pass.

## Implementation Pass 1

Date: 2026-07-02
Scope: First CSS/layout pass on `/plans` and `/radio`.

After screenshots:
- `screenshots/12-plans-mid-after-local.png`
- `screenshots/13-plans-bottom-after-local.png`
- `screenshots/14-radio-top-after-local.png`
- `screenshots/15-radio-lower-after-local.png`

Changes made:
- `/plans`: tightened the Patron membership band spacing and reduced the Cofounder/Apply section from a full viewport to a shorter anchored section.
- `/radio`: shortened the On Air viewport, brought Archive/Forthcoming forward, added stronger readable backplates, and raised empty-state copy contrast.

Observed local deltas:
- `/plans` page height dropped from the production audit's captured `3987px` to roughly `3300px` locally after the patch.
- `/radio` page height dropped from the production audit's captured `1685px` to roughly `1407px` locally after the patch.

Verification limits:
- These are local visual checks against the same routes and comparable scroll positions. They do not replace a production performance trace.
- The local Radio screenshots include the development Beat Detector panel from `leva`; that panel was not present in the production audit screenshots and was not changed in this pass.
