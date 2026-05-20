# Day n Night — Copy Storyboard

> **What this is.** Screen-by-screen walk of the entire `/day-n-night` surface
> (plus `/tickets/day-n-night`, `/day-n-night/{guests, my, claim}`), critiquing
> the existing English and Korean copy, filling the blanks, and proposing the
> additions that the audit's product-lens flagged but never specified.
>
> Companion to `DAY_N_NIGHT.md` (architecture / iteration log) and `VOICE.md`
> (the rules these proposals are measured against). When a proposal contradicts
> `VOICE.md`, VOICE.md wins — flag it and we adjust here.
>
> **How to use.** Read top to bottom once. Then treat the *Don't-ship list*
> (§ 7) as a hit-list — those are the lines that will land badly in front of a
> Korean monolingual reader or a first-time guest. Implement those first; the
> rest of the storyboard is polish.

---

## 0. Scope & status

- **Surface owner:** Sean. All final copy decisions are his.
- **Audience split:** ~70% Korean monolingual or Korean-primary, ~30% English-primary expats. The Korean voice carries more weight than the English on this surface, against site default.
- **Date sensitivity:** event May 24. Storyboard is intentionally over-spec'd so polish can run in parallel with launch logistics.
- **Not in scope:** code architecture, animation, layout. See `DAY_N_NIGHT.md` for those.

---

## 1. Surface map

```
/day-n-night                          gate → simplified | immersive
  ├── (gate)                          Event.Gate.*
  ├── Simplified view                 SimplifiedView.tsx
  ├── Immersive view                  Timeline.tsx
  │     ├── I.  Opening               Daybreak / hero
  │     ├── II. Cookout               Day side / grill
  │     ├── III.Dress                 Two-room corridor
  │     ├── IV. Night                 Sundown / cocktails
  │     └── V.  Closing               RSVP CTA / bookend
  ├── /guests                         Credits-style RSVP roll
  ├── /my                             Purchaser dashboard
  └── /claim/[token]                  Gift-ticket recipient

/tickets/day-n-night                  4-step purchase flow
  ├── Welcome
  ├── OTP (Brevo)
  ├── Name on the door
  └── Reserve / Purchased
```

Every screen below is keyed to its `messages/{en,ko}.json` namespace and the
component path that renders it.

---

## 2. Voice rulings that apply across the whole surface

These are the editorial decisions to make once, then enforce everywhere.
Every proposal in §3–6 inherits them.

| # | Ruling | Why |
|---|---|---|
| V1 | **The host's voice is "we"**, not "The Hideaway." This surface is a personal invitation, not an institutional one. VOICE §2.4's "The Hideaway" rule is suspended here. | The event is hosted by Sean & friend in their personal capacity. The site-wide brand voice would read as cold for a backyard rooftop dinner. |
| V2 | **No "Day n Night" translation.** Brand-locked. Per §4.1 glossary. | Already correct in both locales. |
| V3 | **Korean register is 합니다체 (Register B / §3.5.2)**, with one allowed leak into Register A `~기` on CTA labels. The SurvivalKit currently uses 해요체 (`복사돼요`, `열어둘게요`) — that has to go. See § 7. | The audience is older-skewing (the "30 & smokin'" cohort + their friends) and the surface is a paid private event. Café register reads cheap. |
| V4 | **No exclamation marks, no `~세요`, no `~요`, no `~!`, no emoji.** VOICE bans, restated because the current copy violates each. | See § 7 hit-list. |
| V5 | **Numerals always.** "5월 24일" not "오월 이십사일." Already mostly right. | VOICE §2.2 / §3.3. |
| V6 | **Korean fragments outperform full sentences for status / label lines.** Use them. (§3.1.2 "omission advantage.") | Several current strings are full sentences where a fragment would land cleaner. Examples in §3. |
| V7 | **Tone unevenness is the #1 problem.** The English carries the bit pretty well; the Korean swings between literary (`tribute.body` — strong) and convenience-store-app (`survivalKit.late.value` — wrong). Even out before launch. | The audit's "this is complicated" and "you should already know" failures (§14.5 of DAY_N_NIGHT.md) both compound when the Korean voice keeps changing register on the reader. |
| V8 | **Pop-culture references are Western-coded.** Add one Korean reference somewhere in the moodboard (Dress or Night). Open § 5 § Q1. | "30 & smokin'" + Pulp Fiction + The Dude + Romeo+Juliet reads as a foreigner's playlist to a Korean attendee who isn't part of that cohort. The audit flagged this. |

---

## 2.5 Intention-first frame — what each act is actually for

Before any per-screen polish, the surface needs a one-sentence answer to: *what is each act doing, and what do we want the guest to feel as they leave it?* Without that, the surface is five well-decorated rooms in a row. With it, it's an arc.

### 2.5.1 The whole-surface intention

> **"Come stand in the smoke with us."**

A personal invitation from Sean & friend to a private rooftop dinner that turns into a private rooftop night. The arc is the room itself changing — daybreak to nightfall, hospitality to intimacy, smoke to sound.

Everything that doesn't serve that intention is decoration. Everything that does should be unmistakable.

### 2.5.2 Per-act jobs

Each act delivers one beat of the larger intention and ends with one feeling. If the act has more than one job, it's two acts in a trench coat — split or cut.

| Act | One-line job | Artifact | Feeling on exit |
|---|---|---|---|
| **I. Opening** | The invitation. *Come stand here.* | The line "We're turning 30 with stories to show for it." | "I want to be there." |
| **II. Cookout** | Hospitality. *We'll feed you.* | The food/drink list + the grill closing at 19:50. | "I know what I'm walking into." |
| **III. Dress** | Permission. *Wear what you'd otherwise apologise for.* | "One rule: don't dress your age." | "I have something I want to put on." |
| **IV. Night** | **The room turning.** *The lights drop, the music takes over, YM.FM is on the decks.* | **The TapePlayer 3D cassette, playing a YM.FM tease.** A real artifact, not a metaphor. | "I want to be in that room when that mix is playing." |
| **V. Closing** | The bookend. *Take the link, send the link.* | The RSVP CTA + the guests-link. | "I'm reserving now." |

The Night job is the one currently miscast. Today it tells the guest *what to wear* ("Sharp. Chic. Dressed to impress.") — which is Dress's job, an act earlier, and which contradicts Dress's actual rule. The fix is to give Night its real subject: **the music, and the friend playing it.**

### 2.5.3 Content → grouping → order → presentation

The four-step refactor the user asked for, applied:

| Step | For this surface |
|---|---|
| **1. Intention** | "Come stand in the smoke with us." |
| **2. Identify contents** | Date + place. The food. The drinks. The dress rule. The DJ + the cassette. The host voice. The RSVP. Survival kit. Guest list. Payment. Late/parking/dietary/refund/audio FAQs. |
| **3. Group** | Editorial chrome (date/host/closing) vs. **the five experiential beats** (cookout, dress, DJ-night, closing) vs. operational (survival kit, FAQ, /my, /claim) vs. discoverability (/guests). |
| **4. Order** | Editorial chrome wraps. Experiential beats are the immersive view, in chronological order. Operational sits below the RSVP CTA on Simplified only. Discoverability is one small link from Closing + Simplified. |
| **5. Presentation** | Immersive: horizontal-pinned scroll, one act per pin. Simplified: vertical card. Operational: collapsible / inline rows, never above the fold. The DJ moment is the **only** experiential beat that earns an interactive 3D artifact (the TapePlayer). The cookout's polaroids, the dress moodboard, the night moodboard — those are atmosphere; the cassette is content. |

Treat that hierarchy as load-bearing: one interactive artifact, in one act, doing the act's actual job. More than one cassette-grade interaction across five acts and the surface stops feeling editorial and starts feeling like a portfolio site.

---

## 3. Storyboard

Each subsection: **Now** → **Polish** → **Why** → **Path**.
"Polish" is a proposal, not a fait accompli. Disagree freely — that's why this
is a doc.

### 3.1 Gate (Event.Gate.*)

**Surface:** the password wall at `/day-n-night/*`. First impression for anyone who arrived via a forwarded link.

#### Now (en)
> **Eyebrow:** Private event
> **Title:** Day n Night
> **Subtitle:** Please enter the passcode.
> **Submit:** Enter / Checking…
> **Hint:** You'll only need to enter this once on this device.
> **Footer:** No code? Reach out to the host on the channel that pointed you here.

#### Now (ko)
*(equivalent — copy already softened)*

#### Polish (en)
- **Subtitle:** *"Enter the passcode you were sent."* — drops the deferential "Please," shortens. Acknowledges the password came from somewhere specific.
- **Hint:** keep as-is.
- **Footer:** *"No code? Ask whoever forwarded you this."* — direct, drops "the channel that pointed you here" which is one beat too vague.

#### Polish (ko)
- **Subtitle:** `전달받은 입장 코드를 입력해 주십시오.` (Register C — direct request, single beat.)
- **Footer:** `코드가 없다면, 이 페이지를 전달해 준 분께 문의해 주십시오.` Drops the literal `호스트` (host) since the *forwarder* is who the recipient knows.

#### Why
The current footer assumes the visitor knows there's a "host." A friend forwarded them a link; the host is a stranger. Route them back to the warm relationship.

#### Gap to add
**M9 from DAY_N_NIGHT.md is half-closed.** Add a `mailto:concierge@hideawayseoul.com` affordance below the hint. Key: `Event.Gate.contact` → "Lost? Write us." / `길을 잃으셨다면, 이메일로 문의해 주십시오.`

**Path:** `messages/{en,ko}.json` → `Event.Gate.*` ; component `src/components/sections/DayNNightGate/index.tsx`.

---

### 3.2 Simplified view

**Surface:** `/day-n-night` when `view-pref=simplified` (the default after first visit).

This is the load-bearing surface. Almost every guest will land here at some
point, and Korean-monolingual readers will live here. The card is currently
*good*. Polish is incremental.

#### Now / Polish — line by line

| Element | Now (en) | Now (ko) | Polish (en) | Polish (ko) |
|---|---|---|---|---|
| Header L | `May 24 · Haebangchon · Yongsan` | `5월 24일 · 해방촌 · 용산` | keep | keep |
| Header R | `Sunday` | `Sunday` | keep | **`일요일`** (Korean wasn't ported — V5) |
| Kicker | `30 & Smokin'` | `Smoke Low and Slow... 30 years minimum.` | keep en | **`서른, 그리고 여전히 뜨겁게.`** — the current KO loses the bit and feels machine-paraphrased. Pick a beat and commit. |
| H1 | `Day n Night` | (same) | keep | keep |
| Lede | `No fire asks permission to burn. Neither did we.` | `불꽃은 허락을 구하지 않습니다.` | keep en | **add a second beat to KO** — `불꽃은 허락을 구하지 않습니다. 우리도 마찬가지였습니다.` The English has the punch in the *second* sentence; the Korean drops it. |
| Day row | `DAY · 18:30 → 19:50` | (same) | keep | keep |
| Night row | `NIGHT · 20:00 → late` | (same) | keep | keep |
| Location label | `Location` | `Location` | keep | **`장소`** — same V5 leak as Sunday. |
| Entry label | `Entry` | (in dl) | keep | keep |
| Entry amount | `65,000 KRW` | `65,000원` | keep | keep |
| Entry meta | `all-inclusive · per guest · Transfer` | `1인 기준 · 모든 비용 포함 · 계좌이체` | keep | keep |
| Primary CTA | `Reserve` | `예약하기` | keep | keep |
| Secondary | `Small list. Quiet room.` | `소수 정예, 프라이빗 룸` | keep | **`작은 방, 조용한 자리.`** — `소수 정예` reads competitive (gameshow), `프라이빗 룸` is loanword-leany. |
| Closing italic | `Pull up a chair. The fire's been waiting.` | `빈자리를 당겨 앉으세요. 불꽃은 이미 준비되어 있습니다.` | keep en | **`자리를 끌어다 앉으십시오. 불은 이미 피워두었습니다.`** — `~세요` ban (V4); `~십시오` consistent with rest of block. |
| Footer L | `Hosted by Sean & friend` | `Hosted by Sean & friend` | keep | **`Sean과 friend가 함께 준비합니다.`** — co-host's real name goes here; current Korean is just English. |
| Footer R | `RSVPs close when the room fills.` | (same) | keep | **`방이 차면 마감됩니다.`** |

#### Gap to add — Simplified

1. **A 1-line "what is this?" anchor below the kicker.** First-time visitors landing from a forwarded link don't know what kind of event this is. *Why:* §14.5 #1 anxiety — "is this real or a scam?"
   - en: *"A private cookout-to-cocktails evening. Sunday, on a rooftop in Haebangchon."*
   - ko: `해방촌 루프탑에서 열리는, 바비큐로 시작해 칵테일로 끝나는 작은 저녁입니다.`
   - Key: `Event.DayNNight.opening.what`

2. **A "the night side, in one line" below the day/night dl.** The simplified card lists times but doesn't tell the day-only reader what changes at 20:00. Add a single italic serif line between the dl and the CTA: *"Same room. Lights down. Pour something."* / `같은 공간, 낮아지는 조명, 채워지는 잔.`

#### Path
`src/components/sections/DayNNight/SimplifiedView.tsx` ; keys under `Event.DayNNight.*`.

---

### 3.3 Immersive — Act I (Opening)

**Surface:** `Timeline.tsx` Act 1. The act after the sun loader hands off.

#### Now (en)
- **Eyebrow:** `I. · OPENING · 18:30 →`
- **Kicker:** `30 & Smokin'`
- **Title:** `Day n Night`
- **Lede:** `No fire asks permission to burn. Neither did we.`
- **Body (serif italic):** *"A decade of chasing, stumbling, and figuring it out. Somehow, we made it to the other side—still standing, still hungry. The smoke rising off this grill isn't just heat. / It's everything we survived, shed, and are done apologizing for. / We're turning 30 looking every bit as good. Come join the scenery."*

#### Polish (en)
- Eyebrow: keep.
- Kicker: keep.
- Title: keep.
- Lede: keep.
- Body: tighten. The current paragraph is good but the third beat ("looking every bit as good") falls short of the first two. Proposed last line: ***"We're turning 30 with stories to show for it. Come stand next to one."*** Earns the closing turn.

#### Polish (ko)
The current `opening.body` ends with a literal trailing `\n\n.` (line 308 of en.json's ko sibling) — **strip the orphan period.** That's a real bug.

Beyond that, the KO body reads warmly enough but is two beats long where it should be three (matching the English structure). Proposed restructure:

```
헤매고 부딪히며 보낸 10년. 어떻게든 살아남았고, 곁에는 변함없는 사람들이 남았습니다.
그릴 위로 피어오르는 연기는 단순한 열기가 아닙니다.
살아남고, 털어내고, 흠집까지 자신의 것으로 받아들이며 함께 걸어온 사람들을 초대합니다.
서른, 보여줄 이야기는 충분합니다. 그 옆에 서주십시오.
```

#### Why
- The current KO body says "초대합니다" without earning the invitation — there's no closing turn. Adding the fourth beat ("그 옆에 서주십시오") gives the body the same arc as the English.
- The trailing `\n\n.` is sloppy.

#### Path
`messages/{en,ko}.json` → `Event.DayNNight.opening.body` ; rendered at `Timeline.tsx:461` and `SimplifiedView.tsx` (lede only).

#### Gap — Opening
None additional. This is the act with the most polish already invested.

---

### 3.4 Immersive — Act II (Cookout)

#### Now (en)
- Eyebrow: `II. · INCLUDED · 18:30 → 19:50`
- Heading: `Backyard cookouts are good. Rooftop barbecues are better.`
- Body: `Smash burgers off the grill, pork brine, potatoes, and whatever the smoke turns out. We grill while the sun's still up. Beer and wine to follow. Gin, if you ask nicely.`
- Included list: Food → `Smash burgers · Pork · Potatoes` ; Drinks → `Beer · Wine · Gin if you ask`

#### Polish (en)
- Heading: keep. It earns its space.
- Body: drop **"pork brine"** — it's an aside that confuses a non-cook (it's a step, not a dish). Either *"pork — brined, slow"* if you want the technique callout, or just *"pork."* Proposed: *"Smash burgers off the grill, pork done slow, potatoes, and whatever the smoke turns out. We grill while the sun's up. Beer and wine to follow. Gin, if you ask nicely."*
- Drinks items: *"Beer · Wine · Gin on request"* — `if you ask` is in the body line right above, repetition flattens.

#### Polish (ko)
- Heading: keep. It's good.
- Body: current KO drops the "if you ask nicely" beat (translates `정중히 묻는다면` — slightly stiff). Try: `진(Gin)도 준비되어 있습니다, 말씀만 주십시오.`
- Drinks items: `맥주 · 와인 · 진 ⋅ (요청 시) 논알콜` — **the trailing `· 논알콜` is good info but visually drifts.** Two routes:
  - (a) Split into its own row: `Non-alc` / `논알콜 · 요청 시`
  - (b) Move into the body line: *"Beer, wine, gin. Non-alc on request."* / `맥주, 와인, 진. 논알콜은 요청 시 준비해 드립니다.`
  - **Recommend (a)** — it's load-bearing for the vegetarian/sober subset (`§14.5 expected DMs #5`).

#### Gap — Cookout
1. **Add a "food times" sub-line.** Audit complaint: people will ask "what if I show up at 19:30?" Add a small mono line under the food list: *"Grill closes at 19:50. After that: wine, conversation, the slow turn into night."* / `그릴은 19:50에 닫습니다. 그 이후엔 와인과 대화, 그리고 천천히 다가오는 밤이 남아 있습니다.`
   - Key: `Event.DayNNight.act.day.outro`
2. **Replace one of the moodboard captions** that's currently empty. `moodboard.cookout.rooftop.caption` and `moodboard.cookout.vibe.caption` are both `""`. Either populate or remove the keys. Suggestion: rooftop → *"Above the rooftops, around the smoke."* / `지붕 위, 연기 가운데.` ; vibe → leave empty (some images should not narrate themselves).

#### Path
`Timeline.tsx:485–586` ; keys at `Event.DayNNight.act.day.*`, `Event.DayNNight.included.*`, `Event.DayNNight.moodboard.cookout.*`.

---

### 3.5 Immersive — Act III (Dress)

The most ambitious act and the one with the most copy debt.

#### Now (en)
- Heading: `One rule: Don't dress your age.`
- Option 1 label: `#throwback: looks you are a little old for...`
- Option 1 body: `An outfit you still love, but felt like you'd outgrown? Last call. Wear it without apology. Geeks, nerds, civilians, and the next emo girl—all welcome. We'll get you the photos.`
- Option 2 label: `...or a tad bit young for.`
- Option 2 body: `Dad jeans, jorts, oversized polos. Your pick. Daytime unshaven, nighttime shaken.`

#### Polish (en)
- Heading: keep.
- Option 1 label: **drop the `#throwback:` hashtag.** It reads social-media and dates the surface. Proposed: *"Wear something you've held onto."*
- Option 1 body: keep. *"the next emo girl"* is the line that makes the act feel like a person wrote it. Defend.
- Option 2 label: *"Or something you're not quite ready for."*
- Option 2 body: keep direction. Polish: *"Dad jeans, jorts, oversized polos — your call. Daytime unshaven, nighttime shaken."* (Em dash instead of period for the rhythm.)

#### Polish (ko) — the bigger lift
This block is where the Korean voice swings most.

| Key | Now | Polish |
|---|---|---|
| `dressCode.heading` | `단 하나의 규칙: 나이에 얽매이지 마세요.` | **`단 하나의 규칙: 나이에 얽매이지 마십시오.`** (`~세요` ban, V4) |
| `dressCode.option1.label` | `#throwback: 입기엔 조금 늦었다고 생각했던...` | **`다시 꺼낼 차례.`** — drop the hashtag, simplify. The English label is too long for the design anyway. |
| `dressCode.option1.body` | (current — soft "변명 없이 꺼내 입으세요" — `~세요` violation) | `여전히 좋아하지만, 이젠 망설였던 옷이 있다면 마지막 기회입니다. 변명 없이 꺼내 입으십시오. 긱(Geek), 너드, 평범한 사람, 다음 세대의 이모(Emo)걸까지 모두 환영합니다. 사진은 저희가 남겨드리겠습니다.` |
| `dressCode.option2.label` | `...혹은 입기엔 아직 이른 옷.` | **`아직 이른 듯한 옷.`** — drop the leading ellipsis dependency. |
| `dressCode.option2.body` | `대드 진(Dad jeans), 조츠(Jorts), 오버사이즈 폴로. 무엇이든 좋습니다. 낮에는 느긋하게, 밤에는 세련되게.` | keep — this one's clean. |

#### Why
The Dress act is the most opinionated copy on the page and is currently
dragged down by two `~세요` leaks and a hashtag. Fix those, the rest carries.

#### Gap — Dress
**Add a "what if I don't care about dress code?" beat.** This is the single
biggest unspoken anxiety for the not-fashion-forward attendee. One italic
serif line below the two options: *"And if neither of these is you — wear what makes you stay late."* / `둘 다 자신의 옷차림이 아니라면, 늦게까지 머무를 만한 옷으로 와주십시오.`

- Key: `Event.DayNNight.dressCode.outro`

#### Path
`Timeline.tsx:594–698` ; keys at `Event.DayNNight.dressCode.*`.

---

### 3.6 Immersive — Act IV (Night) — *rebuilt around the DJ moment*

**This act is being substantially redesigned.** Per §2.5.2, the Night act's
job is *the room turning* — the lights dropping, the music taking over,
**YM.FM on the decks.** The current "Sharp. Chic. Dressed to impress."
heading is moved out (it conflicts with Dress's "don't dress your age" rule
anyway) and the act is rebuilt around the cassette.

YM.FM (real name TBC — Sean's friend, also his barber) is the night's actual
content. Not a feature listed in the included.* block, not a footer credit —
**the centrepiece.** The TapePlayer 3D cassette becomes the act's interactive
artifact, playing a short tease of YM.FM's mix.

#### What changes

| | Current | Redesigned |
|---|---|---|
| Eyebrow | `IV. · NIGHT · 20:00 → late` | `IV. · NIGHT · 20:00 → late` (keep) |
| Hero heading | `Sharp. Chic. Dressed to impress.` | **`The room turns.`** *(en)* / **`방의 공기가 바뀝니다.`** *(ko)* |
| Hero body | `Same room, different mood. Cocktails come up, lights go down. You don't have to bring a suit. We won't stop you, though.` | **`The grill goes cold. The lights come down. Something quieter takes over the speakers.`** *(en)* / **`그릴은 식고, 조명은 낮아집니다. 스피커에서는 더 조용한 무언가가 흘러나오기 시작합니다.`** *(ko)* |
| Sub-anchor (NEW — DJ credit) | — | **A serif eyebrow** `On the decks · YM.FM` + **a one-line blurb** "Our dear friend. Barber. Musician. Great Dude." / `On the decks · YM.FM — 오랜 벗. 바버이자, 뮤지션. 좋은 사람.` |
| Interactive artifact (NEW) | — | **`<Tape3DScene>`** — cassette labelled *YM.FM × Day n Night*, ~45–60s of one of YM's tracks, click-to-play. See § 5.6. |
| Photo scatter (NEW — replaces suit/jacket polaroids) | Day n Night Act IV current right column | **A small candid wall** — 5–8 polaroids of YM (cutting hair, behind decks, candid moments) scattered behind/around the cassette. Not the polished Dress moodboard treatment; **deliberately messy** — see § 5.7. |
| Instagram handle (NEW) | — | `@yangminwoo` — sits below the blurb as a small mono link. |
| Tribute heading | `Charred, Scarred & Thriving` | **Move to Closing** as the act-V quiet aside (replaces the current `closing.lede` italic role). The literary block is the loop's emotional climax — it belongs at the door out, not mid-Night. |
| Tribute body | (the strong literary block) | **Move to Closing** with the heading. |
| `act.night.announcement` | `A quiet addition to the evening awaits.` | **Cut.** The cassette is the announcement. Pre-announcing dilutes it. |
| `act.shift.*` (orphan keys) | not rendered anywhere | **Cut from messages JSON.** Dead keys since the redesign collapses the day→night transition into the Night act's opening line. |

#### Why the redesign

1. **Resolves the heading conflict** that the product-lens audit flagged (§14.5 #3): Dress says "don't dress your age," then Night said "dressed to impress." Now Night doesn't talk about clothes at all — it talks about what's happening *in the room*.
2. **Gives Night its real subject.** Music is the load-bearing content of the night side of any cookout-to-cocktails event. The current copy treats it as background; the redesign makes it the figure.
3. **Names YM.FM as a person, not a footer credit.** Open question §10 Q4 in DAY_N_NIGHT.md asked: *"YM.FM credit — link to a page, social handle, or just credit-in-place?"* The answer the redesign proposes: **a named, blurbed, on-stage presence in the act they're carrying.** The barber detail is what makes it a person, not a brand — keep it.
4. **The TapePlayer earns its weight here.** The site already owns a polished 3D cassette UI (`src/components/UX/TapePlayer/visuals/Tape3DScene.tsx`) that mounts into the shared `<Canvas>` via `<View>`. It's been waiting for a moment that justifies it. This is that moment.
5. **Reclaims the literary block.** "Charred, Scarred & Thriving" is the best paragraph on the page — burying it in Night's lower-right footer as a "tribute credit slot" is a misuse. Promoted to the Closing aside, it becomes the surface's emotional bookend.

#### New i18n keys

```jsonc
"act": {
  "night": {
    "label": "NIGHT",
    "time": "20:00 → late",
    "heading": "The room turns.",                             // rewrite
    "body": "The grill goes cold. The lights come down. Something quieter takes over the speakers.",  // rewrite
    "dj": {                                                   // NEW group
      "eyebrow": "On the decks",
      "name": "YM.FM",
      "role": "Barber. Musician. Great Dude.",
      "blurb": "Our dear friend. The reason the night sounds the way it does.",
      "listenLabel": "Listen — a minute of where the night goes",   // CTA label below the cassette
      "handle": "@yangminwoo",                                // visible link label
      "handleHref": "https://instagram.com/yangminwoo"        // resolved at component, not i18n
    }
    // `announcement` removed
  }
}
```

Korean ports (sketch — pass through `VOICE.md §3` checks before shipping):

```jsonc
"act": {
  "night": {
    "heading": "방의 공기가 바뀝니다.",
    "body": "그릴은 식고, 조명은 낮아집니다. 스피커에서는 더 조용한 무언가가 흘러나오기 시작합니다.",
    "dj": {
      "eyebrow": "On the decks",
      "name": "YM.FM",
      "role": "바버 · 뮤지션 · 좋은 사람.",
      "blurb": "오랜 벗. 이 밤이 이런 소리로 흐르는 이유입니다.",
      "listenLabel": "들어보기 — 이 밤이 어디로 가는지, 1분만",
      "handle": "@yangminwoo"
    }
  }
}
```

`Event.DayNNight.tribute.*` is **kept** but its render site moves — see §3.7 below.

#### Asset prerequisites

Before the act can ship in this form, three concrete artifacts have to exist:

1. **The audio file.** A 45–60s tease cut by YM.FM (or pulled from an existing set with their permission). MP3 + AAC + Opus, ≤ 1.5 MB combined. Path: `public/assets/day-n-night/ym-fm-tease.{mp3,m4a,opus}`.
2. **A cassette label.** The TapePlayer's `TrackInfo` panel needs a label string and probably a small jacket image. Use the editorial mono treatment: line 1 *"YM.FM"*, line 2 *"× Day n Night · May 24, 2026"*. If `TapeModel.tsx` accepts a texture, a 512×512 PNG with the same content gives the cassette a real face.
3. **YM.FM's blurb wording** — final voice review with Sean and YM.FM themselves. The barber detail is fact; keep it. The "old friend" framing is editorial; YM.FM may want it different.

#### Path

`src/components/sections/DayNNight/Immersive/Timeline.tsx:707–784` (current Night act) ; keys at `Event.DayNNight.act.night.*` ; net-new at `Event.DayNNight.act.night.dj.*`. The TapePlayer mount sits inside the act's right column where the polaroid moodboard currently lives (`PolaroidGroup` block at the bottom of the Night `<section>`).

#### Cascade — what else moves because of this

- **Dress act (§3.5)** absorbs one re-purposed polaroid (the suit) as a back-card in option-2's cluster, or cuts it entirely. Either is fine.
- **Closing act (§3.7)** absorbs the tribute block. Current `closing.lede` "Pull up a chair. The fire's been waiting." moves to a smaller secondary role (or merges with the tribute body). See §3.7 redesign below.
- **Scrubber labels** (already Korean-ported in §7 work) — `nightLabel` stays "나이트" / "Night." No change.
- **`act.shift.*` orphan keys** — delete from both `messages/{en,ko}.json` in the same diff that lands this redesign. They're not rendered and the redesign confirms they never will be.

---

### 3.7 Immersive — Act V (Closing)

#### Now (en)
- Eyebrow: `V. · ENTRY · May 24`
- Kicker: `More to come.`
- Title: `Day n Night` (bookend)
- Closing lede (italic): `Pull up a chair. The fire's been waiting.`
- CTA: `Reserve →`
- Footer L: `Hosted by Sean & friend`
- Footer R: `RSVPs close when the room fills.`

#### Polish (en)
- Eyebrow's label is currently `Entry` (`t("entry.heading")`). For the *closing* act, eyebrow → `RSVP` reads more honestly as the act's purpose. Proposed: add `Event.DayNNight.closing.eyebrow = "RSVP"` and wire it instead of reusing `entry.heading`. (`entry.heading` keeps its role on `/tickets/day-n-night`.)
- Kicker `"More to come."` is borrowed from the source doc and reads vague. Proposed: *"One last thing."* (mirrors Opening's `30 & Smokin'` as a paired bookend beat).
- Closing lede: keep.
- CTA: keep.

#### Polish (ko)
- Eyebrow: `RSVP` stays English.
- Kicker `아직 끝이 아닙니다.` → **`마지막으로, 한 가지.`** — same bookend logic.
- Closing lede: see §3.2 above; both views share the key, update once.

#### Gap — Closing
1. **`/guests` discoverability link.** Audit M11 — the guest list page exists and is unlinked from anywhere. Add a small mono line at the bottom of Closing above the hosts strip: *"See who else is in →"* / `함께하는 분들 →` linking to `/day-n-night/guests`.
   - Key: `Event.DayNNight.closing.guestsLink`
   - Companion: same link on Simplified view, between secondary CTA and closing italic.

2. **Absorb the tribute block** (relocated from Night per §3.6 redesign). The tribute heading + body now sits inside Closing as the act's left-column aside — replacing the current `closing.lede` italic role. New shape for Closing's left column:
   ```
   ┌──────────────────────────────────────┐
   │  CHARRED, SCARRED & THRIVING         │  ← tribute.heading, mono eyebrow
   │                                       │
   │  There's a particular kind of        │  ← tribute.body, italic serif
   │  wisdom that only comes from         │
   │  burning…                            │
   │  …Charred at the edges, yes, but     │
   │  that's where the flavor is.         │
   │                                       │
   │  [Survival Kit, embedded variant]    │  ← keep, below the tribute
   └──────────────────────────────────────┘
   ```
   The current `closing.lede` *"Pull up a chair. The fire's been waiting."* either: (a) becomes the final line of the tribute body (one beat after "…that's where the flavor is."), or (b) is cut. Recommend (a) — it earns its place as the tribute's outstretched-hand turn.

#### Path
`Timeline.tsx:798–887` (closing act) + `SimplifiedView.tsx:85–96` (closing italic, shared key).

---

### 3.8 `/day-n-night/guests`

#### Now (en/ko)
- Eyebrow: `RSVP`
- Title: `Who's coming` / `함께하는 사람들`
- Subtitle: `The list so far, in no particular order.` / `순서와 관계없이, 함께할 분들입니다.`
- Tiers: `Hosts / Past attendees / Guests` ; `호스트 / 다시 찾아주신 분들 / 처음 뵙는 분들`
- Empty: `No guests yet. / RSVPs will appear here as they come in. Check back closer to the date.`
- `you`: `That's you` / *(check ko)*

#### Polish (en)
- Subtitle: *"In no particular order — the list as it stands."* — drops "so far" which reads provisional in a way that undercuts the room.
- Empty body: *"As people confirm, they'll show up here."* — drops the imperative "Check back closer to the date." (reads pushy).

#### Polish (ko)
- Title: keep.
- Subtitle: `순서 없이, 지금까지 함께하는 분들입니다.`
- Tier `처음 뵙는 분들`: warm but assumes the host's POV. Consider **`새롭게 함께하는 분들`** — neutral viewer-side.

#### Gap — Guests
1. **Anonymity opt-in/out copy.** Current model: anyone with `rsvp.intro` set appears. The doc flags M1 `rsvp.consented`. When that lands, the gate copy is: *"Show me on the guest list"* / `참석자 목록에 표시` — checkbox.
2. **The `you` row.** When the viewer's own row is shown, the current label `That's you` works in en. For ko, current is unclear — confirm `당신` is **not** used (V4 ban via VOICE §3.2). Should be `본인 프로필` or simply omit the label.
3. **A footer line tying back to the event.** Bottom of the page: *"See you at Day n Night."* / `5월 24일, Day n Night에서 만나요.` — gentle button back to `/day-n-night`.

#### Path
`messages/{en,ko}.json` → `Event.Guests.*` ; route `src/app/(frontend)/(site)/(content)/day-n-night/guests/page.tsx`.

---

### 3.9 `/tickets/day-n-night` — 4-step purchase flow

The audit says this flow shipped P4C-1 on 2026-05-20. Current copy at `Event.Rsvp.steps.*`. Heaviest copy density on the surface.

#### 3.9.1 Welcome step

| | Now (en) | Now (ko) | Polish (en) | Polish (ko) |
|---|---|---|---|---|
| eyebrow | `Day n Night · RSVP` | (same) | keep | keep |
| title | `A few short steps before tickets.` | (KO TBV) | keep | `예약까지 몇 단계만 진행해 주십시오.` |
| body | `Email confirmation, your name, then the ticket itself. Two minutes, no account required.` | (KO TBV) | keep | `이메일 확인 → 이름 → 예약. 2분이면 충분합니다. 계정은 필요하지 않습니다.` |
| cta | `Start` | (KO TBV) | keep | **`시작하기`** (Register A, label per VOICE §3.5.1) |

#### 3.9.2 OTP step

| | Now (en) | Polish |
|---|---|---|
| title | `Where should we reach you?` | keep — it's the rare warm line that earns its space. |
| emailPlaceholder | `you@example.com` | keep |
| sendCode | `Send code` | keep |
| codePlaceholder | `6-digit code` | keep |
| submit | `Continue` | keep |
| resend | `Resend code` | keep |
| error | `That code didn't match. Try again.` | keep — matches VOICE §4.4 |

KO polish: confirm submit/resend land as `계속하기` / `다시 보내기` (Register A) not `~세요` forms. **Spot-check before launch.**

#### 3.9.3 Name step

| | Now (en) | Polish |
|---|---|---|
| title | `What name should be on the door?` | keep |
| placeholder | `First and last name` | keep |
| submit | `Continue` | keep |

KO: `문 앞에 어떤 이름으로 적어둘까요?` — **suspect `~까요?` ending is too casual.** Proposed: `예약자 성함을 알려주십시오.` (Register C).

#### 3.9.4 Purchase step

| | Now (en) | Polish |
|---|---|---|
| title | `How many?` | keep |
| quantityLabel | `Tickets` | keep |
| recipientLabel | `Recipient name (optional)` | keep |
| recipientHint | `Leave this blank if the ticket is for you. If it's a gift, enter their name.` | tighten: *"Blank if it's for you. Otherwise, the recipient's name."* |
| submit | `Reserve` | keep |
| success | `Reserved. Check your email for the next steps.` | keep |

#### 3.9.5 Purchased step (post-reserve)

| | Now (en) | Polish |
|---|---|---|
| eyebrow | `Awaiting payment` | keep |
| reserved | `{quantity} reserved · {total}` | keep |
| instructionsFallback | `The host will reach out with payment details. Your tickets will activate the moment payment is confirmed.` | **rewrite** — this is exactly the moment that produces audit anxiety #4 ("did my transfer arrive?"). Propose: *"Payment instructions are on the way. Your tickets activate the moment we confirm your transfer — usually within a day."* / `결제 안내가 곧 전송됩니다. 입금이 확인되는 대로 티켓이 활성화됩니다. 보통 하루 안에 처리됩니다.` Adds an explicit time expectation. |

#### Gap — Purchase flow
**A "how this works in plain terms" inline summary on the Welcome step.** One paragraph above the CTA: *"You'll get an email confirmation, then we'll send payment instructions. We confirm payment manually, usually within a day. Your tickets activate the moment we do."* This is the single biggest scam-detector reassurance and it costs nothing.

- Key: `Event.Rsvp.steps.welcome.howItWorks`
- ko: `이메일로 확인을 보내드린 뒤, 결제 안내를 전송해 드립니다. 결제는 호스트가 직접 확인합니다. 보통 하루 안에 처리되며, 그 즉시 티켓이 활성화됩니다.`

#### Path
`messages/{en,ko}.json` → `Event.Rsvp.steps.*`, `Event.Rsvp.purchased.*`.

---

### 3.10 `/day-n-night/my`

The audit's H3 noindex + PasswordReveal + H5 i18n all shipped. Copy at `Event.Rsvp.my.*` is functional. One thing remains:

#### Polish
- `passwordHint` is currently *"You will receive a 48-hour password when the host marks your order as paid. Share it with whoever you are gifting tickets to."* — true but reads like a help-doc. Proposed: *"A 48-hour password unlocks each gifted ticket. Share it privately with the recipient."*
- KO equivalent: confirm it isn't `~세요`-ending.

#### Gap — /my
1. **A "what is this page?" header beat.** Anyone arriving here for the first time has zero context. One italic serif line under the title: *"Your reservation in one place — and the links you'll need to send."* / `예약 내역과 전달용 링크를 한곳에 정리해 두었습니다.`
   - Key: `Event.Rsvp.my.intro`
2. **Reissue affordance copy** (audit M10 — when implemented). Button label: `Re-issue password` / `비밀번호 재발급`. Helper: *"If the recipient's link expired, generate a new one."* / `수령인의 링크가 만료되었다면 새 비밀번호를 발급해 주십시오.`

#### Path
`messages/{en,ko}.json` → `Event.Rsvp.my.*` ; page at `src/app/(frontend)/(site)/(content)/day-n-night/my/page.tsx`.

---

### 3.11 `/day-n-night/claim/[token]`

Phase 5a closed the C3/C4 lies. Current copy at `Event.Rsvp.claim.*` is honest now. Polish:

- `claim.body` *"Enter the password the buyer shared with you. This link expires 48 hours after the host confirmed the order."* — load-bearing. Keep, but consider: the recipient has no concept of "the host" — they were forwarded a link by a friend. Proposed: *"Enter the password your friend shared. This link is good for 48 hours after the order's confirmed."*
- KO same translation logic: `친구가 전달해준 비밀번호를 입력해 주십시오. 주문이 확인된 시점부터 48시간 동안 유효합니다.`

#### Gap — /claim
**Post-claim next-step.** Current success body: *"You're all set. See you on May 24."* — good. Add: *"Save this page — your ticket details show up here on event day."* / `이 페이지를 저장해 주십시오. 행사 당일 입장 정보가 여기에 표시됩니다.`

- Key: `Event.Rsvp.claim.success.followup`

#### Path
`messages/{en,ko}.json` → `Event.Rsvp.claim.*`.

---

## 4. Moodboard captions — one-pass cleanup

Current state has 5 dress + 2 night + 3 cookout caption keys. Mostly fine, but:

| Key | Issue | Action |
|---|---|---|
| `moodboard.cookout.rooftop.caption` (both locales) | empty string | Either populate (see §3.4 gap) or remove the key & DOM. Empty captions render an empty `<figcaption>`. |
| `moodboard.cookout.vibe.caption` | empty | same |
| `moodboard.dress.romeo.caption` (ko) | `(Romeo and Juliet)` — single parenthetical, drops the bit | Port the en line: `다이카프리오라도, 이젠 무리겠죠. 나이는 거짓말을 안 합니다. (Romeo and Juliet, 1997)` |
| `moodboard.dress.pink.caption` (ko) | `Hollister much? Not judging (believe at your risk). (Mean Girls, 2006)` — but the **en caption is for Romeo+Juliet pink** not Mean Girls | **Bug.** The two locales describe different images. Reconcile. |
| `moodboard.dress.dad.caption` (ko) | `No matter, we're discussing Steve Carrell here.` is a fine port but the `No matter,` opener is awkward in KO. Drop. | `스티브 카렐 얘기를 하는 중입니다. (Crazy, Stupid, Love, 2018)` |
| `moodboard.dress.notDads.caption` (ko) | `What a pair of nice looking people - bet they hate violence. (Pulp Fiction, 1999)` — fine, but the comma+dash is loose | `참 멀쩡한 분들이군요. 폭력을 끔찍이 싫어할 것 같죠. (Pulp Fiction, 1999)` |
| `moodboard.dress.dude.caption` (ko) | `The Dude. Nuff said.` — `Nuff said` doesn't port | `더 듀드(The Dude). 더 보탤 말이 없습니다. (Big Lebowski, 1998)` |

---

## 5. Cross-cutting additions — content that doesn't exist yet but should

Five things I'd add. Each closes a known guest anxiety from §14.5 of `DAY_N_NIGHT.md`.

### 5.1 Korean-coded reference in the moodboard (V8 / audit §14.5)
Add a 6th polaroid in either Dress or Night with a Korean still — proposed: a black-and-white from `달콤한 인생` (A Bittersweet Life, 2005) for the Night act suit polaroid set, or a `극한직업` still for Cookout if you want a lighter beat. Captions in KO carry the wit; en carries the year + title. This single addition resolves the "expat-coded" complaint.

### 5.2 Plain-words FAQ block — collapsible, on Simplified only
6 lines, between SurvivalKit and footer. Each Q is the literal DM Sean expects. Bilingual.

| Q | A (en) | A (ko) |
|---|---|---|
| Is parking nearby? | None on-site. Street parking is hit-or-miss. Cab in, walk out. | 별도 주차 공간은 없습니다. 갓길 주차는 어려울 수 있습니다. 택시로 오시는 편이 편합니다. |
| What if it rains? | The rooftop has cover for the bar. We move under it. | 루프탑에 바(bar) 위쪽으로 가림막이 있습니다. 비가 오면 그 아래로 자리를 옮깁니다. |
| Vegetarian / allergies? | Tell us when you reserve. We'll take care of it. | 예약 시 알려주십시오. 따로 준비해 두겠습니다. |
| Refund if I can't come? | Yes, up to one week before. After that, we'll save you a drink for next time. | 행사 1주일 전까지는 환불해 드립니다. 이후에는 다음 모임의 자리를 마련해 두겠습니다. |
| Audio doesn't play on iPhone? | Tap the sound icon once. iOS needs an explicit tap to start any audio. | 사운드 아이콘을 한 번 눌러 주십시오. iOS는 첫 재생에 직접 터치가 필요합니다. |
| Am I sure I'm invited? | If you have this link, yes. | 이 링크가 있다면, 그렇습니다. |

Key root: `Event.DayNNight.faq.*`. Visual: serif Q / sans A, collapsible.

### 5.3 Payment confirmation expectation — explicit copy
See §3.9.5 polish for `instructionsFallback`. Also a banner on `/my`:
- en: *"Awaiting confirmation. We'll have an update within a day."*
- ko: `결제 확인을 기다리는 중입니다. 보통 하루 안에 안내를 드리고 있습니다.`

### 5.4 The "see who else is in" link (§3.7 / audit M11)
Already specified.

### 5.5 A "for the host" line on the footer
The Hosted-by line currently says *"Hosted by Sean & friend"*. Co-host's actual name belongs here (Sean's call). One small mono line, both views.

### 5.6 TapePlayer 3D inside Act IV (Night) — integration spec

The act's interactive artifact. Reuses the existing `<Tape3DScene>` (`src/components/UX/TapePlayer/visuals/Tape3DScene.tsx`) — already designed to mount via drei `<View>` into the project's shared `<Canvas>`, already responsive (9:16 mobile, 1:1 tablet, 16:9 desktop), already gated on `useInView`. Nothing in the component needs to change for this use case.

#### Placement
Inside the Night act's right column, replacing the current `<PolaroidGroup>` (`Timeline.tsx:761–782`). Vertical-centered against the hero copy block on the left; on mobile, stacks below.

#### Behaviour

| Surface | Behaviour |
|---|---|
| Desktop, in view | Cassette renders, reels idle. **Click-to-play** the YM.FM tease — never autoplay (iOS audio policy + editorial restraint). On play: reels spin, progress rail advances, counter ticks. |
| Desktop, out of view | Cassette unmounted (the existing `useInView` gate). |
| Mobile | Same, smaller. Aspect ratio 9:16 handled by the component. |
| Reduced motion | Reels do not spin; progress rail stills; counter is static. Audio playback still works. Implement via a `prefers-reduced-motion` check inside `TapeReels.tsx` if it doesn't already gate. |
| WebGL failure / Three.js error | Fallback: a styled `<audio controls>` element with the same YM.FM tease + a small caption "YM.FM × Day n Night." No silent failure. |
| Audio file missing / 404 | Cassette renders as a static prop; play button shows the disabled state with helper text "Tape arrives soon." Localised. |

#### Cassette label
- Line 1 (mono caps): `YM.FM`
- Line 2 (mono small): `× DAY N NIGHT · 24 MAY 2026`
- Optional: a tiny jacket image (512×512 PNG) with the same lines, applied as a texture in `TapeModel.tsx`. If `TapeModel` doesn't accept a texture prop yet, ship without and add later — the label can sit as DOM next to the cassette.

#### Track metadata (`TrackInfo.tsx`)
- Title: `Mood shift.` (the only place this phrase still earns its space — it's literally what the tape is doing.)
- Artist: `YM.FM`
- Duration: actual tease length (45–60s).

#### Controls
- Single primary action: a button styled to match the act's mono caps, label `Listen — a minute of where the night goes` / `들어보기 — 이 밤이 어디로 가는지, 1분만` (`act.night.dj.listenLabel`). Tapping it toggles play/pause and animates the reels.
- No scrubber, no volume control. The cassette is editorial, not a media player.
- Below the controls: a small `Find them → @ym.fm` mono link (`act.night.dj.find`), optional.

#### Audio source — locked
- Source dir: **`public/track_media/`** (YM's own catalogue, already in-tree).
- Available: `MOTION FREESTYLE-1.mp3`, `MOTION FREESTYLE-2.mp3`, `MOTION FREESTYLE-3.mp3`, `Track_1`…`Track_9` (each as `.mp3` + `.ogg`), plus two `No Church in the Wild` files (rights-questionable cover — skip).
- **Recommendation:** lead with **`MOTION FREESTYLE-1.mp3`** as the cassette's A-side. Distinct name, original work, single track. The other two FREESTYLE variants can sit as B-side / second-press if you want a small "flip the tape" affordance later.
- File served at `/track_media/MOTION FREESTYLE-1.mp3`. Spaces in the URL → URL-encode at the source (`%20`) when wiring.

#### Performance
- Audio file: served directly from `public/track_media/`. `<audio preload="none">` until play is requested — no fetch on mount.
- Cassette geometry + texture: already loaded by the existing TapePlayer surface on `/radio`; if the user has visited Radio first, the assets are cached. Cold visit: ~250–400 KB additional. Acceptable inside the immersive view's per-page budget (DAY_N_NIGHT.md §6.8 allows R3F when behind `dynamic` + view-gated, which the existing component is).
- **Trim before shipping.** Whatever full track lives in `track_media/` is the right artistic source but probably too long for a sub-fold tease. Cut to 45–90s at a moment that lands well out of context (no fade-from-silence intros). Master to ≤ 1.5 MB. Either ship a `-tease.mp3` companion file or trim in place — separate file is safer (the full track stays as ground-truth for `/radio`).

#### What does NOT change
- The TapePlayer component itself. Drop-in.
- The shared `<Canvas>` (`MainInternal.tsx`). The `<View>` portal model is already in use.
- The sun/sky scene on the immersive view. The TapePlayer mounts as a *second* `<View>` into the same canvas, which is the pattern drei explicitly supports.

#### Open implementation questions
- Does `TapeModel.tsx` currently accept a texture/label prop, or does the label have to sit in DOM beside the cassette? (Read TapeModel.tsx to confirm before implementation.)
- Does the existing TapePlayer pull its audio from a hardcoded source, a context, or a prop? (Determines whether we pass the YM.FM tease as a prop or whether we need a small `<DayNNightTapeProvider>` wrapper.)

These don't block design — they block code. The storyboard's job is done at the spec level above.

---

### 5.7 Polaroid scatter around the YM.FM cassette — design spec

**Intention.** The cassette is the act's primary artifact (an interactive 3D object with audio). The scatter is its *texture* — a small candid wall that makes YM.FM read as **a friend in the room**, not a credit. The two artifacts work together: the cassette is the *sound*; the scatter is the *person*.

**Voice cue from Sean:** *"extra natural and feel spread out, kinda messily, and moving all in slightly different directions and distances."* The treatment here is the explicit opposite of the polished Dress moodboard (which uses `variant="stamped"` and tight grid placement). Night's scatter is closer to a corkboard or a personal Instagram grid pinned to drywall.

**Quantity.** 5–8 polaroids. Fewer than 5 reads sparse; more than 8 fights the cassette for attention.

**Subject matter (in priority order).**

| Tier | Subject | Why |
|---|---|---|
| Must | YM cutting hair (the barber half of him) | Roots the "barber" line in the role copy |
| Must | YM behind decks / with a record / mid-DJ | Roots the "musician" line + connects to the cassette |
| Strong | YM + Sean candid (drink, laugh, side-by-side) | Earns "Our dear friend" — proof of relationship, not assertion |
| Nice | YM portrait, no context (just him, looking direct) | Anchor image; eye contact lands the personhood |
| Nice | Set-up or behind-the-scenes (cables, gear, hands on a turntable) | Atmosphere; sound made physical |
| Optional | Crowd / room shot from a previous night YM played | Foreshadows what May 24 will look like |

**Sourcing.** *Not for me to grab.* The "we can maybe grab some pics" needs to happen via:
- Sean's own camera roll (likely the warmest source).
- A short DM to YM asking for 5–8 favourites (with explicit permission to use on the event page).
- Curated subset of YM's Instagram (`@yangminwoo`) **with his explicit consent** — even if the account is public.

Place under `public/assets/day-n-night/ym/` (e.g. `ym-01-barber.jpg`, `ym-02-decks.jpg`, etc.). 800–1200 px on the long edge. JPEG at q80 — these are texture, not heroes; bandwidth matters more than fidelity. 5–8 files total ≤ 600 KB.

#### Visual treatment

Reuses the existing `Polaroid` + `PolaroidGroup` primitives (see `Polaroid.tsx` discriminated union and `Timeline.tsx` polaroid clusters). Configuration parameters per polaroid:

| Param | Range for the YM scatter | Why |
|---|---|---|
| `variant` | `"clean"` for 4–6 of them; `"back"` for 1–2 ambient cards mixed in | Backs add the corkboard-clutter feel without competing for the eye |
| `width` | **130–260 px, randomised** | Mixed sizes are the single biggest "messy" signal — uniform widths read catalog |
| `angle` | **±10°, broad random spread** (vs Dress's tight ±3–5°) | Bigger rotation variance is the second-biggest "messy" signal |
| `depth` | **mixed positive AND negative**, range ≈ -1.2 to +1.2 | This is the "moving in slightly different directions" — `depth` drives parallax against scroll; opposing signs make adjacent polaroids drift apart, not together |
| `anchor` | All anchored to `ANCHOR_NIGHT` | Same parallax window as the rest of the act |
| `priority` | Only on the first 2 polaroids (LCP-relevant) | Rest lazy-load |
| Caption | **Mostly empty** — let 1–2 carry short captions max | Captioned-everything reads gallery; empty reads personal |

#### Composition

```
                ┌───────────────────────────────────┐
                │  [The room turns.]                │
                │  body…                            │
                │                                   │
                │  ON THE DECKS · YM.FM             │
                │  Our dear friend.                 │
                │  Barber. Musician. Great Dude.    │
                │  @yangminwoo →                    │
                └───────────────────────────────────┘
              ┌──────────────────────────────────────────┐
              │                ▣ (back)                  │
              │                                          │
              │       ▭                  ▭ (small)       │
              │     barber             portrait          │
              │              ▭ (large, central)          │
              │              CASSETTE                    │
              │      ▭ (back)            ▭               │
              │                       decks              │
              │           ▭                              │
              │       sean+ym                            │
              └──────────────────────────────────────────┘
```

The cassette sits in the visual centre of the cluster. Polaroids scatter around it — some peeking from behind (low z-index), some sitting in front and slightly overlapping its edges (higher z-index than the cassette wrapper would be visually jarring; mid z-index between cassette and ambient is right).

#### Motion
Something nice

#### Mobile

Below `lg`, the existing `PolaroidGroup`s are `hidden lg:flex` — they disappear on mobile entirely. For the YM scatter, that's wrong: the person is the content. Override to **show 3 polaroids on mobile** (the barber, the decks shot, the portrait), stacked or in a tight 2-up grid above the cassette. Drop the back-cards on mobile; they're decorative.

#### What this replaces
The current Night act's right column is two large polaroids (suit + jacket — Pulp Fiction stills) at `Timeline.tsx:761–782`. **Cut both.** The Pulp-Fiction suit was always doing the "dressed up at night" job that Dress now owns; the redesign retires the column.

#### Path
`Timeline.tsx:761–782` (current PolaroidGroup) ; new asset dir `public/assets/day-n-night/ym/` ; if a new alt-text key namespace is wanted, `Event.DayNNight.ymScatter.{barber,decks,portrait,…}.alt` — but most polaroids ship with empty alts since they're decorative-texture, not informative.

---

## 6. KO-specific summary

Six things to do as one Korean pass:

 
3. **Strip the orphan `\n\n.`** at the end of `opening.body` (KO).
4. **Reconcile `moodboard.dress.pink.caption`** — describes the wrong image.
 


---

## 7. Don't-ship list — copy that violates VOICE.md today

These are the lines that will land badly. In rough order of severity.

| # | Key | Locale | Current | Why it fails |
|---|---|---|---|---|
| 1 | `Event.DayNNight.opening.body` | ko | trailing `\n\n.` | renders an orphan period |
| 2 | `Event.DayNNight.survivalKit.subheading` | ko | `여섯 가지만 간단히 알려드릴게요.` | `~게요` (V3/V4) |
| 3 | `Event.DayNNight.survivalKit.address.hint` | ko | `누르면 복사돼요. 지도는 카카오맵으로 열립니다.` | `~돼요` |
| 4 | `Event.DayNNight.survivalKit.toss.hint` | ko | `누르면 계좌번호가 복사돼요.` | `~돼요` |
| 5 | `Event.DayNNight.survivalKit.copied` | ko | `복사했어요` | `~어요` |
| 6 | `Event.DayNNight.survivalKit.plusOnes.value` | ko | `예약자 본인만 입장 가능해요. 현장 동반자 입장은 어렵습니다.` | mixed register inside one row |
| 7 | `Event.DayNNight.survivalKit.late.value` | ko | `밤 9시까지 문을 열어둘게요. 그 이후엔 노크해 주세요.` | `~게요` + `~주세요` |
| 8 | `Event.DayNNight.dressCode.heading` | ko | `…나이에 얽매이지 마세요.` | `~세요` |
| 9 | `Event.DayNNight.dressCode.option1.body` | ko | `…변명 없이 꺼내 입으세요.` | `~세요` |
| 10 | `Event.DayNNight.closing.lede` | ko | `…빈자리를 당겨 앉으세요.` | `~세요` (renders on both views, double exposure) |
| 11 | `Event.DayNNight.opening.kicker` | ko | `Smoke Low and Slow... 30 years minimum.` | reads as a paraphrase of the English, loses the bit; tone-uneven against tribute.body's literary register |
| 12 | `Event.DayNNight.moodboard.dress.pink.caption` | ko | `Hollister much?…(Mean Girls, 2006)` | describes a different image than the en sibling |
| 13 | `Event.DayNNight.tribute.body` | ko | `…무슨 매력이겠어요?` | register mix inside the strongest block on the page |
| 14 | `Event.DayNNight.footer.hosts` | ko | `Hosted by Sean & friend` | English-only KO string (V5) |
| 15 | `Event.DayNNight.footer.rsvpClosesAt` | ko | `RSVPs close when the room fills.` | English-only KO string (V5) |
| 16 | `Event.DayNNight.date.weekday` | ko | `Sunday` | English-only KO string (V5) |
| 17 | `Event.DayNNight.location.label` | ko | `Location` | English-only KO string (V5) |
| 18 | `Event.DayNNight.audio.{on,off}` | ko | `Sound on / Sound off` | English-only KO string (V5) |
| 19 | `Event.DayNNight.scrubber.*` | ko | `Opening / Cookout / Dress / Night / Reserve` | English-only KO strings (V5) |
| 20 | `Event.DayNNight.act.day.body` | ko | `… 정중히 묻는다면 진(Gin)을 내어드릴지도 모릅니다.` | stiff phrasing, audit §11 flagged English fragments still present |

Implementing #1–#10 + #14–#19 closes the worst of it. The rest is polish.

---

## 8. Open questions for Sean

### Night / YM.FM
1. ✅ **Blurb locked** (2026-05-20): *"Our dear friend. The reason the night sounds the way it does."* Role line: *"Barber. Musician. Great Dude."*
2. ✅ **Handle locked**: `@yangminwoo` → `https://instagram.com/yangminwoo`.
3. **Audio track pick (open).** `public/track_media/` has `MOTION FREESTYLE-1.mp3` / `-2.mp3` / `-3.mp3` plus `Track_1`–`Track_9`. Recommended: **MOTION FREESTYLE-1.mp3** as A-side. Confirm or pick another. Also: trim to 45–90s for the tease (keep full file as ground truth).
4. **Photos for the scatter (open — see §5.7).** 5–8 candid polaroids of YM (barber moments, behind decks, candid with Sean, portrait). Sourcing path: Sean's camera roll + a DM to YM for favourites + optionally a curated `@yangminwoo` subset **with explicit permission**. Drop under `public/assets/day-n-night/ym/`.

### Other content decisions
5. **Co-host's actual name** for the footer (§5.5)?
6. **Korean reference image** (§5.1) — `A Bittersweet Life` for Night moodboard (if we keep a moodboard there at all — see §3.6 redesign), or `극한직업` for Cookout?
7. **The FAQ block** (§5.2) — yes/no, and any of the 6 Qs you want me to drop or rewrite?
8. **`rsvp.consented` opt-in toggle copy** (§3.8 gap 1) — confirm direction before M1 ships.
9. **The "30 & Smokin'" kicker** stays English-only in both locales today. Confirm — or want a real Korean port (e.g. `서른, 그리고 여전히 뜨겁게.`)?
10. **`hideawayseoul.com` vs Sean's personal mailto** for SurvivalKit host row — the brand surface implies the former; the personal-invitation framing implies the latter. Pick one.
11. **Closing lede fate** (§3.7 gap 2) — fold *"Pull up a chair. The fire's been waiting."* into the relocated tribute body as its closing beat, or cut it entirely?

---

## 9. Implementation order (suggested)

If we land this storyboard's proposals in one or two passes:

1. **§7 don't-ship list** — 1h. Pure copy edits to `messages/{en,ko}.json`. No code.
2. **§4 moodboard cleanup** — 30m.
3. **§3 polish passes by surface** — 2–3h. Keys + the small structural additions (closing eyebrow, dress outro, etc.).
4. **§5 net-new content** — 2–4h. Korean reference image (asset work), FAQ block (component), payment-confirmation banner (component).
5. **Open questions § 8** — async with Sean.

Total: ~6–8h spread across two sessions, plus Sean's review time.

---

*Last reviewed: 2026-05-20. Owner: Sean (final copy authority). Companion doc to `DAY_N_NIGHT.md` (architecture) and `VOICE.md` (voice rules). When VOICE.md and this doc conflict, VOICE.md wins.*
