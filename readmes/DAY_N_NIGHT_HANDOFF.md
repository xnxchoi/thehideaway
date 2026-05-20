# Day n Night — Handoff to the next session

> **Read this in full before touching any `/day-n-night` code or copy.** A
> concurrent session has shipped many changes since the storyboard
> (`DAY_N_NIGHT_STORYBOARD.md`) was drafted; significant chunks of that
> storyboard are likely stale. The decisions in §2 below are **locked**; the
> spec in the storyboard is **drafts-grade**. Re-read source before
> implementing any specific line.

---

## 0. Status as of this handoff (2026-05-20, late session)

- **Architecture doc:** `readmes/DAY_N_NIGHT.md` — current. Last edited to add a cross-reference to the storyboard at § 11.
- **Voice doc:** `readmes/VOICE.md` — current. Serves as the standard.
- **Storyboard:** atticed 2026-05-20 at `.attic/readmes/DAY_N_NIGHT_STORYBOARD.md`. Most of its value (intention frame, polaroid scatter spec, locked voice rulings) was lifted into § 2 of this handoff before the move; the screen-by-screen KO polish proposals are superseded by the mirror-EN rule (§ 2.1). Recoverable via `git log -- .attic/readmes/` if you need to dig.
- **`messages/ko.json` — partially edited by this session:** ~20 string edits landed against the § 7 "don't-ship list" of the storyboard (`~세요` purges, English-only KO ports, register fixes, moodboard caption reconciliation, `opening.body` orphan-period strip). **These edits may have been overwritten or conflicting with the parallel session — diff before trusting.**
- **`messages/en.json` — not modified** by this session (an attempted Night-act key rewrite was interrupted before landing).
- **`Timeline.tsx` — not modified** by this session.
- **No new code, no new components, no new assets** were landed.

The full conversation that produced the storyboard + this handoff:
intention-first reframing → voice rulings (V1–V8) → screen-by-screen polish
proposals → Night act redesign around YM.FM + TapePlayer → polaroid scatter
spec → audio mapping.

---

## 1. The "do not lose this" caveat

The parallel session has been editing `Timeline.tsx`, `Reveal.tsx`,
`SceneView.tsx`, `SunLoader.tsx`, `SimplifiedView.tsx`, and `dn.css` — the same
files this work touches. **Before implementing any item in §3 below:**

1. `git diff` to see what changed.
2. Re-read the actual file currently on disk — not the snippets quoted in
   `DAY_N_NIGHT_STORYBOARD.md`.
3. If a key path, line number, or render site cited in the storyboard has
   moved, the new location is authoritative. The storyboard's line numbers
   were captured early-session and are not maintained.
4. The Night `<section>` in particular may have been substantially
   reworked. Verify the current rendering before applying the § 3.4 Act 3
   layout rebuild.

If you see your previous changes (the ko.json edits) reverted in `git diff`,
that is the parallel session, not a bug. Don't try to re-land them blindly —
walk both sets and reconcile.

---

## 2. Locked decisions — do not relitigate

These are the decisions the user closed during this session. They survive
across handoffs. If you find code or copy that contradicts these, the code/copy
is the thing to change.

### 2.1 Voice — Day n Night surface

**Host identity.** The host is two: **Choi and Choe** — both written `최` in
Hangul, distinguished only in romanisation. The wordmark **`Choi & Choe`** is
the byline that replaces the placeholder `Sean & friend` in `footer.hosts`.
Voice posture: **cheeky, sleek, slightly humorous** — never serious in the
"institutional host" register, never folksy in the "your friend at the door"
register. The phonetic gag (one surname, two romanisations) is part of the
joke; don't explain it.

**The Korean / English rule — load-bearing.** As of 2026-05-20, *all
Korean copy that is not directly informational is wiped and mirrors the
English verbatim.* The decision is the user's, explicitly: prior Korean
editorial copy was reading awkward in their judgement, and the cure is to
not translate it at all. translate only operational UI/UX into Korean - Reference model: **Toss** (the Korean 
fintech) ; they use a friendly, yet well-deliverec and clear voice (게요, 해요 - but not just casual)

This rule supersedes every Korean editorial proposal earlier in this
session, including:

- The KO `opening.body` 4-beat restructure
- The KO `closing.lede` rewrite (`자리를 끌어다 앉으십시오…`)
- The KO `dressCode.*` register fixes
- The KO YM.FM blurb (`오랜 벗. 이 밤이 이런 소리로 흐르는 이유입니다.`)
- The KO YM.FM role line (`바버 · 뮤지션 · 친구.`)
- The KO moodboard caption rewrites
- The KO `tribute.body` register fix (the `깨끗하기만 한 것이…` line)

The earlier KO edits the storyboard's § 7 don't-ship list landed in
`messages/ko.json` are **partially obsolete**: the *register-fix* edits on
informational lines (SurvivalKit, scrubber, audio, location, date, footer)
stay; the *editorial* register-fix and rewrite edits (`opening.body`,
`closing.lede`, `dressCode.*`, `tribute.body`, moodboard captions) **revert
to the English value verbatim.** See § 2.7 for the cut-line.

**`/day-n-night` surface only** — these rules are extensions of `VOICE.md`
for this one surface. Do not apply them site-wide.

### 2.2 YM.FM — the centrepiece of Act 3 (Nighttime)

- **Identity:** `YM.FM` is the musician name. Real-name reference is **Yang
  Min Woo** (handle below). Use `YM.FM` for the brand surface, `@yangminwoo`
  for the link.
- **Relationship framing:** *"A dear friend."* (Not "Sean's friend" — locked.)
- **Role line (en):** `Barber. Musician. Great Dude.`
- **Blurb (en):** *"A dear friend, GOAT barber, and most importantly — a killer DJ."*
- **Korean values for role line and blurb: mirror English verbatim** per § 2.1.
  Both lines are editorial. Do not translate.
- **Handle:** `@yangminwoo` → `https://instagram.com/yangminwoo`.
- **Eyebrow above the credit:** `On the decks` (English only).
- **Where YM.FM is named — locked: only inside Act 3 (Nighttime), never in
  the Liminal handoff.** The Liminal handoff (§ 2.9) triggers his music with
  a click but does not name him. The viewer spends a beat in his house track
  *not knowing whose track it is*; the Act 3 credit block then *answers a
  question the viewer didn't know they had*. **The music is the bridge; the
  name is the payoff.** Naming him in Liminal would re-introduce him in Act 3
  and dilute the cassette moment. One credit, one location.

### 2.3 Audio arc — the immersive view is scored (mixed-model)

The Day n Night immersive view's audio is a **three-track arc** that follows
the new three-act structure (§ 2.8). Each track maps to one act, with one
hard event-driven cut at the Liminal handoff (the cassette button press
inside § 2.9) and at least one scroll-driven crossfade after that.

| Beat                  | Genre         | Asset                                       | Act it scores                          | Transition in                                          |
|-----------------------|---------------|---------------------------------------------|----------------------------------------|--------------------------------------------------------|
| **Daytime**           | Country       | `public/audio/day-n-night/daytime.opus`     | Act 1 — Daytime (1.1, 1.2, 1.3)        | Plays from sound-toggle activation. Click-to-play.     |
| **Sunset / house**    | House         | `public/track_media/Track_3.mp3`            | Act 2 — Liminal handoff onward (2.4+)  | **Event-driven** — fades in on the cassette button-press click inside § 2.9. |
| **Nighttime / house** | Hiphop/house  | `public/audio/day-n-night/nighttime.opus`   | Act 3 — Nighttime, from § 3.x          | Scroll-driven crossfade from Track_3.mp3, timing TBC.  |

**Decision 1 — model: mixed.** Three `<audio>` elements managed by a single
`<DayNNightScore>` controller. The Daytime→Sunset cut is an **event** (the
click). The Sunset→Nighttime cut is a **scroll-driven crossfade**. Mixing the
two models is correct here — the cinematic handoff demands a hard sync to
the button-press SFX; the later transition into nighttime hiphop/house can
breathe across a longer scroll window.

**Decision 2 — cut thresholds:**
- **Daytime → silence:** during § 2.1 the country track fades out across the
  photo torrent; reaches zero by the end of § 2.2 (the held beat).
- **Silence → Sunset (Track_3.mp3):** fires on the cassette button-press
  event inside § 2.9 — not a scroll threshold. Sync to the click SFX frame.
- **Sunset → Nighttime (nighttime.opus):** scroll-driven crossfade, ~1.5s
  window. Threshold proposed against `useDayNNightScene.progress` — re-read
  the current anchor values from `Timeline.tsx` (they may have moved during
  the parallel session's rework), and place the threshold roughly at the
  midpoint of Act 3 so the polaroid scatter / hint copy lands in the same
  track and the YM.FM credit block lands cleanly in the genre that names
  him.

**Decision 3 — where the score lives:** new `<DayNNightScore>` client
component mounted once at the top of `ImmersiveView`. Subscribes to
`useDayNNightScene.progress` for the scroll-driven transitions, and exposes
an imperative API (`onLiminalClick()`) for the § 2.9 handoff to fire the
event-driven cut. **NOT inside the cassette** — the cassette is one of the
score's *visible* controls, not the engine.

**Decision 4 — autoplay vs click-to-play.** Click-to-play (iOS reality +
site policy). The existing sound toggle (`Event.DayNNight.audio.*`) is the
session-level gate — once clicked, audio flows. The § 2.9 cassette button
press is a *second* click only if the user reached § 2.9 without having
activated the toggle yet; otherwise the press purely fires the country→house
cut. Design both paths.

**Decision 5 — cassette behaviour:**
- The cassette is the **visible play/pause control for the global score** —
  one control surface, dressed as a cassette. (Replaces a separate sound
  toggle UI in Act 3, but the toggle remains accessible from Act 1.)
- Pressing play resumes the score from the user's current scroll position;
  pressing pause halts the score; the reels animate to real playback state
  (not just scroll velocity).
- The **whoosh-in animation** at § 2.9 places the cassette on stage; the
  **first button press** is the same input that fires the country→house cut
  via `onLiminalClick()`. After that, subsequent presses are pause/resume
  of the global score.

**Implications retired from the prior spec:**
- The earlier framing ("Track_3.mp3 plays inside Dress, nighttime.opus plays
  inside Night act") is replaced by the three-track / two-transition model
  above.
- The earlier "cassette is the source rendered visible after music has
  already been playing" framing is partially retired: the cassette is now
  the *control surface*, not just the visible source.

### 2.4 Polaroid scatter around the cassette (Act IV right column)

Locked spec (from storyboard §5.7):

- 5–8 polaroids of YM (barber moments, behind decks, candid with Sean,
  portraits). **Placeholders for now** — user said *"later… placeholders
  please."*
- Mixed widths (130–260 px), broad angle spread (±10°), **mixed +/- depth signs**
  for the parallax-drift-in-different-directions effect.
- 1–2 `variant="back"` cards mixed in for ambient clutter.
- Mostly empty captions.
- Mobile: 3 polaroids only (barber + decks + portrait), drop the back-cards.
- **Cuts the current Pulp-Fiction suit/jacket pair** from the Night act
  entirely. (Verify those polaroids still exist in current source before
  removing.)
- Asset dir (when real photos arrive): `public/assets/day-n-night/ym/`.

For placeholder run: use 4–6 of the existing assets in
`public/assets/day-n-night/` (`IMG_5282.png`, `IMG_6339.png`, `IMG_8543.png`,
`IMG_9520.png`, `DraggedImage*.png`). Flag with `// PLACEHOLDER — YM photos
TBC` comments above the array so the next swap is one find+replace.

### 2.5 Tribute block relocation

The "Charred, Scarred & Thriving" tribute (`tribute.heading` +
`tribute.body`) currently renders as a small footer block in the Night act's
lower-right (`Timeline.tsx` Night `<section>`, last child before the
`PolaroidGroup`).

**Move it to the Closing act**, replacing the current `closing.lede` italic
in the left column. Per the storyboard option (a), fold the current
`closing.lede` text *"Pull up a chair. The fire's been waiting."* into the
tribute body as its final beat (so the literary block ends with the
outstretched hand).

Locale string additions:

`closing.lede` key **stays in the JSON** — it's still rendered on
`SimplifiedView.tsx` as the closing italic paragraph. Only its render site in
`Timeline.tsx` (Closing act) is removed.

### 2.6 The KO ↔ EN cut-line — which keys stay Korean, which mirror English

Per § 2.1's rule (KO survives only on directly informational copy). Cross-reference against `messages/{en,ko}.json` `Event.DayNNight.*` namespace.

#### Keep Korean (directly informational — operational UI/UX)

These describe what / where / when / how. **Toss-style functional Korean,**
which per § 2.1's updated reference is *friendly, well-delivered, clear* —
**`~게요` / `~해요` endings are explicitly allowed here, not banned.** The
prior version of this rule (strict 합니다체) is retired. "Not just casual"
is the upper guardrail: polite + warm, not slangy.

This means my earlier § 7 don't-ship list KO edits to `survivalKit.*` (which
purged `~게요`, `~돼요`, `~어요`) may have over-corrected. Walk those keys
against the updated Toss-style rule on the reconciliation pass (§ 3.1) —
the original `누르면 복사돼요` / `여섯 가지만 간단히 알려드릴게요` family is
*closer to target voice* than my "fixed" 합니다체 versions.

Keep the existing KO values where they match the new Toss-style register;
polish only where lines actually break the "not just casual" guardrail.

- `date.weekday`, `date.full`, `date.short`
- `location.label`, `location.neighborhood`, `location.city`, `location.address`
- `act.day.label`, `act.day.time` — the time strip, not the heading/body
- `act.night.label`, `act.night.time` — same
- `included.heading`, `included.food.label`, `included.drinks.label` — labels only; the `.items` values are atmospheric, mirror EN
- `entry.heading`, `entry.amount`, `entry.perGuest`, `entry.method`, `entry.bank`, `entry.accountHolder`
- `survivalKit.heading`, `survivalKit.subheading`, and every `survivalKit.*.{label, value, hint}` — this whole namespace is operational, Toss-style
- `survivalKit.{copy, copied, openMap}`
- `audio.{label, on, off}` — sound toggle UI
- `scrubber.{navLabel, opening, cookout, dress, night, closing}` — nav chrome
- `scrollHint` — UI hint
- `viewToggle.{label, immersive, simplified}` — control labels
- `footer.rsvpClosesAt` — informational status
- `loader.rising` — UI status
- All keys under `Event.Gate.*`, `Event.Guests.*`, `Event.Rsvp.*` — these are functional flows (auth, gate, claim, my, purchase). Keep KO. Apply § 2.1 register polish where it lands.

#### Mirror English (editorial / atmospheric — the wipe applies)

These carry voice / tone / brand. Per the user's decision, the Korean
versions read awkwardly enough that mirroring the English verbatim is
strictly better. Set the KO value identically to the EN value.

- `title` — already English in both
- `opening.kicker`, `opening.lede`, `opening.body`
- `act.day.heading`, `act.day.body`
- `act.night.heading`, `act.night.body`
- `act.night.dj.{name, role, blurb, listenLabel, eyebrow, handle}` (the whole DJ group except where it's a literal label like "Listen")
- `dressCode.heading`, `dressCode.option1.{label, body}`, `dressCode.option2.{label, body}`
- `included.food.items`, `included.drinks.items` — these read as menu descriptors but voice carries the bit; mirror EN
- `tribute.heading`, `tribute.body`
- `closing.kicker`, `closing.lede`
- `rsvpCta.primary`, `rsvpCta.secondary` — Reserve / Small line. Reserve is fine bilingual, but the secondary is editorial; mirror EN
- `footer.hosts` — wordmark `Choi & Choe` per § 2.1; English in both locales
- Every `moodboard.*.{alt, caption}` — all editorial pop-culture commentary

#### Edge cases / judgement calls

- **`rsvpCta.primary` = "예약하기"** today. *Operational* — it's the purchase
  CTA, not editorial. **Keep KO.** This is the one Toss-rule exception that
  matters for conversion. (If the parallel session has wiped it to "Reserve,"
  reconsider — but the default is keep KO here.)
- **`viewToggle.immersive` = "Story" / "Card"** today. Brand wordmarks for the
  toggle. Treat as English in both — already aligned with the rule.
- **`included.drinks.items` includes `(요청 시) 논알콜`** — that fragment IS
  operational (it tells a vegetarian/sober guest non-alc exists). Suggest
  splitting: drinks list (items) mirrors EN; the non-alc availability moves
  into the SurvivalKit or a new operational row. Otherwise the wipe loses a
  real piece of info.
- **`tribute.body`** is the page's strongest paragraph in either locale; the
  wipe means the Korean reader gets it in English. That's the user's call and
  the user has made it.

#### Implementation method

For each "mirror EN" key path: copy the en value byte-for-byte into the ko
slot. `JSON.parse` validates after. No deletions — keys must exist in both
locales for next-intl parity, but identical values are explicitly allowed
on this surface (VOICE.md § 5.7 normally bars this; the § 2.1 exception
governs here, document the exemption in `VOICE.md` if it doesn't already
mention `/day-n-night`).

### 2.7 Dead-key cleanup

The following keys are dead under the redesign and should be deleted from
both locales **in the same diff that lands the Night redesign** (deleting
them before the redesign lands will produce `MISSING_MESSAGE` errors if any
straggler render site is still reading them):

- `Event.DayNNight.act.shift.*` (`label`, `time`, `heading`) — orphan;
  the "in-between times" beat is now collapsed into Night's hero line.
- `Event.DayNNight.act.night.sectionTitle` — unused, "Nightfall" caption.
- `Event.DayNNight.act.night.announcement` — explicitly cut per V8 + audit
  §14.5 (the perfume-tease line reads ominous to KO readers).
- `Event.DayNNight.act.night.dressLabel` — unused, "Dress code, after dark."

Re-grep both locales after deletion to confirm no callsite reads them.

### 2.7.5 Survival Kit redesign — deep-link clusters

The current SurvivalKit is a flat row list (address, payment, dress, host, +1, late). Locked redesign: the three load-bearing rows collapse into **deep-link button stacks**, each backed by a real URI scheme that opens the user into the correct app with the right values prefilled.

#### Cluster A — Map (replaces the address row)
- A small **themed map** embedded inline as the visual anchor (treatment TBC — probably a styled static tile so we don't pay an API key, or a generated SVG with venue dot + neighbourhood outline).
- A column of provider buttons next to / below the map:
  - **Kakao Map** — deep link with destination prefilled, mode = public transit, from = user's current location (or last-known fallback).
  - **Naver Map** — same shape, different URI scheme.
  - **Google Maps** — same shape; for the expat / non-Korean-app subset of the audience.
- All three are routes, not pinned destinations. If location-share is denied, the destination still opens — just without the "from" half of the route.
- URI scheme reference: confirm current Kakao / Naver / Google Maps deep-link specs at implementation. The Kakao Map web→app handoff in particular has changed shape a few times.

#### Cluster B — Bank transfer (replaces the payment row)

**Bank-scheme research resolved (2026-05-20 via `/search-first`):** there is
**no universal cross-bank scheme in Korea in 2025/26.** `bankpay://` is the
KFTC BankPay app specifically, not a multi-bank dispatcher. Kakao Bank, KB,
Shinhan, Hana, Woori, NH, IBK each have private app schemes but none
publicly expose a "transfer with prefilled account+amount" endpoint. The
**de facto pattern is Toss as universal middleware** — `supertoss://send`
covers any Korean bank account as the *destination* because Toss can
transfer from any Toss-linked source to any Korean bank.

**Locked shape for Cluster B:**

1. **Primary CTA — "토스로 송금하기"** — wired to
   `supertoss://send?bank={한글 bank label}&accountNo={digits-only}&amount={krw}&origin=qr`.
   Bank label must be **Korean text, not English, not bank code** (e.g.
   `토스뱅크`, `국민`, `신한`, `카카오뱅크`).
2. **Secondary — copy-to-clipboard block** for the non-Toss minority. Plain
   text rendering of bank name + account number + amount. This is what
   every Korean wedding / event / fundraiser site actually ships, because
   it's the only thing that works for 100% of users.
3. **iOS Safari deep-link gating:** fire the `supertoss://` link from a
   user gesture (click), then set a 1.5s fallback timer — if the scheme
   doesn't resolve (Toss not installed), reveal the copy-block.
4. **Skip Android `intent://` fallback** — `supertoss://` resolves
   natively on Android and the intent-URL form mostly redirects to Play
   Store, which is worse UX than the copy-block.

**Sources captured:** velog.io posts on the Toss URL scheme, kakaopay
developer forum (Kakao Bank explicitly declines to expose this), KFTC
BankPay page (legacy, ignore). Nothing has changed in 2024–2026 that
introduces a universal scheme. KFTC's Open Banking initiative is
server-to-server, not a client-side URL scheme.

#### Cluster C — Contact the hosts (replaces the host row)
- One stack per host. Each host shows: small portrait avatar (placeholder for now) + display name + a row of contact methods.
- Contact methods per host:
  - **Phone** — `tel:+82-…` opens dialer
  - **KakaoTalk ID** — deep link to the chat (e.g. `https://qr.kakao.com/talk/…` or the Kakao deep-link scheme); needs each host's KakaoTalk ID
  - **Email** — `mailto:…`
- Use Choi & Choe identity from § 2.1 for the display names where possible.

#### Rows that stay flat
- Dress code (if it still lives in the Kit at all — note that § 2.8 § 1.3 moved Dress code into Act 1 of the immersive view; revisit whether the Simplified View needs a duplicate row here)
- +1 policy
- Late arrival policy

#### Open questions — all resolved 2026-05-20
1. ✅ **Host roster: TWO.** Sean Choi + (Choe — name TBC in fill-in sheet). § 2.1's "Choi & Choe" wordmark stands.
2. ✅ **Korean inter-bank scheme:** no universal layer. Toss-only + copy-to-clipboard fallback. See above, this section.
3. ✅ **Map theming:** use the **shadcn map registry component.** User flagged it exists; next session installs from the shadcn registry rather than picking between static tile vs SVG vs live tile from scratch. Anchor on that component's defaults; theme to match the surface only if the registry-provided theme is off.
4. ✅ **Contact data (phone, Kakao IDs, portraits):** committed to the repo, not env-shimmed. Sean: "just post them. I have mine displayed on the site footer anyway." See § 2.7.6 sensitive-data decision.

#### Fill-in sheet
The structured config + asset values needed for Cluster A/B/C are captured
in **`readmes/DAY_N_NIGHT_FILL_IN.md`** — a markdown form for Sean to fill
in. Next session transcribes the filled values into
`survivalKit.config.ts` per § 2.7.6.

### 2.7.6 Survival Kit source of truth — structured config + codegen

The contact info, bank details, map deep-link parameters, and host data
should **not** live as scattered i18n keys.* They should live in **one typed
TypeScript config file** at the top of the SurvivalKit feature, with a
codegen step that produces the necessary i18n entries from it.

> \* Reason: the values are not really "copy" — they are structured data
> (phone numbers, account numbers, URI templates, image paths). Treating
> them as i18n strings means every value gets a key path twice (en + ko),
> none of it gets static typing, and PII / financial info ends up sprinkled
> across two JSON files.

#### Config shape (proposal)

```ts
// src/components/sections/DayNNight/survivalKit.config.ts
// Single source of truth. Edit here; run codegen to update i18n.

export const SURVIVAL_KIT_CONFIG = {
  venue: {
    coords: { lat: 37.xxxx, lng: 126.xxxx },
    address: "Sowol-ro 20-gil 64, 3F",
    addressKr: "소월로20길 64, 3층",
    kakaoSearchString: "…",
    naverSearchString: "…",
  },
  maps: [
    {
      slug: "kakao",
      displayName: "Kakao Map",
      deepLinkTemplate: "kakaomap://route?…",
      webFallback: "https://map.kakao.com/?…",
    },
    {
      slug: "naver",
      displayName: "Naver Map",
      deepLinkTemplate: "nmap://route?…",
      webFallback: "https://map.naver.com/?…",
    },
    {
      slug: "google",
      displayName: "Google Maps",
      deepLinkTemplate: "https://www.google.com/maps/dir/?api=1&…",
      webFallback: null, // already a web URL
    },
  ],
  payment: {
    bankName: "Toss Bank",
    accountNumber: "1002-5436-0906",
    accountHolder: "리스토어드프로젝트",
    amount: 65000,
    currency: "KRW",
  },
  banks: [
    {
      slug: "toss",
      displayName: "Toss",
      deepLinkTemplate: "supertoss://send?bank={bank}&account={account}&amount={amount}",
    },
    // Add others if the inter-bank scheme lands.
  ],
  hosts: [
    {
      slug: "sean",
      displayName: "Sean Choi",
      portraitPath: "/assets/day-n-night/hosts/sean.jpg",
      phone: "+82-…",
      kakaoTalkId: "…",
      email: "…",
    },
    // …
  ],
} as const;
```

#### Codegen script

- Location: `scripts/dn-survival-kit-codegen.ts`.
- Reads the config above.
- Generates a fixed key tree under `Event.DayNNight.survivalKit.config.{venue.address, hosts.{slug}.displayName, banks.{slug}.displayName, maps.{slug}.displayName, …}` — but only the **display strings**, never phone numbers, account numbers, or deep-link templates (those are read directly from the config at runtime).
- Writes into both `messages/en.json` and `messages/ko.json` under the same key paths. KO mirrors EN per § 2.1.
- Idempotent: re-running with no config change is a no-op. Re-running after a config edit produces a minimal diff.
- Wire into `package.json`: `"dn:survival-codegen": "tsx scripts/dn-survival-kit-codegen.ts"`.

#### File-watch trigger (WebStorm)

WebStorm has a built-in **File Watcher** under
*Preferences → Tools → File Watchers*. Configure:

- **Name:** `Day n Night Survival Kit codegen`
- **File type:** TypeScript
- **Scope:** `Project Files` filtered to `src/components/sections/DayNNight/survivalKit.config.ts`
- **Program:** path to `pnpm` (e.g. `/opt/homebrew/bin/pnpm`)
- **Arguments:** `dn:survival-codegen`
- **Output filters:** none required (the script writes JSON; no special parsing).
- **Working directory:** `$ProjectFileDir$`
- **Trigger:** "Auto-save edited files to trigger the watcher"

So: edit `survivalKit.config.ts` → save → file watcher fires → codegen updates `messages/{en,ko}.json` → next-intl picks up the new strings on dev-server reload.

Optional CI gate: `pnpm dn:survival-codegen --check` mode that exits non-zero if the generated JSON drifts from what's committed; runs in pre-commit / CI.

#### What lives where after this lands

| Type of data | Where it lives | How it's consumed |
|---|---|---|
| Phone numbers, KakaoTalk IDs | `survivalKit.config.ts` | imported by the contact-cluster component directly |
| Bank account, amount | `survivalKit.config.ts` | imported by the bank-cluster component; deep-link URLs constructed at runtime |
| Map coords, deep-link templates | `survivalKit.config.ts` | imported by the map-cluster component |
| Display names ("Kakao Map", "Sean Choi") | generated into `Event.DayNNight.survivalKit.config.*` keys | normal `useTranslations()` lookup |
| Operational copy (labels, hints) | hand-written in `messages/{en,ko}.json` under `Event.DayNNight.survivalKit.*` | normal `useTranslations()` lookup; KO can keep its register-fixed values per § 2.6 |

#### Sensitive-data decision — locked

**Commit phone numbers / KakaoTalk IDs / emails to the repo as plain TypeScript values.** Per Sean (2026-05-20): "just post them. I have mine displayed on the site footer anyway." No `.env.local` shim, no env-var indirection. The values are already public on the site footer; bundling them into `survivalKit.config.ts` adds no additional exposure.

### 2.8 The three-act structure — locked

This replaces the prior five-act model (Opening / Cookout / Dress / Night /
Closing). The new structure has three named acts, each with explicitly-named
subsections. Section titles are now **plain and unmistakable** — no obscure
naming, no cheeky labels. Picking a label that doesn't describe its
contents is retired as a design choice on this surface.

```
Act 1 — Daytime — "the essentials"
  1.1 Intro             First copy on stage. The invitation.
  1.2 Details           Venue info beyond just address — price, payment
                        method, address (incl. literal Kakao Map /
                        Naver Map search string), times, food briefly,
                        drinks briefly.
  1.3 Dress code        Plain copy ("wear whatever you want" register —
                        the prior cheeky/verbose draft is retired) +
                        past-attendee outfit photos. Doubles as
                        informational (what to wear) and atmospheric
                        (faces from past nights).

Act 2 — Liminal — "the segue" — the pacing dial
  2.1 Friends torrent   Gliding past-event photos, multi-z-depth,
                        darkened canvas. Soft-sell via faces.
                        Blinking-caret / typewriter caption carries a
                        short line about returning friends + new
                        connections. Sun-set progress PAUSED here.
                        Real-estate-flexible — stretches to tune the
                        sunset pacing.
  2.2 The reveal        Photos clear, darkening lifts, sun-set
                        accelerates. Subtitle lands cinematically:
                        "The sun is setting."
  2.3 The held beat     ~4s. Silence. Full sunset colour progression.
                        Don't fill the silence.
  2.4 The handoff       Cassette whooshes up from bottom. Subtitle
                        morphs to "Time for a change of pace."
                        Button press + click SFX. House music
                        (Track_3.mp3) fades in. *** YM.FM NOT NAMED. ***

Act 3 — Nighttime — "the payoff"
  3.1 The naming        First copy on stage names what the viewer has
                        been hearing for a beat: "On the decks. YM.FM."
                        + role line + blurb + @yangminwoo handle.
                        The cassette stays on stage — same object
                        that whooshed up in § 2.9.
  3.2 The hint          Elliptical, grounded copy: something one-time
                        only, not even from us, ever again.
                        (Real: the one-off perfume + "NOT FOR SALE"
                        baked into the label. Never named on surface.)
  3.3 Polaroid scatter  5-8 polaroids around the cassette per § 2.4.
  3.4 Closing handoff   Tribute block ("Charred, Scarred & Thriving"
                        + body, with "Pull up a chair…" folded in as
                        final beat) per § 2.5. RSVP CTA. End.
```

**The cinematic register is now an explicit voice ruling for this surface.**
The whole experience is composed as cinema, not as a microsite. Subtitle-style
cue cards, scored audio with intentional silences, paced beats with held
moments. This sits above the V1-V8 rulings of § 2.1 — when in doubt, choose
the more cinematic option, not the more web-conventional one.

### 2.9 The cinematic handoff — frame-by-frame timeline (~10s)

The Liminal → Nighttime handoff is a single composed sequence, not three
acts independently handing off. **All layers (sky, photos, audio, captions,
cassette, SFX) must be driven from the same timeline source** — likely a
GSAP timeline anchored to this section's scroll-through, layered on top of
the existing `useDayNNightScene.progress`. Implementing the layers as
independent components watching independent state will desync them; do not
go that route.

**The linkage rule.** Sun-set speed, sky saturation/tone, and photo torrent
speed are all driven off the same timeline. During the photo torrent the
sun-set progress is **drastically slowed** (sky is hidden anyway under the
darken overlay + photo flood — progress is "saved"). When the torrent
clears, sun-set progress **accelerates** so the change becomes visible
exactly when the viewer can see the sky again. Conserved budget, spent
when it can be appreciated.

**Frame-by-frame (T relative to torrent's last batch crossing center):**

| T | Sky / sun | Photos | Darken | Country | House | Caption | Cassette | SFX |
|---|---|---|---|---|---|---|---|---|
| **0.0s** | starts accelerating | last batch at centre | starts lifting | fading toward 0 | silent | — | off-stage | — |
| **0.0 → 2.5s** | blue → yellow-orange tint | clearing | gone by 2.5s | reaches 0 | silent | — | off-stage | — |
| **2.5s** | yellow-orange visible | cleared | — | silent | silent | **"The sun is setting."** (subtitle in) | off-stage | — |
| **2.5 → 6.5s** | yellow-orange → full sunset red/orange | — | — | silent | silent | (held) | off-stage | — |
| **6.5s** | full sunset | — | — | silent | silent | (still held) | **whoosh up from bottom (~0.5s)** | — |
| **7.0s** | full sunset | — | — | silent | silent | (held) | on stage | — |
| **7.5s** | full sunset | — | — | silent | **fades in on this frame** | morphs to **"Time for a change of pace."** | button-press animation peaks | **click** (mechanical cassette SFX, ≤200ms) |
| **7.5s+** | (transitions to night) | — | — | — | playing | — | on stage (held into Act 3) | — |

**Key principles for implementation:**

1. **One timeline.** Sky, photos, audio fades, caption transitions, cassette
   entrance, and the click are all timed off the same source. GSAP timeline
   recommended — it has the precise scrubbing + label-anchoring this needs.
2. **The "saved" sun budget.** The existing sky-colour stops in the scene
   store need to be re-keyed against this section's progress rather than
   linear scroll — or the Liminal section needs its own progress channel
   that the sky listener subscribes to.
3. **The click is a real audio event.** Mechanical cassette-button click
   sample, ≤200ms, plays on the same frame the button-press animation
   peaks. Asset prereq: a clean click sample, ideally mastered to sit just
   under the house track's incoming level so it punches without clipping.
4. **Silence is content.** The ~4-second held beat between the subtitle and
   the cassette entrance has no music, no movement, no chrome. The
   temptation will be to fill it. Don't.
5. **The handoff happens once per session.** After § 2.9 has fired, the
   cassette stays on stage; subsequent scrolls back up into Liminal should
   not re-fire the whoosh-in or the click SFX — only the visual sky / photo
   states should reverse. Cache a "handoff complete" flag.
6. **Reduced motion.** Under `prefers-reduced-motion`: skip the cassette
   whoosh (instant on-stage), skip the subtitle animation (instant copy
   change), keep the audio fade (audio isn't motion). Re-evaluate when
   building.

**Asset prerequisites for § 2.9 to ship:**
- A mechanical cassette-click SFX, ≤200ms, in `public/audio/day-n-night/cassette-click.{mp3,opus}`.
- The country and house tracks already live where § 2.3 specifies.
- Subtitle copy: the two strings *"The sun is setting."* and *"Time for a
  change of pace."* are editorial English per § 2.1 — KO mirrors EN
  verbatim. Add under a new `Event.DayNNight.liminal.{sunsetSubtitle, changeOfPace}` namespace, or wherever the cinematic-handoff component reads from.

---

## 3. What's specified but not yet implemented

In rough priority order. Each item below is a unit of work that can be picked
up independently once §1's verification step has happened.

### 3.1 KO reconciliation pass (partially done + scope-changed)
Twenty Korean-side fixes landed earlier this session against
`messages/ko.json` (register purges on operational lines, V5 ports, the
`opening.body` orphan-period strip, moodboard caption rewrites). **Under
the § 2.1 mirror-EN rule, the editorial subset of those edits is now
obsolete** — see § 2.6's "Mirror English" list. Walk:
1. The "keep KO" key paths (§ 2.6) — confirm the register fixes landed cleanly, polish anything the parallel session reverted.
2. The "mirror EN" key paths (§ 2.6) — overwrite each KO value with the EN sibling byte-for-byte.
The atticed `.attic/readmes/DAY_N_NIGHT_STORYBOARD.md` § 7 still documents the per-string current-state at session start if you need a starting
spec. No `en.json` edits landed.

### 3.2 Act 3 (Nighttime) i18n key changes
- Rewrite `Event.DayNNight.act.night.heading` → `"The room turns."`
- Rewrite `Event.DayNNight.act.night.body` → `"The grill goes cold. The lights come down. Something quieter takes over the speakers."`
- Add the new `Event.DayNNight.act.night.dj.*` group — see § 2.2 for locked strings.
- Both heading and body **mirror EN in KO** per § 2.6 (editorial). The dj group also mirrors.
- Delete keys listed in § 2.7.

### 3.3 Tribute → Act 3.4 closing handoff
- Append the "pull up a chair" beat to `Event.DayNNight.tribute.body` in EN; KO mirrors per § 2.6.
- In `Timeline.tsx`'s current Closing `<section>` (which maps to Act 3.4 under the new act naming), replace the `<p>` that renders `t("closing.lede")` with a block that renders `t("tribute.heading")` above `t("tribute.body")`.
- In the current Night `<section>` (maps to Act 3.1–3.3), remove the existing tribute footer block.
- **Caveat for naming.** The current `Timeline.tsx` source still uses the old 5-act file structure (Opening / Cookout / Dress / Night / Closing `<section>`s). The new three-act outline (§ 2.8) is the *narrative model*; the JSX may or may not be refactored to match. Decide before you start. Renaming JSX sections to match § 2.8 is a bigger refactor than the current edits need.

### 3.4 Act 3 layout — right column rebuild
- Remove the existing two-polaroid (suit + jacket) `<PolaroidGroup>` in the current Night `<section>`'s right column.
- Replace with: vertical stack of (a) the polaroid scatter per § 2.4; (b) `<Tape3DScene>` cassette as centrepiece; (c) the DJ credit block rendering `act.night.dj.{eyebrow, name, role, blurb, handle}` with the handle linking to `instagram.com/yangminwoo`.

### 3.5 Audio score (`<DayNNightScore>`) — the new big one
The three-track arc + mixed-model transition design (§ 2.3) is net-new
work. Five decisions captured at § 2.3 are now resolved with
recommendations. **Recommended starting point:**

- Build a `<DayNNightScore>` client component under `src/components/sections/DayNNight/Immersive/`.
- Subscribes to `useDayNNightScene.progress` for the scroll-driven Sunset → Nighttime crossfade.
- Exposes an imperative `onLiminalClick()` API for the event-driven Daytime → Sunset cut fired by the § 2.9 cassette button press.
- Three `<audio>` elements with `preload="metadata"`. Genre/asset mapping per § 2.3 table.
- Crossfade via Web Audio `gainNode` ramp or simple `volume` ramping across a 1–2s window. Hard cut on the event-driven Daytime → Sunset transition.
- Mount once inside `<ImmersiveView>` — not inside `Timeline.tsx`.
- Gate audio playback behind a single user-initiated click (the existing sound toggle OR the § 2.9 cassette press, whichever happens first).

### 3.6 Cinematic handoff (`<LiminalHandoff>`) — the choreography
Per the frame-by-frame timeline in § 2.9. New, distinct from § 3.5.

- Build a `<LiminalHandoff>` client component that owns the GSAP timeline coordinating: sky-progress override (paused → accelerated), photo torrent, darken overlay, subtitle morph, cassette whoosh-in, button-press animation, click SFX, audio handoff trigger.
- The component does **not** own the audio — it calls `<DayNNightScore>.onLiminalClick()` at the precise frame the click SFX plays.
- Place the cassette mount inside this component (not in Act 3's section) — the cassette is choreographed in here, then "stays" on stage into Act 3 visually. After the handoff fires, an Act 3 component reads the cassette's now-on-stage state and shows the credit block next to it.
- Reduced-motion path: instant cassette on-stage, instant caption swap, keep audio fade. No whoosh, no animated subtitle.
- Idempotency: cache a "handoff complete" flag so scroll-back doesn't re-fire the whoosh or click SFX. Audio remains in the post-handoff state.

### 3.7 Placeholder polaroid wiring
Per § 2.4: pick 4–6 existing assets from `public/assets/day-n-night/` for placeholders, mark with `// PLACEHOLDER — YM photos TBC` comments. Use the existing `Polaroid` + `PolaroidGroup` primitives — no new code path needed.

### 3.9 Survival Kit redesign + codegen

Per § 2.7.5 (deep-link clusters) + § 2.7.6 (structured config + codegen).
Split into three diffs:

**3.9.a — Config + codegen scaffolding**
- Create `src/components/sections/DayNNight/survivalKit.config.ts` with the
  shape proposed in § 2.7.6. Leave sensitive fields (phone numbers, Kakao
  IDs) as `TODO` strings; lock the type signature.
- Create `scripts/dn-survival-kit-codegen.ts`. Reads the config, writes
  display strings into `Event.DayNNight.survivalKit.config.*` in both
  locales. Idempotent, `--check` mode supported.
- Wire `pnpm dn:survival-codegen` script.
- WebStorm File Watcher config documented in § 2.7.6 — leave a one-line
  README pointer in the script for new contributors.
- No UI changes in this diff. Just the plumbing.

**3.9.b — Cluster components**
- `<SurvivalKitMapCluster>` — **install the shadcn map registry component** (`pnpm dlx shadcn@latest add <map-component-from-registry>` — verify the exact registry name at install time). Reads coords from the config. Provider button column (Kakao / Naver / Google) reads deep-link templates from the config. Builds URLs at runtime; never hard-codes account numbers / coords in JSX.
- `<SurvivalKitBankCluster>` — Toss CTA + amount/account display + copy-to-clipboard fallback block. Per § 2.7.5 Cluster B locked: no "other banks" buttons; Toss-only + clipboard is the universal pattern. iOS-Safari 1.5s fallback timer that reveals the copy-block if `supertoss://` doesn't resolve.
- `<SurvivalKitHostCluster>` — per-host stack with portrait + contact rows (phone, KakaoTalk, email). Two hosts (Choi + Choe) driven by the config array; resilient if the roster ever grows.
- Each cluster is its own file under `src/components/sections/DayNNight/SurvivalKit/clusters/`.

**3.9.c — Wire into the existing `SurvivalKit.tsx`**
- Replace the existing address / payment / host rows with the three new
  cluster components.
- Keep the existing dress / +1 / late rows as flat rows.
- Decide: does the dress row stay on Simplified View at all, given that
  Act 1.3 of the immersive view now carries Dress code? Probably yes —
  Simplified is the "facts card," it should be self-contained — but
  confirm before shipping.

#### Asset / data prereqs
All captured in **`readmes/DAY_N_NIGHT_FILL_IN.md`** (the fill-in sheet) —
hosts, venue coords, payment, audio, subtitle copy, photos. Filling that
sheet unblocks 3.9.a + 3.9.b + 3.9.c.

Map theming: install the **shadcn map registry component** (per § 2.7.5
open Q3 lock). Theme matches the surface only if the registry's default
theme is off.

Sensitive-data: locked to "commit to repo" per § 2.7.6.

### 3.8 Act 2 (Liminal) — the friends-torrent component
Per § 2.8 § 2.1. Multi-z-depth gliding past-event photos with darkened
canvas. The user explicitly flagged that this pattern is common enough to
have a battle-tested reference and asked the next session to **find an
anchor pattern before implementing**. Don't invent.

- Goal: ~5–12 photos at any given moment, multiple z-depths, smooth glide,
  darkened canvas, sleek transition in / out.
- Caption: blinking-caret / typewriter style. One soft-sell line about
  returning faces and new connections. EN only (KO mirrors per § 2.6).
- Real-estate stretchable: this section sets the pacing for the sunset
  transition. Tune the scroll length to match the desired sunset duration.
- Photos: past-event photos. Sean to curate the set.

---

## 4. Storyboard — atticed

The earlier `readmes/DAY_N_NIGHT_STORYBOARD.md` is no longer authoritative.
Moved to `.attic/readmes/DAY_N_NIGHT_STORYBOARD.md` on 2026-05-20. Everything
load-bearing was lifted into § 2 of this handoff before the move; what
remained were screen-by-screen KO editorial polish proposals that the § 2.1
mirror-EN rule has retired. If you need the per-string current-state-at-
session-start snapshot for diff archaeology, the atticed file is still in
git — read it, don't re-promote it.

---

## 5. Coupling caveat — TapePlayer and HideawayFM

A non-obvious gotcha for whoever implements § 3.4 / § 3.5:

`src/components/UX/TapePlayer/visuals/TapeModel.tsx` is **tightly coupled to
the site-wide HideawayFM provider**. Specifically, lines around the top of
the component call `useNowPlaying()` and `usePlayState()` from
`@/providers/HideawayFM/hooks` — meaning the cassette's display marquee,
reel-spin behaviour, and play/pause button animations all derive from
HideawayFM's global state, not from a prop.

**Three possible paths**, in increasing order of effort:

1. **Use the cassette as cosmetic only.** Render `<Tape3DScene>` for the
   visual; manage `nighttime.opus` (or the global score) via a separate
   `<audio>` element that has no connection to HideawayFM. The cassette's
   reel-spin still animates (it's driven by scroll velocity, not playback),
   the display marquee shows HideawayFM's default text. Cheapest. Slightly
   incoherent if the cassette is "playing" while HideawayFM is silent.

2. **Inject the Day n Night score into HideawayFM as a track.** Add
   `nighttime.opus` (or all three tracks) as entries in HideawayFM's
   catalogue, set as the now-playing on Day n Night mount, restore on
   unmount. Coherent but couples the surfaces — visiting `/day-n-night`
   would change global playback state.

3. **Decouple `TapeModel` with an optional override prop.** Add
   `audioSource?: { artist; title; play; pause; isPlaying }` to
   `TapeModel`; when set, bypass the HideawayFM hooks. Cleanest, but a
   refactor on a load-bearing 800-line file. Schedule as its own diff if
   pursued.

The recommendation for the May-24-anchored timeline is path (1) for the
first ship, with a follow-up note in `DAY_N_NIGHT.md` § 13 logging it as
debt to revisit via path (3) post-event.

---

## 6. Order of work for the next session

Assuming the parallel session has paused or merged its work in:

1. **Reconcile current state** (`git status`, `git diff`, walk all six dirty files from the original snapshot + this session's KO edits).
2. **Confirm audio architecture** with the user (§ 2.3 — five decisions, all with recommendations). The mixed-model (event-driven Daytime→Sunset + scroll-driven Sunset→Nighttime) is the proposal.
3. **Land § 3.1 + § 3.2 + § 3.3** as one i18n diff — pure JSON, no code. Apply the § 2.6 mirror-EN cut-line. Add new `act.night.dj.*` keys + new `liminal.{sunsetSubtitle, changeOfPace}` keys per § 2.9. Delete dead keys per § 2.7.
4. **Land § 3.4 + § 3.7** as one `Timeline.tsx` diff — Act 3 right-column rebuild with cassette + scatter (placeholders).
5. **Land § 3.8** — the Liminal `<FriendsTorrent>` component. Find a reference pattern first, don't invent. Photos curated by Sean.
6. **Land § 3.5** — the `<DayNNightScore>` audio score component.
7. **Land § 3.6** — the `<LiminalHandoff>` choreography. Depends on § 3.5 (calls `onLiminalClick()`) and on § 3.4 (cassette mount). Land last.

Each of these can be reviewed independently. Don't bundle them.

---

## 7. Things the user has said this session, verbatim (last 5 turns)

So the next session has the user's voice without paraphrase:

- *"I think we need to first define the intention, which would allow us to then identify the contents, then group them, then decide the order and granular presentations, then how to better convey the intentions."*
- *"There's some crucial content missing here — for one, the section where the day-to-night change takes place — where currently is quite empty with 'Dress to impress' or something — should have the contents swapped to a brief mention of a dj session by YM.FM, a close friend and barber of mine."*
- *"this would be where some of the things like @src/components/UX/TapePlayer/visuals/ 3d component can be used for fun engaging experiences."*
- *"Let's make it less 'seans friend' and more 'Our dear friend'. Add buncha pictures — polaroids, they need to be extra natural and feel spread out, kinda messily, and moving all in slightly different directions and distances."*
- *"Make profile 'Barber. Musician. Great Dude.' instagram handle yangminwoo — we can maybe grab some pics? the audio would be @public/track_media/ → anything under here."*
- *"1. audio track : @public/track_media/Track_3.mp3 . 2. later… placeholders please. 3. do that."*
- *"Hold on — another session's working on the same page as we speak. Create a handoff doc … also: the audio then flows like this: daytime : country @public/audio/day-n-night/daytime.opus → sunset: house @public/track_media/Track_3.mp3 → nighttime: hiphop/house @public/audio/day-n-night/nighttime.opus"*
- *"all copies that are not directly informational are all to be wiped of their korean vers and just mirror the en. this is due to how retarded and autistic you sound when using Korean."* (the source of § 2.1's KO mirror-EN rule)
- *"We display a link, and then we've moved out of the moving parts. And we just say, again, the sun's setting. You know, like a subtitle kind of a way. In the cinematic. The whole experience here is supposed to be cinematic. That's the thing I'm going for."* (the source of the cinematic register ruling in § 2.8)
- *"there might be something at… we are preparing, we have prepared something quite special, quite unique. What we will experience or what we will give, provide you, you will not be able to ever get it anywhere ever again."* (the source of § 2.8 § 3.2's elliptical perfume hint)
- *"The host is two: Choi and Choe (both 최 in Hangul). Choi&Choe - make it cheeky, sleek, but humorous."* (the source of § 2.1's host identity)
- *"the dress code part, now that I think of it, belongs on the daytime section. So here's what daytime, liminal, night really is, like, a label for. Daytime is essentially the part where we just give you the most essential information."* (the source of § 2.8's act-naming + dress-code relocation to Act 1.3)
- *"half of YMFM is in Liminal, half is in nighttime"* — then locked to **Reading B**: *"Liminal hands off the sound. Nighttime hands off the name. The music is the bridge between them."* (the source of § 2.2's "one credit, one location" lock)

---

## 8. Files modified by this session

For the diff archaeology:

- `readmes/DAY_N_NIGHT.md` — added one cross-reference paragraph to § 11 pointing at the storyboard.
- `readmes/DAY_N_NIGHT_STORYBOARD.md` — created from scratch (~600+ lines). New file.
- `readmes/DAY_N_NIGHT_HANDOFF.md` — this file. New file.
- `messages/ko.json` — ~20 string edits across the `Event.DayNNight.*` namespace (§ 7 of the storyboard).

No other files modified. No new components, no new assets.

---

*Authored 2026-05-20 by the session that drafted the storyboard. Hand-off
triggered by the user noting a concurrent session on the same surface.*
