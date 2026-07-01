# The Hideaway Mobile UX, Layout, And Performance Audit

Date: 2026-06-30

Target: https://hideawayseoul.com/

Audit mode: combined UX, layout, accessibility-risk, and implementation triage.

Capture destination: local folder, `output/ux-mobile-layout-performance-audit-2026-06-30/`.

Capture tools:
- Codex in-app Browser was attempted first. Fresh production tab creation and tab claiming timed out, so it could not produce reliable screenshots.
- Chrome Internal was attempted second. It connected, but did not expose viewport override, so it could not satisfy the mobile capture requirement.
- Playwright fallback captured mobile evidence in Chromium with iPhone Pro Max sized viewport `430x932` and Pixel 8 sized viewport `412x915`.
- WebKit/Safari capture was attempted but local WebKit was not installed, so iOS Safari remains a required follow-up verification target.

## Numbered Flow Steps

1. Home page, iPhone-sized mobile top load
   - Screenshot: `chromium-iphone-pro-max-01-home-top.png`
   - Health: poor.
   - The first viewport is effectively empty apart from the header. Horizontal overflow is already present before scrolling: client width `430`, scroll width `473`, overflow `43px`.
   - The global WebGL canvas is mounted full viewport with DPR-sized backing store `1290x2796`.

2. Home page, footer after scroll
   - Screenshot: `chromium-iphone-pro-max-02-footer-after-scroll.png`
   - Health: poor.
   - TickerCrown is visible in the footer. Legal/contact content is clipped at the right edge, confirming the user-visible horizontal overflow.
   - Overflow remains `43px`; this is not isolated to one scroll position.

3. Menu attempted by coordinate tap after footer scroll
   - Screenshot: `chromium-iphone-pro-max-03-menu-open-after-footer.png`
   - Health: failed interaction.
   - The coordinate tap hit the header wrapper, not the button. This is useful evidence: the mobile header has a layered hit area wider than the viewport and makes pointer targeting brittle.

4. Menu opened by button target after footer scroll
   - Screenshot: `chromium-iphone-pro-max-05-menu-open-button-click.png`
   - Health: poor.
   - The menu opens, but the gradient preview is oversized and clipped off the right edge.
   - Inactive nav items are nearly invisible against the black background. This is an accessibility risk for contrast and discoverability.
   - Captured stack: header z `249`, menu body z `248`, preview gradient z `247`, menu preview wrapper z `1`.

5. Menu navigation to Essays
   - Screenshot: `chromium-iphone-pro-max-06-after-menu-link-click.png`
   - Health: degraded.
   - The route visually loads, but the horizontal overflow persists: client width `430`, scroll width `473`.
   - The footer crown did not visibly persist above the menu in Chromium capture, but the shared canvas/layer system can still explain why it appears to persist on other browsers.

6. Pixel 8 sized captures
   - Screenshots: `chromium-pixel-8-01-home-top.png` through `chromium-pixel-8-04-after-menu-navigation.png`
   - Health: poor.
   - The same overflow pattern reproduces: client width `412`, scroll width `468`, overflow `56px`.

## Primary Findings

## Evidence Map

| Finding | Screenshot evidence | JSON evidence |
| --- | --- | --- |
| Mobile horizontal overflow exists before footer scroll | `chromium-iphone-pro-max-01-home-top.png`, `chromium-pixel-8-01-home-top.png` | `capture-results.json`: iPhone `430 -> 473`, Pixel `412 -> 468` client-to-scroll width |
| Footer content visibly clips at right edge | `chromium-iphone-pro-max-02-footer-after-scroll.png` | `capture-results.json`: overflow persists after footer scroll |
| Coordinate tap is brittle in header layer stack | `chromium-iphone-pro-max-03-menu-open-after-footer.png` | `capture-results.json`: tap point hit header wrapper, not the button |
| Menu gradient is oversized and clipped | `chromium-iphone-pro-max-05-menu-open-button-click.png` | `focused-menu-capture.json`: `.menu__preview-preview` width `473`, `.preview__gradient` z `247`, menu shell width `473` |
| Post-menu navigation keeps overflow | `chromium-iphone-pro-max-06-after-menu-link-click.png` | `focused-menu-capture.json`: after `/essays`, client width `430`, scroll width `473` |

### 1. Horizontal overflow is global and reproducible

Evidence:
- iPhone profile: `documentElement.clientWidth = 430`, `documentElement.scrollWidth = 473`.
- Pixel profile: `documentElement.clientWidth = 412`, `documentElement.scrollWidth = 468`.
- The overflow is present at top load, footer scroll, menu interaction, and post-navigation.

Likely causes:
- `#rp-header` renders wider than the viewport. It was captured at `473px` wide on a `430px` viewport.
- `.menu__body` and menu frames also render at the overflow width.
- `.menu__preview-preview` remains mounted, visible, and oversized even when inactive.

Relevant source:
- `src/components/Shells/Header/HeaderClient.tsx`
- `src/components/UX/MediaPreview/MenuMediaPreview.tsx`
- `src/styles/hideaway.scss`

### 2. Closed menu preview remains visible offscreen and oversized

Evidence from the closed top-load state:
- `.menu__preview-preview`
- `data-active="false"`
- `position: fixed`
- `visibility: visible`
- `opacity: 1`
- rect approximately `left=-152`, `right=625`, `width=777` on a `430px` viewport.

This is a stronger explanation for the persistent mobile horizontal scroll than TickerCrown alone.

Relevant source:
- `MenuMediaPreview.tsx` applies `invisible z-[1] data-active:visible`, but GSAP later leaves the element with visible/opaque computed style while hiding it by transform.

### 3. Header sizing is not clamped to the client viewport

Evidence:
- Header captured at `473px` wide on a `430px` client viewport.
- Header source uses `left: "50%"`, `translate(-50%, ...)`, and a motion-derived width initialized from `window.innerWidth`.

Risk:
- On iOS Safari, dynamic viewport changes, URL bar collapse, safe-area inset changes, and visual viewport changes can make this worse than Chromium mobile emulation.

### 4. Shared WebGL canvas is a performance and layering risk

Evidence:
- The shared canvas is fixed, full viewport, and DPR-backed: `430x932` CSS pixels becomes `1290x2796`.
- When nav is open, the main canvas z-index is promoted to render the menu gradient.
- Console warnings include repeated WebGL GPU stalls due `ReadPixels`.
- Console also reports `HTML5 Audio pool exhausted`.
- iPhone profile captured long tasks of `162ms`, `110ms`, `55ms`, and `115ms` during top load, with one layout shift of `0.0858`. After menu navigation, the same run had five long tasks and three recorded layout shifts totaling `0.2574`.
- Pixel profile captured long tasks up to `111ms` during top load. These are headless Chromium signals, not physical-device trace results, but they support the lag/crash risk enough to justify real-device tracing.

Relevant source:
- `src/components/core/Main.tsx`
- `src/components/core/MainInternal.tsx`
- `src/components/UX/Gradient/index.client.tsx`
- `src/components/core/TickerCrownAnimated/TickerCrown.client.tsx`

Risk:
- Footer TickerCrown and menu Gradient both render into the same shared canvas via Drei `View`.
- TickerCrown gates on footer in-view and page transition state, not menu-open state.
- Even if the footer crown is hidden behind the menu in Chromium, a Safari/mobile compositing difference can plausibly make it appear stuck or burn through during route/menu transitions.

### 5. Menu contrast and first-screen hierarchy are below production quality

Evidence:
- Inactive menu entries are barely visible on black in the successful menu-open screenshot.
- The first mobile viewport of the home page is almost empty except for header chrome.

Accessibility risks:
- Low contrast for inactive nav labels.
- Unclear task entry on first load.
- Horizontal scroll causes reflow and zoom resilience failures.
- The menu uses animated state changes without a captured focus/focus-trap validation.
- Keyboard traversal, focus restoration, Escape-to-close behavior, and screen-reader announcement were not validated in this screenshot run and need targeted interaction tests.

## Recommendations

1. Add a mobile overflow regression before code changes.
   - For `/`, footer scroll, menu open, and post-menu navigation, assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
   - Run against at least iPhone-sized `430x932` and Pixel-sized `412x915` viewports.

2. Fix `MenuMediaPreview` inactive behavior first.
   - When `navIsOpen` is false, unmount the heavy preview or apply `display: none` after close animation completes.
   - Do not rely on a large transformed fixed element to hide state.
   - Clamp active preview width to `100dvw` or `100svw`, not a computed width that can exceed the client viewport.

3. Clamp the header and menu shell to the visual viewport.
   - Header width should resolve to `min(100dvw, documentElement.clientWidth)` equivalent behavior.
   - Avoid centered fixed elements wider than the client viewport on mobile.
   - Re-test after dynamic viewport height changes.

4. Treat shared canvas consumers as exclusive during menu states.
   - When `navIsOpen`, hide or unmount TickerCrown's `View`, not just pause drift.
   - Audit every shared canvas `View` claimant for menu-open behavior.
   - Cap renderer DPR on mobile and reduced-motion paths.

5. Fix mobile menu legibility.
   - Raise inactive nav item contrast to the project's readable label floor.
   - Keep the oversized gradient from clipping horizontally.
   - Validate touch target and focus behavior after changes.

6. Complete real-device verification.
   - Install/enable Playwright WebKit or use a real iPhone/Safari remote debugging session.
   - Re-run the same flow on iOS Safari, Chrome Android, and one low-power mobile profile with CPU throttling.

## Council Verdict

Question: should remediation target TickerCrown first, or the global menu/header/canvas layer system?

Verdict: prioritize the global menu/header/canvas layer system first.

Consensus:
- The horizontal overflow appears before the footer crown is involved.
- The measured offenders are global fixed layers: header, menu body, menu preview, and shared canvas.
- TickerCrown still needs containment because it shares the global canvas and can keep rendering while the footer is in view.

Strongest dissent:
- TickerCrown may still be an independent performance bug. A quick menu-open suppression or kill switch should ship alongside the global layer fix so footer-specific jank cannot survive the first pass.

Recommended first fix order:
1. Add mobile overflow regression coverage.
2. Remove inactive menu preview from layout/compositing.
3. Clamp header/menu shell widths to the client viewport.
4. Suppress TickerCrown and other non-menu canvas views while nav is open.
5. Cap/degrade mobile WebGL and validate on Safari/WebKit.

## Evidence Limits

- This run captured Chromium mobile emulation, not physical iPhone Safari.
- WebKit capture could not run because Playwright WebKit was not installed locally.
- Screenshot evidence supports UX/accessibility risks, but not full WCAG compliance claims.
- The exact crash mechanism needs a performance trace on a real iPhone or Safari/WebKit target.
