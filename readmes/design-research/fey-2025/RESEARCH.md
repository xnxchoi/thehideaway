# Fey evidence and Hideaway settings design direction

Research date: 2026-09-10. Scope: Hideaway member settings layout, margins, spacing, component hierarchy and usable density. Reference window: Fey's public interface around May–August 2025. Audience: Hideaway readers and contributors returning to profile, account and security tasks. This is historical visual research, not a study of current customer complaints. User accepted the settings transitions; preserve them.

## Conclusion and confidence

The strongest transferable property is a hierarchy of spatial relationships: a stable content frame, clearly different category and field scales, grouped operations, aligned row tracks, and contrast concentrated on usable controls. Fey's material detail reinforces those relationships. Copying its background or adding more rounded surfaces does not reproduce them.

There is enough evidence to propose a local settings grammar and compare structural alternatives. There is not yet enough evidence to claim equivalent quality: no selected original visual target has been implemented, responsive/keyboard/edit states remain untested, and authentic Fey motion was not recovered. Treat the numeric proposals below as testable Hideaway decisions, not recovered Fey tokens.

## Evidence map

| ID  | Source and date                                                              | Evidence type                                              | Local artifact / conclusion                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | [Mobbin settings][1], metadata created Apr 22 2025, version published Apr 23 | Actual product screenshot, near desired period, post-v2.0  | [Settings image][2]. Native source metadata 3024×1890; downloaded rendition 1920×1200. Strongest direct settings evidence. Metadata dates do not guarantee the date of the UI's sample data. |
| F2  | [Mobbin overview/watchlist][3], same April version                           | Actual product screenshot                                  | [Dashboard image][4]. Confirms grouping/separators, fixed value alignment and deliberate active-row emphasis across another product surface.                                                 |
| F3  | [Archived homepage][5]; [Canvas image memento][6], Jul 27                    | First-party marketed product crop, not a full user session | [Canvas][7]. Confirms prominent primary data, subordinate metadata, contained action sets. Framed/cropped marketing rendering is unsuitable for exact CSS measurements.                      |
| F4  | [Press release image memento][8], Aug 6                                      | First-party marketed detail crop                           | [Press detail][9]. Shows restrained material edge, object-specific icon and semantic green result. It is not a whole-screen layout reference.                                                |
| F5  | [Earnings image memento][10], Jul 27                                         | Marketing photograph                                       | [Image][11]. Opened and REJECTED as interface evidence: woman wearing headphones, not earnings UI. Filename/alt alone was misleading.                                                        |
| H1  | localhost Profile, captured this run, authenticated Butler                   | Current rendered product                                   | [Profile][12], 1530×1030 raster. Broad equal cards, small fields and much stronger navigation scale. Mixed Korean rail / English content is visible existing debt.                           |
| H2  | localhost Security, captured this run, authenticated Butler, 10 sessions     | Current rendered product                                   | [Security][13], 1530×990 raster. Two-factor panel stretched to session-list height; providers/passkeys begin beneath the bottom frost region. This is the most revealing stress case.        |

The two Hideaway captures have different heights; do not use them as normalized before/after images. Browser CSS viewport/DPR could not be recovered: CDP measurement and click requests timed out, while direct navigation and screenshot capture worked. The saved images are valid composition evidence, not exact CSS geometry or successful interaction tests. Browser in-app surface was unavailable; Chrome fallback supplied both captures. No alternate browser automation was used to bypass that limitation.

### Sources used for provenance and limits

- [Fey v2.0, Jan 6 2025][14] explicitly describes refreshed settings and the referral counter. This supports using the April settings screen as near-period evidence; it does not prove unchanged settings through August.
- [Fey v2.1, May 26 2025][15] describes infrastructure and upcoming features; not an exact settings geometry specification.
- Internet Archive homepage mementos found May 15, Jun 6, Jul 7, Aug 6, 2025. July/August image mementos were downloaded and opened. August hero asset returned 404; original UI video returned 403, so neither supports analysis.
- [Nicelydone Fey gallery][16] supplies a large catalogue, but versions are labeled 2023 and 2020. Useful secondary history; not promoted to 2025 truth.
- [Design Systems Collective reconstruction article][17], Nov 13 2024, and [community kit][18] are third-party reconstruction, not official design tokens. Do not import their numbers as authority.
- DesignShots and Gummble galleries surfaced; capture dates were weak/unclear, so lower priority than actual Mobbin metadata and Archive mementos. No gated content was bypassed.
- Historical correction: [acquisition announced Aug 27, 2025][19]; [wind-down reported for Sept 30][20]. Acquisition and closure are different dates.

Search channels: repository/skills, Exa public web, public gallery metadata, Internet Archive HTML/CDX/image assets, design media. No package or GitHub implementation search was warranted: the problem is composition and existing primitives already cover the functions. No dependency introduced. No internal support source or complaint corpus was used; this task does not establish user-problem frequency.

## Component-by-component reading of Fey

All observations refer to opened images above. Inferences are marked explicitly. Raster proportions are not official spacing tokens; source DPR and CSS viewport are unknown.

| Component           | Observed evidence                                                                                                           | Inferred principle                                                                       | Hideaway application / boundary                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Outer frame         | F1: header and body share a clear left axis; main content has a stable large inset and space from bottom dock               | Chrome reserves space; content occupies an intentional working region                    | Keep FXFrame/header identity; define usable inner width and frost clearance explicitly rather than spreading breakpoint padding rules           |
| Major columns       | F1: approximately 56/44 account-management/billing split; billing has a different task and content shape                    | Unequal columns encode differing jobs, not equal boxes for every section                 | Profile can be one working column. Security sections should follow task order and natural height; never stretch a short control to ten sessions |
| Category heading    | F1: small colored icon tile, clear stronger title, aligned to first row in adjacent group                                   | Category scale establishes grouping without competing with every field                   | Smaller rail glyphs, consistent optical weight and clear active text; keep moving pill but reduce its dominance                                 |
| Row group           | F1 Options and Support: one containing surface with separators, shared left/right insets                                    | Related operations belong together; internal rows do not all need independent elevation  | Use one surface for a genuine group; separators and hover/focus carry row state. Retire the universal row-pill rule                             |
| Single row          | F1 Account name: separate compact control surface with icon/value                                                           | A lone editable operation can be contained without inheriting a large panel              | Inline profile field may have a quiet clickable region; avoid full empty cards around one field                                                 |
| Label/value tracks  | F1 labels left, switches/actions at a stable trailing edge; F2 watchlist labels, prices and results form consistent columns | Stable tracks reduce eye travel and distinguish information roles                        | Shared inset, minimum label track and flexible values; long values wrap intentionally; control stays reachable                                  |
| Headings and body   | F1 category headings visibly heavier than row text; headings are compact rather than hero-sized                             | Size and weight both establish hierarchy; tiny body is not a route to sophistication     | Keep SUIT working-surface identity, use readable 14–16px fields, 12–13px helper, 17–19px section title, 30–36px page title as candidates        |
| Empty/short content | F1 little arbitrary empty interior; space separates meaningful clusters                                                     | Whitespace should express relationships rather than equalize rectangles                  | No forced sibling height. Empty Bio/Last name should be discoverable, not ghost-like decorative copy                                            |
| Buttons and toggles | F1 compact bordered buttons with recognizable symbols; active newsletter switch uses orange                                 | State color and subtle edges make a usable control tactile                               | Preserve bordered/no-fill action convention and semantic danger; enlarge hit area without oversized visual chrome                               |
| Navigation          | F1/F2 bottom dock with compact active state and spacing; not the present Hideaway sidebar                                   | Navigation is a distinct instrument, visually quieter than the primary operation         | Do not copy the dock or change settings IA. Transfer consistent scale, active state, and rhythm to the accepted rail                            |
| Surface depth       | F1/F2 darker working groups separated from neutral canvas; faint borders/highlights where needed                            | Luminance hierarchy establishes planes; not everything should be a frosted tile          | Retain Hideaway warmth. Adjust local contrast and containment hierarchy; avoid a global palette rewrite                                         |
| Expressive asset    | F1 wallet and referral token; F4 press object                                                                               | Material illustration is tied to the represented object, concentrated in selected places | Do not add a wallet/plaque or decorative prop to profile/security. Existing Hideaway frame provides character                                   |
| Dense data          | F2 shared row separators, aligned figures, a single active-row background                                                   | Density comes from alignment and repetition, not miniaturizing type                      | Sessions need a compact readable list, current-device status, stable action track, and clear scroll flow                                        |
| Semantic color      | F1 category accents and enabled switch; F2 directional financial colors; F4 result green                                    | Colors have distinct local jobs                                                          | Keep danger/success meaningful; never use five decorative category colors as a substitute for hierarchy                                         |
| Motion/hover/error  | Static images cannot establish behavior                                                                                     | No timing or interaction conclusion from stills                                          | Preserve accepted Hideaway motion and test its behavior directly during implementation                                                          |

Fey itself contains nested surfaces and some faint inactive labels. The lesson is not a blanket ban on nesting or a license to copy low contrast. A contained billing object and a same-task settings row have different reasons for visual separation. Accessibility remains a Hideaway boundary.

## Current Hideaway audit

Capture sequence: open authenticated Profile → save/inspect H1 → attempt rail and DOM measurement (timed out) → direct-open Security → save/inspect H2. This validates resting layouts only; do not claim the rail click or form interaction passed.

1. **[P1]() Security pairs unrelated heights.** In H2, Two-factor has one control near its top, but the panel continues nearly to the bottom of the session list. Providers/passkeys begin below it. `Panel.tsx` grid stretches paired items. Fix the layout model: natural-height sections and explicit task ordering. Simply `items-start` fixes card stretching but still leaves an empty grid slot and delays the next row; it is insufficient alone.
2. **[P2]() Rail/control scale is inverted.** H1/H2 show large vivid glyphs and \~65px rail rows next to tiny field/helper/action text. Reduce icon/tile and rail padding, increase functional typography and targets, then recalibrate total shell width.
3. **[P2]() Layout breakpoint is discontinuous (source-derived).** `max-w-7xl` is 80rem; project root is 10px. Before 1440px, shell is capped at about 800px; at 1440px it becomes 1440px while panels become two columns. Estimated pane change \~506→1131px at the relevant desktop transition. Browser computed geometry pending; tests must confirm values and practical effect.
4. **[P2]() Surface repetition weakens hierarchy.** H1 shows panel backgrounds plus a new tinted rounded strip around each field. Similar treatment communicates category, row and action simultaneously. Use a stronger category/field separation and fewer independent backgrounds.
5. **[P2]() Small/dim controls risk legibility and targeting.** H2 termination controls are visibly dark; source sizes for save/cancel and switches are below ordinary target dimensions. Measure contrast and actual target boxes before concluding WCAG compliance or violation; propose ≥24px target minimum without relying on exceptions, preferably 36–44px touch-friendly wrappers.
6. **[P2]() Content language is inconsistent.** Korean navigation with English page titles and field descriptions appears in H1/H2. Existing source also bypasses next-intl in several routes. For any touched text, move existing content to both locale files with neutral translations; do not invent explanatory prose to fill gaps.
7. **[P2]() Frost clearance constrains usable content.** H2 next groups meet bottom frost. Preserve frame identity and reserve safe scroll padding. Changing `py-[180px]` without measuring chrome could trade whitespace for obstruction.

### ECC visual-audit dimensions

Provisional scores describe the two captured desktop dark resting states only; they are not benchmark scores or acceptance criteria.

| Dimension             | Score / status                | Basis                                                                                          |
| --------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Color consistency     | 7/10                          | Warm tokens repeat; category colors and dim dangerous actions need role/contrast review        |
| Typography hierarchy  | 4/10                          | Confident page title, weak section/field/action scale relationship                             |
| Spacing rhythm        | 4/10                          | Repeated insets but major width jump and arbitrary sibling height dominate                     |
| Component consistency | 5/10                          | Shared field family exists; security and notification custom rows diverge                      |
| Responsive behavior   | Not rated                     | Desktop screenshots only; root/breakpoint findings are source-derived                          |
| Dark mode             | 6/10                          | Coherent atmosphere, insufficient separation/readability in some controls; light mode untested |
| Animation             | Accepted by user, not rerated | Captures cannot assess timing; preserve current implementation                                 |
| Accessibility         | Not rated                     | Visible risks; keyboard, contrast, zoom and target tests remain                                |
| Information density   | 3/10                          | Security wastes most of a large panel on one operation                                         |
| Polish                | 5/10 resting only             | Rich shell identity, inconsistent internal craft; hover/edit/error not captured                |

## Preserve identity; demote experiments

Preserve: sparse and typographically confident composition; warm neutrals and existing SUIT font; FXFrame and header; contextual rather than universal expression; clear functional controls; next-intl and factual copy; existing field behaviors and page IA; accepted rail and pane transition; auth/SSR/session boundaries.

Reconsider: universal two-column bento; 224px rail as an absolute; 35px icons; every row a pill; repeated gradient hairlines; top padding copied without a safe-area model; blanket card-to-card nesting; Apple/iOS/Fey comments treated as evidence of quality; decorative membership props unrelated to these tasks.

`readmes/DESIGN_SYSTEM.md:168–198` already differentiates experiment from observed precedent and ranks accepted user feedback above code patterns. `.claude/skills/admin-fey-surfaces/SKILL.md:34–35` contains a stale description/control grid and an incorrect absolute no-divider rule. The reference image directly contradicts the latter. Do not overwrite role/subscription instructions while revising its visual section later.

See [CODE-INVENTORY.md][28] for exact files and reuse boundaries.

## Proposed local grammar — candidates for visual testing

Purpose: members locate, understand and safely change account settings. Tone: calm, precise, quietly tactile. Memorable detail: Hideaway's existing atmospheric frame around a sharply composed working surface. Do not add ornamental objects, marketing sections, fake features or new font packages.

| Role           | Candidate specification                                                                                                      | How to falsify it                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Shell width    | Explicit \~1120–1200px total maximum; fluid within available frame; no rem-derived surprise cap                              | Compare 1280/1439/1440/1600: no sudden density/layout discontinuity                               |
| Navigation     | \~176–192px width, 40–44px rows, \~18–22px optical icons, \~8–12px icon/text gap                                             | Active pill still clear; labels fit Korean/English without crowding                               |
| Rail/pane gap  | \~32–48px desktop, stable axis                                                                                               | Pane feels related to navigation, not detached or squeezed                                        |
| Page title     | SUIT \~30–36px, existing light/normal display character, controlled line height                                              | Does not compete with rail or overrun safe viewport at zoom                                       |
| UI typography  | Fields 14–16px, helpers 12–13px, section titles 17–19px                                                                      | Readable on laptop; en/ko line wraps acceptable                                                   |
| Rhythmic roles | 4/8px micro spacing; 12–16px row inset; 20–24px group inset; 24–32px title gap; 32–40px section gap                          | Relations remain recognizable after one long label or extra helper line                           |
| Field row      | \~44–52px minimum resting height, auto height for wrapping; stable trailing action area                                      | Long email, URL and Bio do not crowd label or edit controls                                       |
| Grouping       | One shared surface per tightly related task; restrained internal separator, row tint for interaction state                   | At rest, user can distinguish categories, values and actions without repeated rounded backgrounds |
| Profile        | Single readable working column or deliberately unequal task sections; no equal-height identity/location blocks               | Empty/full data stays balanced; no fake content added to fill space                               |
| Security       | Natural-height task sections in explicit DOM order; session count increases only the relevant list, not sibling panel height | Test 0/1/10/30 sessions; below-fold actions remain reachable and task order sensible              |
| Targets        | ≥24px minimum targets, prefer 36–44px wrappers for small optical controls                                                    | Keyboard focus and touch remain clear; no reliance on invisible overlapping targets               |
| Contrast       | Existing theme tokens; measure ≥4.5:1 normal text, ≥3:1 required control/focus contrast                                      | Test both themes against actual composite backgrounds, not opacity numbers alone                  |
| Editing        | Keep deferred editing but visible affordance/focus; borderless bottom-border input and bordered unfilled submit              | Hover, keyboard, touch, save, cancel and server error are all comprehensible                      |
| Motion         | Existing pendingHref/SHELL/retained outgoing pane/no y-jump                                                                  | Layout refactor does not remount shell, restore skeleton teardown or alter timing                 |

Use local semantic variables when implemented; the values above are in intended CSS pixels, not assumed Tailwind rem units. Do not change the global 10px root as part of this task. Container-based layout decisions may suit the actual pane better than viewport-only switches, but do not add a new dependency.

## Three structural studies

All studies keep the same Profile fields (First name, Last name, Bio, Location, Link), same routes, frame, warm palette and sans identity. They are original Hideaway proposals informed by Fey's grouping. They are not copies of Fey settings, nor claims that a static mock satisfies interaction quality.

- Focused column: compact rail and one continuous readable field stack, section hierarchy mostly through typography and spacing.
- Category gutter: category titles occupy a small internal left track, fields align in a larger right track, making relationship more explicit without giant cards.
- Unequal sections: Identity remains primary, Location/Link forms a smaller naturally sized secondary group; shared axes and balanced whitespace replace equal bento boxes.

Product Design ideation requires selecting the visual target before building. These studies test competing structures under a stable brand, not different decorative themes. Once selected, compare the same content/state/viewport against the rendered implementation and revise until no actionable P0/P1/P2 issues remain.

## Implementation and verification sequence after selection

1. Inspect current dirty state; preserve unrelated `readmes/ECOMMERCE.md`. No commits/pushes authorized by this research.
2. Make geometry changes through settings layout, rail, Panel/FieldRow family. Preserve auth, shell motion and route boundaries. Inventory custom session/provider/passkey/notification rows before claiming consistency.
3. Do not add tests that merely assert Tailwind strings. Use meaningful layout/interaction tests: width continuity, overflow, natural section height, save/cancel focus, long values and translation wrapping. Existing motion/prerender tests remain regression checks.
4. Test General, Profile, Account, Security and Notifications at 390, 768, 1280, 1439, 1440 and 1600px; add 200% zoom and reduced motion. Desktop dark/light and en/ko. Capture empty/filled/edit/error Profile, and Security 0/1/10/30 sessions, provider statuses and passkey empty/populated states using existing local fixtures where supported.
5. Test keyboard tab order/focus, Enter/Escape for editing, hit targets, contrast, scroll clearance and route transitions. Do not mutate real security settings just to obtain screenshots; use authorized development fixtures.
6. Run targeted tests and code reviews; make a real same-size combined visual comparison of selected mock and browser capture, plus focused field/rail crops. Record viewport, density, content, state, fixes and post-fix captures in `design-qa.md`. Until this exists, design QA is pending, not passed.
7. Only after visual validation update `readmes/SETTINGS.md` and the visual-only part of the admin skill with accepted local rules. Keep global identity in the design guide; avoid a parallel global token system or premature universal rules.

## Phase status

Research and resting-state audit completed with explicit gaps. Three independent original layout studies were generated, shown exactly once in chat, and saved as [study 1][29], [study 2][30], [study 3][31], numbered by display order. Each received actual local H1 and F1 image paths as references. No production source, copy, role logic, navigation or animation was changed by this research. No generated mock is an implemented screen. Design QA is reserved for selected-target versus rendered-implementation comparison, not misused as a verdict on unrelated Fey/Hideaway screenshots.

Generation caveats: raster concepts do not obey every requested measurement precisely. Study 1 simplified part of the outer frame and added a rail divider; study 3 retained more nested containment than the proposed grammar requested. These are visible concept deviations, not accepted new requirements. Actual header/FXFrame assets and behavior must be retained from the code. The studies show consistent English as a layout test, not an authorization to remove Korean or silently approve new copy. Selection with refinements should lead to a revised visual target before implementation, per the invoked ideation workflow.

[1]:	https://mobbin.com/explore/screens/6aa222b9-2d52-41bb-8dea-93a7d7111b0b
[2]:	sources/fey-settings-april-2025.png
[3]:	https://mobbin.com/explore/screens/9be7efbe-d004-4a8a-b31d-f14c49c73664
[4]:	sources/fey-dashboard-april-2025.png
[5]:	https://web.archive.org/web/20250806003410/https://fey.com/
[6]:	https://web.archive.org/web/20250727041746im_/https://fey.com/marketing/_next/static/media/canvas_4x.a8569ad4.jpg
[7]:	sources/canvas-july-2025.jpg
[8]:	https://web.archive.org/web/20250806003448im_/https://fey.com/marketing/_next/static/media/press-release_4x.c4191482.jpg
[9]:	sources/press-august-2025.jpg
[10]:	https://web.archive.org/web/20250727032217im_/https://fey.com/marketing/_next/static/media/earnings-model_4x.3a312065.jpg
[11]:	sources/earnings-july-2025.jpg
[12]:	current/profile.png
[13]:	current/security.png
[14]:	https://fey.com/updates/v2.0
[15]:	https://fey.com/updates/v2.1
[16]:	https://nicelydone.club/apps/fey
[17]:	https://www.designsystemscollective.com/crafting-a-detailed-ui-kit-from-inspiration-breaking-down-feys-design-2d2761649e40
[18]:	https://www.figma.com/community/file/1438501877215422359
[19]:	https://newsroom.wealthsimple.com/wealthsimple-acquires-investment-research-platform-fey
[20]:	https://betakit.com/wealthsimple-acquires-fey-to-bolster-its-investment-research-capabilities/
[28]:	CODE-INVENTORY.md
[29]:	studies/study-1.png
[30]:	studies/study-2.png
[31]:	studies/study-3.png