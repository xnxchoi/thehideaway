# Voice & Translation Guide

> The single source of truth for how The Hideaway speaks — in English and in Korean.
> Read this before writing any user-facing text. Reference the glossary (§4) before translating any new string.
>
> This document supersedes all prior `VOICE*.md` drafts. Where other readmes touch on copy, they defer here.

---

## 1. Brand Positioning

The Hideaway is a **retreat from the hectic socialsphere** — a bridge between the private and the public. Its posture is borrowed from boutique, design-led hospitality and from quiet members' clubs.

Patrons come here to:

- **convene**  
- **be read**
- **step out of the loop **

The voice should feel like a concierge who knows you, a gallery manager who curates for you, and a quiet lounge where conversation is unhurried. Never a tech product. Never a social network. Always a quiet, welcoming accommodation for the few.

### 1.1 The tonal target

The Hideaway does **not** borrow from legacy grand-hotel language. The closer reference point is younger, design-led luxury: culturally aware, self-possessed, slightly dry, never loud.

The voice should feel:

- composed, but not ceremonious
- warm, but not pampering
- witty, but not playful
- deferential, but not overly attentive

It is closer to a well-run private house, design hotel, or members' club than to a five-star hotel lobby. The aim is a narrow midpoint: **nonchalant restraint + dry warmth + professional polish**.

It should not feel like:

- a startup app
- a heritage luxury brochure
- a stiff institutional system
- an overly affectionate concierge

### 1.2 Functional priority over metaphor

**Not every line should be hospitality-coded.** Metaphor is a tonal instrument, not a rule.

When a line carries technical information, operational status, or a required next step, clarity takes priority over metaphor. In these contexts, use the most natural and precise wording available — even if it means saying "log in" instead of "check in", or "save" instead of "keep".

Lines where clarity wins by default:

- network or server issues
- login / authentication / session messages
- payment failures
- permission and access restrictions
- legally required notices
- any "you must do X next" instruction

This is the single most common drift point in past Hideaway copy. When in doubt, write the literal sentence first, then ask whether tonal substitution would actually help.

### 1.3 What the voice is NOT

| Not this | Because |
|---|---|
| Playful startup tone ("Oops!", "Awesome!", "Let's go!") | Growth-hacking app energy |
| Cheerful exclamation marks | Breaks composure |
| "Hey there!" / "Welcome back, friend!" | Over-familiar; wrong for a members' club |
| Bureaucratic formality ("You must now proceed to…") | Cold; also wrong |
| Affectionate concierge ("회원님을 위해 준비했습니다") | Saccharine; substitutes warmth for design |
| Metaphor-first technical copy ("닿지 못했습니다" for a 503) | Style covering up unclarity |
| Emoji in UI copy | Never |
| "Users" addressed as such | They are **patrons**, **members**, or **readers** |

---

## 2. English Voice — Core Rules

### 2.1 Register

- **Understated, composed, attentive.** The staff of a good club is present without hovering.
- **Never hype.** If something is new or premium, let hierarchy, typography, and whitespace say so — not the copy.
- **Short over long where short will do.** An editorial sentence earns its length; a button does not.
- **Verbs over nouns** in UI (`Publish`, not `Publication`; `Send`, not `Submission`).

### 2.2 Punctuation & mechanics

- **No exclamation marks in UI.** None. Not even for success toasts. Editorial body may use one, sparingly, for a quoted voice.
- **Em dash (—) preferred over semicolons** in editorial copy; hyphens (-) only for compound words.
- **Sentence case** for headlines and buttons. Title case only for proper nouns and the product name itself.
- **No trailing periods on UI microcopy** (button labels, menu items, eyebrows, badges). Editorial sentences keep their periods.
- **Numerals over words** in UI (`3 essays`, not `three essays`); words in editorial prose when natural.
- **Oxford comma**, always.
- **Curly quotes** (" " ' ') in editorial copy; straight quotes acceptable in code-facing strings where the renderer handles it.
- **UK-English spelling** in editorial body. UI microcopy may use the shorter form when it materially helps scannability — but stay consistent within a surface.
- **Uppercase mono labels** are reserved for eyebrows and editorial chrome. Do not use them for buttons.

### 2.3 The verb set (hospitality where it earns its keep)

The metaphorical verbs below replace their tech-flavoured counterparts on **branded** surfaces (marketing, editorial, member-facing flows). On **technical** surfaces (auth, errors, billing, permissions), use the conventional verb — see §1.2.

| Instead of | Use (branded) | Use (technical) |
|---|---|---|
| Sign in | **Check in** | **Log in** |
| Sign up / Register | **Request membership** / **Join** | **Sign up** |
| Sign out / Log out | **Step out** | **Log out** |
| Delete account | **Close membership** | **Delete account** |
| Subscribe | **Become a patron** | **Subscribe** |
| Save / Bookmark | **Keep** | **Save** |
| Share | **Pass along** | **Share** |
| Submit | **Send** / **Publish** / **Post** | (the literal verb) |
| Upload | **Add** | **Upload** |
| Try again | **Try once more** | **Try again** |
| Error | **That didn't land.** / **We couldn't reach that.** | The specific error |
| Loading… | (visual indicator alone, or **One moment.**) | (visual indicator alone) |
| Welcome back! | **Welcome in.** / **Good to see you.** | — |

Decision rule: if removing the metaphor would make the line clearer to a first-time user under pressure, remove the metaphor. The brand survives small concessions to clarity. It does not survive opacity.

### 2.4 Honorifics toward the patron

- Address the patron in second person singular ("you"). Never folksy plural ("you all", "folks").
- Use a possessive only when the thing is theirs ("your essays", "your shelf"). Never "our essays for you".
- For staff action, prefer the passive or the institutional **"The Hideaway"** as subject: *"The Hideaway keeps your reading private."* not *"We keep your reading private."* The "we" voice is reserved for the editor's letter and similar first-person surfaces.

### 2.5 Tone scale by surface

| Surface | Tone |
|---|---|
| Hero / brand copy | Editorial, literary, quietly confident |
| Section headings | Declarative, calm |
| Button labels | Verbs. Short. Sentence case, no period |
| Empty states | Considered; one line of poetry permitted |
| Errors | Unalarmed. Names the failure, offers the next step. Literal when safety or recovery is on the line |
| Success toasts | A single word or short phrase. No exclamation |
| Auth / permissions | Conventional and direct. Brand metaphor not required |
| Legal / policy | Plain, precise, respectful. Not a law firm's voice |
| Billing / commerce | Clear, specific, numerical. Brand metaphor optional and minimal |
| Admin (`/vault`) | Functional, terse — staff-facing, not patron-facing |

### 2.6 Hard bans (English)

The following constructions are not acceptable in any user-facing surface:

- exclamation marks in UI
- "Oops!" / "Whoops!" / "Yikes!"
- "Awesome!" / "Let's go!" / "You got it!"
- "friend" as a salutation
- bait questions ("Want to know a secret?", "Ready to begin?")
- forced lowercase as an aesthetic choice
- LinkedIn thought-leader cadence ("In 2026, X will Y.")
- "Excited to share…" and other launch-speak
- emojis in UI text
- "Users" as a noun for the audience

### 2.7 Before / after

> ❌ "Oops! Something went wrong. Please try again!"
> ✅ "That didn't land. Try once more." *(branded surface)*
> ✅ "We couldn't reach the server. Try again." *(technical surface)*

> ❌ "Welcome back! You have 3 new notifications 🎉"
> ✅ "Welcome in. 3 notices await."

> ❌ "Sign up now to unlock premium features!"
> ✅ "Request membership."

> ❌ "Your highlight has been saved successfully!"
> ✅ "Saved."

---

## 3. Korean Voice — Porting Rules

The English voice is the driver. Korean is **ported** with the same posture, not translated word-for-word.

### 3.1 Register — 합니다체, softened

**Primary register: 합니다체** (격식체), consistent with the language of a premium members' club and of literary publications.

Flat 합니다체 reads as bureaucratic. Soften it with attentive auxiliaries and hospitality phrasing where the moment supports it:

| Cold 합니다체 | Warmed 합니다체 |
|---|---|
| 저장되었습니다 | 보관해 두었습니다 *(only when archival metaphor is warranted)* |
| 로그인하세요 | 입장해 주십시오 *(only on brand-forward entry)* |
| 오류가 발생했습니다 | 잠시 연결이 머뭇거립니다 *(only on non-critical, ambiguous disruptions)* |
| 확인하세요 | 확인해 보시겠습니까 |

**Do not use 해요체** (해요 / 이에요) in product surfaces. It is warm, but it is the register of cafés and consumer apps — wrong for a boutique club.

**Exception — legal & policy:** pure 합니다체, no softeners, no metaphor. Read as clean, respectful, precise. Aim for 조선호텔 회원약관 cleanness, not ornament.

**Exception — editorial body (essays, Surf):** writer's voice wins. Register follows the author. This guide governs UI and framing copy around the content.

### 3.1.1 Technical clarity rule (load-bearing)

Classify every Korean string into one of two buckets **before** considering tone:

**A. Technical / operational / required-action copy.** Use direct, conventional Korean. Precision over texture.

- 로그인이 필요합니다.
- 네트워크 연결이 어렵습니다.
- 결제를 완료하지 못했습니다.
- 접근 권한이 없습니다.
- 다시 시도해 주십시오.

**B. Atmospheric / low-risk / brand-framing copy.** Where the meaning is simple and no critical action depends on the wording, the line may carry more tone.

- 아직은 조용합니다.
- 천천히 둘러보셔도 좋습니다.
- 아직 완성된 글이 없습니다.

**Do not stylize class A as if it were class B.** This is the single most common drift in past Hideaway Korean copy — abstract metaphor ("잠시 닿지 못했습니다") substituting for the literal line a user actually needs in the moment of failure.

### 3.1.2 The omission advantage

Korean UI benefits from subjectless, objectless fragments far more than English does. Using nominal or fragment forms:

- reduces forced honorific handling
- avoids awkward omitted-subject full sentences
- preserves calmness
- prevents over-addressing the user

This is one of the strongest reasons to prefer short nominal structures in Korean UI. Examples that often outperform their full-sentence cousins:

- 에세이 둘러보기
- 저장해 두기
- 라디오 들어보기
- 로그인 필요
- 회원 전용
- 접근 불가

### 3.2 Addressing the patron

- **회원님** for direct address only when salutation is warranted (welcome moments, email opening, concierge surfaces). Not by default.
- **Avoid 당신** — cold / confrontational in Korean.
- **Avoid 고객님** — too commercial.
- **No name-plus-씨** ("지민씨") in system copy. First-name direct address is earned, not defaulted.
- Use **the Hideaway itself** (`The Hideaway` / `더 하이드어웨이` / `하이드어웨이`) as the subject for institutional statements.

#### 3.2.1 Avoid over-addressing

Do not add 회원님, 고객님, or possessive framing unless the moment genuinely calls for direct address. Most lines do not.

| Avoid | Prefer |
|---|---|
| 회원님의 공간에 저장해 두었습니다 | 저장되었습니다 |
| 회원님을 위해 준비했습니다 | 준비되어 있습니다 |
| 고객님의 선택을 기다립니다 | 선택하실 수 있습니다 |

Respect is carried by register and restraint, not by repeated address.

### 3.3 Punctuation & mechanics (Korean)

- **느낌표 금지** in UI — same rule as English.
- **물결표(~)와 이모티콘 금지** in product surfaces. Casual markers; they break register.
- **줄임표는 '…'** (U+2026), not `...`.
- **가운뎃점(·)** for inline series in editorial; **쉼표(,)** in UI.
- **숫자는 아라비아 숫자** in UI; 편집 본문에서는 문맥에 따라 한글 숫자 허용.
- **띄어쓰기는 국립국어원 권장안** 기준. `더 하이드어웨이` (띄어쓰기 포함).

### 3.4 The three checks

Before committing a Korean string, read it against three questions:

1. **Is this class A or class B?** (§3.1.1) If class A and the line carries metaphor, rewrite to the literal Korean.
2. **Does it carry the English line's restraint?** If the English has one beat and the Korean has three, trim. If the English is quiet and the Korean is eager, the wrong suffix is doing it.
3. **Is the suffix register correct — and consistent with every other sentence in the same block?** See §3.5–3.7. `~기` for invitations, `~니다` for statements, `~십시오` for direct requests. Never `~세요` / `~해요`. Never mix within a block.

### 3.5 Suffix grammar — the three-register rule

Korean suffix choice is not cosmetic. A wrong ending turns a quiet invitation into a growth-hacky push notification, or a library into a DMV. Three registers are in use. Within any one coherent block (button, paragraph, modal body, email, marketing section), only **one** register appears.

**The single failure mode to avoid above all:** translating an English bare imperative — *"Become a patron"*, *"Give it a try"*, *"Discover essays"* — as a `~가 되다` / `~를 하다` / `~하세요` form. The English reads as a label or a soft invitation; the naive Korean renders it as either a command (`회원이 되십시오`), an eager plea (`회원이 되세요`), or a dictionary entry (`회원이 되다`). Unmistakably machine-translated, tonally broken. Use the `~기` nominal form, or restructure the line.

#### 3.5.1 Register A — `~기` / `~보기` (nominal; labels, CTAs, invitations)

Default register for anything the patron **may** choose to do but is not being **directed** to do. Reads as the name of an action, not a command — closer to a printed menu item than a waiter's instruction.

Use for:

- Button labels: `보관하기`, `입장하기`, `밑줄 긋기`, `팔로우하기`
- Nav / menu items acting as verbs: `에세이 둘러보기`
- Soft invitations and marketing CTAs: `조용히 둘러보기`, `라디오 들어보기`
- Any action framed as optional, explorable, or considered

##### `~기` is useful, but not sacred

Do **not** apply `~기` so rigidly that the interface starts to sound machine-generated. A short fragment is often better than a grammatically purer `~기`:

| Forced `~기` | Cleaner fragment |
|---|---|
| 로그인하기 *(when used as a status, not a button)* | 로그인 필요 |
| 접근하기 불가 | 접근 불가 |
| 저장하기 완료 | 저장 완료 |
| 회원 되기 전용 | 회원 전용 |

Use `~기` when it produces a natural and quiet label. Drop it when a fragment or noun form lands cleaner.

#### 3.5.2 Register B — `~니다` (declarative; status, confirmation, prohibition)

Use when the system states a fact, confirms a completed action, issues a warning, or defines a boundary. `~니다` commands full attention without eagerness — it tells the patron the shape of the world.

Use for:

- Completed-action toasts: `저장되었습니다.`, `전송되었습니다.`, `게시되었습니다.`
- Errors as statements: `연결이 어렵습니다.`, `로그인이 필요합니다.`, `접근 권한이 없습니다.`
- Boundaries and prohibitions: `회원 전용입니다.`, `더 이상 변경할 수 없습니다.`
- Declarative brand copy: `더 하이드어웨이는 피드가 아닙니다.`

#### 3.5.3 Register C — `~십시오` (composed direct request; rare, reserved)

Use only when the system genuinely needs the patron to do a specific thing next. `~십시오` in 합니다체 is the composed equivalent of "please" — not eager, not casual.

Use for:

- Error-recovery instruction: `다시 시도해 주십시오.`
- Required next step: `이메일을 확인해 주십시오.`
- Classical hospitality set phrases: `어서 오십시오.`

### 3.6 Banned in product surfaces

- **`~세요`** — café / consumer-app register. Reads as eager ("please do it!"), the voice we most want to avoid. No exceptions in UI, marketing, errors, or toasts. Acceptable only inside a first-person editor's letter as a deliberate stylistic choice.
- **`~해요` / `~이에요`** — 해요체, already excluded in §3.1.
- **`~가 되다` / `~를 하다` bare dictionary forms** — only valid in headings when the form is genuinely nominal (사전식 용어), which is almost never the right call.
- **느낌표** and **물결표(~)** in UI.
- **고객님** in member-facing copy.
- **게스트** in member-facing copy.
- Direct ports of English success-toast theatre (`성공적으로 저장되었습니다!`).

### 3.7 The consistency rule

Within any single coherent unit — a paragraph, a modal's full body, an email, a section of marketing copy — **the register must not switch**. Korean sentence endings are visually prominent; switching from `~기` to `~니다` to `~십시오` across three consecutive sentences reads as three different speakers.

This often means **restructuring the Korean from the English shape**. English can mix "Become a patron. Your reading stays private. Try Radio." in one breath — declarative, invitational, imperative — and read fine. In Korean, pick one posture and reshape the block:

**All-`~기` (invitational block):**
> 회원 가입. 조용히 읽기. 라디오 들어보기.

**All-`~니다` (declarative block):**
> 회원으로 가입하실 수 있습니다. 읽으시는 내용은 기록되지 않습니다. 라디오를 이용하실 수 있습니다.

Pick the register that matches the **dominant purpose** of the block, and rewrite every non-matching sentence into it. Do not preserve English sentence shapes at the cost of Korean cohesion.

### 3.8 Before / after (Korean)

#### Errors

> ❌ 앗! 오류가 발생했어요. 다시 시도해 주세요!
> ❌ 잠시 닿지 못했습니다. 다시 시도해 주십시오. *(too abstract as a technical default)*
> ✅ 연결이 어렵습니다. 다시 시도해 주십시오. *(class A: technical failure)*
> ✅ 잠시 연결이 머뭇거립니다. 다시 시도해 주십시오. *(class B: ambiguous, non-critical)*

#### Empty states

> Neutral: 아직 비어 있습니다.
> Preferred (tonal): 아직은 조용합니다.

#### Save / keep

> ❌ 하이라이트가 성공적으로 저장되었습니다!
> ✅ 저장되었습니다. *(default digital action)*
> ✅ 보관해 두었습니다. *(only when the object feels editorial or archival)*

#### Auth

> ❌ 로그인 하시겠어요?
> ❌ 로그인하세요
> ✅ 로그인 *(button label, auth surface)*
> ✅ 로그인이 필요합니다. *(required-state message)*
> ✅ 입장하기 *(only on brand-forward entry CTA; not on the real auth form)*

#### Membership

> ❌ 회원이 되세요! 프리미엄 기능을 잠금 해제하세요!
> ❌ 회원이 되십시오.
> ❌ 회원이 되다 *(dictionary register)*
> ✅ 멤버십 신청 / 입회 신청 *(onboarding gate)*
> ✅ 회원 가입 *(simple product flow)*
> ✅ 회원되기 *(brand-forward marketing label only)*

#### Unified block

> ❌ 에세이를 둘러보세요. 마음에 드는 글을 저장하세요. 친구에게 공유하세요. *(three `~세요` commands — tonal chaos)*
> ✅ 에세이 둘러보기. 마음에 드는 글은 저장해 두기. 필요하다면 전하기. *(unified `~기`, restrained, less mannered than literary insistence)*

> ❌ 오늘의 에세이를 읽어보세요. 작가님의 글은 매주 업데이트되어요. *(mixed `~세요` + `~요` — cafe register)*
> ✅ 오늘의 에세이입니다. 필자의 글은 매주 새롭게 도착합니다. *(unified `~니다` declarative block)*

---

## 4. Glossary (Canonical Terms)

**Rule of thumb:**

- **Proper-noun brand surfaces** stay in English (or in Latin script in Korean copy).
- **Role words** are Hangulised where an established Korean term is stronger (회원 over 패트런).
- **Verbs** are translated into the right register for the surface — hospitality verb when branded, conventional verb when technical (§1.2, §3.1.1).

### 4.1 Brand & surfaces

| English | Korean | Notes |
|---|---|---|
| The Hideaway | `The Hideaway` / `더 하이드어웨이` | Keep the brand name untranslated. Prefer Latin in headers, nav, and logo-adjacent surfaces. Use `더 하이드어웨이` in Korean body copy where mixed script feels visually awkward. Never translate the meaning. |
| Radio | Radio | Surface name — keep in English. |
| Surf | Surf | Surface name — keep in English. |
| Essays | Essays / 에세이 | `Essays` in nav and listings; `에세이` in Korean body copy. |
| Playlists | Playlists / 플레이리스트 | Same rule as Essays. |
| Albums | Albums / 앨범 | Same rule. |
| Tracks | Tracks / 트랙 | Same rule. |
| Series | Series / 시리즈 | Same rule. |
| Compilations | Compilations / 선집 | `선집` is cleaner and more literary than the earlier `편집선`. |
| Shelf (library) | Shelf / 서가 | `서가` works well when the library metaphor is foregrounded. Use selectively. |
| The Vault (admin) | The Vault / Vault | Internal/admin-facing only. Do not force `금고` unless an explicit Korean-only internal surface calls for it. |

### 4.2 Role & membership words

| English | Korean | Notes |
|---|---|---|
| Patron | 회원 | Canonical. Do **not** use `패트런` or `후원자`. |
| Member | 회원 | Same. |
| Patrons-only / Members-only | 회원 전용 | Standard. |
| Editor | 에디터 | |
| Author | 필자 / 저자 | `필자` for bylines and editorial chrome; `저자` for bibliographic / metadata contexts. |
| Admin | 관리자 | Staff-facing only. |
| Concierge | 콘시어지 | Only if the role is explicitly surfaced as part of the brand experience. |
| Guest (non-member viewer) | 방문자 / 방문객 | `방문자` for product/UI. `방문객` is slightly more formal — fine in brand copy. Avoid `게스트` in member-facing surfaces. |

### 4.3 Core verbs

> Three columns per row: **UI / CTA**, **Declarative / system copy**, and **Avoid**.
> These are preferred defaults. Where an action is technical, the conventional Korean product term may be the right call; §1.2 and §3.1.1 govern.

| English | UI / CTA | Declarative / system copy | Avoid |
|---|---|---|---|
| Check in *(branded entry)* | 입장하기 | 입장하실 수 있습니다 | `체크인` |
| Sign in / Log in *(actual auth)* | 로그인 / 로그인하기 | 로그인되었습니다 / 로그인이 필요합니다 | forcing `입장` into every auth context |
| Step out / Sign out | 나가기 / 로그아웃 | 로그아웃되었습니다 | `퇴장하셨습니다` unless deliberately theatrical |
| Join / Request membership | 멤버십 신청 / 입회 신청 / 회원 가입 | 멤버십을 신청하실 수 있습니다 / 회원 가입이 가능합니다 | `회원되기` as a universal default |
| Become a patron *(marketing surface)* | 회원되기 / 멤버십 신청 | 회원으로 가입하실 수 있습니다 | `회원이 되십시오`, `회원이 되세요`, `회원이 되다` |
| Close membership | 회원 탈퇴 / 멤버십 해지 | 회원 탈퇴가 완료되었습니다 / 멤버십이 해지되었습니다 | `계정 삭제` (wrong concept); `회원 자격 해지` (too legalistic) |
| Save / Keep | 저장하기 / 저장 | 저장되었습니다 / 저장해 두었습니다 | `보관하기` as the universal default |
| Keep *(editorial / archival only)* | 보관하기 | 보관해 두었습니다 | applying `보관` platform-wide |
| Bookmark | 북마크 / 저장 | 북마크에 추가되었습니다 / 저장되었습니다 | banning `북마크` outright |
| Pass along *(editorial share)* | 전하기 | 전했습니다 | forcing `전하기` in dense utilitarian UI |
| Share *(utilitarian)* | 공유하기 | 공유되었습니다 | over-stylising standard share actions |
| Highlight (verb) | 밑줄 긋기 / 표시하기 | 밑줄이 저장되었습니다 / 표시되었습니다 | `하이라이트 하기` |
| Highlight (noun) | 밑줄 / 하이라이트 | — | banning `하이라이트` in all contexts |
| Memo *(on a highlight)* | 메모 남기기 | 메모가 저장되었습니다 | — |
| Annotate / note | 메모 남기기 / 주석 달기 | 메모가 저장되었습니다 / 주석이 추가되었습니다 | — |
| Follow | 팔로우 / 팔로우하기 | 팔로우 중입니다 | `구독하기` unless the product really means subscription |
| Unfollow | 팔로우 해제 | 팔로우가 해제되었습니다 | — |
| Explore / Browse | 둘러보기 | 둘러보실 수 있습니다 | `둘러보세요` |
| Try | 들어보기 / 읽어보기 / 써보기 | 이용하실 수 있습니다 | `시도해 보세요` (salesy) |
| Welcome in | 어서 오십시오 / 환영합니다 | — | treating this as mandatory on every arrival surface |
| One moment | 잠시만 기다려 주십시오 | 잠시만 기다려 주십시오 | banning all conventional waiting language in the name of tone |

#### 4.3.1 The routing rule

Anything optional, exploratory, or lightly invitational may use the shorter nominal / fragment form. Anything technical, stateful, or action-critical takes the clearest conventional Korean available. Do not force one metaphorical register across all product surfaces.

### 4.4 Errors, empty states, toasts

| English | Korean | Notes |
|---|---|---|
| That didn't land. *(branded)* | 잠시 처리되지 않았습니다. / 잠시 연결이 머뭇거립니다. | Use the first in clearer system contexts; the second only where slight tone is appropriate. |
| We couldn't reach that. *(branded)* | 지금은 연결이 어렵습니다. | Better default than the more abstract `닿지 못했습니다`. |
| Connection failed. *(technical)* | 연결이 어렵습니다. / 네트워크 연결이 어렵습니다. | Class A: do not stylise. |
| Try once more. / Try again. | 다시 시도해 주십시오. | Universal. |
| Saved. / Kept. | 저장되었습니다. / 저장해 두었습니다. | Use `보관` only when the object is editorial or archival. |
| Sent. | 전송되었습니다 / 공유되었습니다 / 전했습니다 | Pick by action type. Do not overuse `전했습니다`. |
| Published. | 게시되었습니다 / 발행되었습니다 | `발행` for editorial publishing; `게시` for generic platform actions. |
| Nothing here yet. | 아직 비어 있습니다. / 아직은 조용합니다. | Second version where tone can breathe. |
| Only patrons may view this. | 회원 전용입니다. | |
| Login required. | 로그인이 필요합니다. | Class A. |
| Access denied. | 접근 권한이 없습니다. | Class A. |
| Session expired. | 세션이 만료되었습니다. 다시 로그인해 주십시오. | Class A. |
| Payment failed. | 결제를 완료하지 못했습니다. | Class A. |

### 4.5 Commerce

| English | Korean | Notes |
|---|---|---|
| Plan | 멤버십 / 이용권 / 플랜 | Use `회원권` only if the offline-club framing is genuinely the product. Otherwise `멤버십` is the cleanest default. |
| Invoice | 인보이스 / 청구서 | `청구서` for Korean-primary surfaces. |
| Receipt | 영수증 | |
| Refund | 환불 | |
| Coupon | 쿠폰 | |
| Subscription (billing mechanism) | 정기 결제 | Distinct from 구독 (content). Use `정기 결제` when referring specifically to billing mechanics. |
| Membership fee | 멤버십 요금 / 가입비 / 회비 | Split by actual business meaning; do not flatten. |

---

## 5. Working procedure

When adding or revising a string:

1. Write the English first, against §2.
2. Classify: is this **class A** (technical / required-action / legal) or **class B** (atmospheric / brand-framing)? Class A leans literal; class B can carry tone.
3. Check the glossary (§4) for every noun and verb. Use existing terms; do not invent.
4. Draft Korean in 합니다체, softened where appropriate.
5. Run the three checks (§3.4).
6. Read the Korean out loud. If it sounds like a delivery-app push notification, rewrite. If it sounds like an over-stylised translation rather than something a Korean brand would publish, rewrite toward native idiom.
7. Add both to the matching `messages/{en,ko}/*.json` file under the same key path.
8. Never ship a Korean string identical to the English one. If the English **is** the intended Korean value (e.g. a brand surface name), mark with a `_locked` sibling key documenting why.

### 5.1 Tone-routing test

Before translating any string, answer four questions:

1. **Is this technical, procedural, legal, or action-critical?** If yes, conventional and literal Korean first. Tone comes second.
2. **Is this simple, low-risk, atmospheric, or brand-framing?** If yes, allow more texture.
3. **Does the Korean read as a translated concept rather than something a Korean brand would naturally publish?** If yes, rewrite toward native idiom — even if it drifts from the English metaphor.
4. **Is the line respectful without explicitly over-addressing the user?** If no, remove unnecessary direct address.

### 5.2 When in doubt

- **Keep English** if Hangulising the term would read as cheap or generic.
- **Translate** if an established Korean hospitality term is stronger than a loanword.
- **Ask the editor** before inventing a term. Glossary entries are locked, not drafted live.

---

## 6. Governance

- **This document is the source of truth.** PRs that introduce new strings must use an existing glossary entry or propose a glossary addition in the same PR.
- **The glossary (§4) is versioned.** Changes to an entry require updating every existing string that used the prior term in the same change.
- **Parity is enforced in CI** via `scripts/i18n-parity.ts` (see §7 when implemented).
- **Tone drift is a bug.** File it as one.

### 6.1 What counts as tone drift

Tone drift is not only "too casual" or "too bureaucratic". It also includes:

- over-literal metaphor porting (using `보관` for every save, `입장` for every login)
- excessive hospitality affectation (`회원님을 위해…`)
- unnecessary direct address
- replacing clear technical wording with vague atmospheric wording (`닿지 못했습니다` for a 503)
- register mixing inside a single block (§3.7)
- exclamation marks, `~세요`, `~해요`, emojis, `~` in any product surface
- forcing `~기` so rigidly that the interface starts to sound machine-generated

> The Hideaway should feel **designed, not translated**.

---

## 7. Related files

- `messages/en/*.json`, `messages/ko/*.json` — split per surface (common, auth, highlightr, radio, brand, legal, commerce, etc.)
- `scripts/i18n-parity.ts` — key-tree diff, ICU placeholder check, identical-value check *(to be implemented)*
- `scripts/i18n-audit.ts` — one-off grep for hardcoded JSX text to migrate *(to be implemented)*

---

*Last reviewed: 2026-05-18. Owner: project editor. Supersedes `VOICE_v1.1.md`.*
