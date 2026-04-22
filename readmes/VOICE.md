# Voice & Translation Guide

> The source-of-truth document for how The Hideaway speaks — in English, and in Korean.
> Read this before writing any user-facing text. Reference the glossary before translating any new string.

---

## 1. Brand Positioning (the why behind the voice)

The Hideaway is a **retreat from the hectic socialsphere** — a bridge between the private and the public. It borrows its posture from boutique, high-end hospitality and exclusive members' clubs: Seoul Club, Aman, Rosewood, Soho House in its quieter moments.

Patrons come here to:
- **convene** — not to broadcast
- **be read, not ranked**
- **step out of the feed**

The voice should feel like a concierge who knows you, a librarian who curates for you, and a quiet lounge where conversation is unhurried. Never a tech product. Never a social network.

### What the voice is NOT

| Not this | Because |
|---|---|
| Playful startup tone ("Oops!", "Awesome!", "Let's go!") | Feels like a growth-hacking app |
| Cheerful exclamation marks | Breaks composure |
| "Hey there!" / "Welcome back, friend!" | Over-familiar; wrong for a members' club |
| Bureaucratic formality ("You must now proceed to…") | Cold; also wrong |
| Emoji in UI copy | Never |
| "Users" addressed as such | They are **patrons**, **members**, or **readers** |

---

## 2. English Voice — Core Rules

### 2.1 Register
- **Understated, composed, attentive.** The staff of a good club is present without hovering.
- **Never hype.** If something is new or premium, let hierarchy, typography, and whitespace say so — not the copy.
- **Short over long where short will do.** An editorial sentence earns its length; a button does not.

### 2.2 Punctuation & mechanics
- **No exclamation marks in UI.** None. Not even for success toasts. Editorial body may use one, sparingly, for a quoted voice.
- **Em dash (—) preferred over semicolons** in editorial copy; hyphens (-) only for compound words.
- **Sentence case** for headlines and buttons. Title case only for proper nouns and the product name itself.
- **No trailing periods on UI microcopy** (button labels, menu items, eyebrows, badges). Editorial sentences keep their periods.
- **Numerals over words** in UI (`3 essays`, not `three essays`); words in editorial prose when natural.
- **Oxford comma**, always.
- **Curly quotes** (" " ' ') in editorial copy; straight quotes acceptable in code-facing strings where the renderer handles it.

### 2.3 The verb set (hospitality over tech)

| Instead of | Use |
|---|---|
| Sign in | **Check in** |
| Sign up / Register | **Request membership** (onboarding) / **Join** (short form) |
| Sign out / Log out | **Step out** |
| Delete account | **Close membership** |
| Subscribe | **Become a patron** |
| Save / Bookmark | **Keep** |
| Share | **Pass along** (when editorial); **Share** (when necessary) |
| Submit | **Send** or the specific verb (**Publish**, **Post**) |
| Upload | **Add** |
| Try again | **Try once more** |
| Error / Something went wrong | **That didn't land.** / **We couldn't reach that.** |
| Loading… | no copy — use the visual indicator alone; if copy is needed, **One moment.** |
| Welcome back! | **Welcome in.** (on arrival) or **Good to see you.** |

### 2.4 Honorifics toward the patron
- Address the patron in second person singular ("you"), **never plural folksy** ("you all", "folks").
- Refer to their things with a possessive only when it is theirs ("your essays", "your shelf"). Never "our essays for you".
- When referring to staff action, prefer the passive or the institutional **"The Hideaway"**: *"The Hideaway keeps your reading private."* not *"We keep your reading private."* The "we" voice is reserved for the editor's letter and similar first-person surfaces.

### 2.5 A tone scale for reference

| Surface | Tone |
|---|---|
| Hero / brand copy | Editorial, literary, quietly confident |
| Section headings | Declarative, calm |
| Button labels | Verbs. Short. Sentence case, no period |
| Empty states | Considered; one line of poetry permitted |
| Errors | Unalarmed. Names the failure, offers the next step |
| Success toasts | A single word or short phrase. No exclamation |
| Legal / policy | Plain, precise, respectful. Not a law firm's voice |
| Admin (`/vault`) | Functional, terse — staff-facing, not patron-facing |

### 2.6 Before/after

> ❌ "Oops! Something went wrong. Please try again!"
> ✅ "That didn't land. Try once more."

> ❌ "Welcome back! You have 3 new notifications 🎉"
> ✅ "Welcome in. 3 notices await."

> ❌ "Sign up now to unlock premium features!"
> ✅ "Request membership."

> ❌ "Your highlight has been saved successfully!"
> ✅ "Kept."

---

## 3. Korean Voice — Porting Rules

The English voice is the driver. Korean is ported with the same posture, not translated word-for-word.

### 3.1 Register — 합니다체, softened

**Primary register: 합니다체** (격식체), consistent with the language of a premium members' club and of literary publications. Seoul Club, Shilla, Four Seasons Seoul, 조선호텔 all use 합니다체 in member-facing copy.

But **flat 합니다체 reads as bureaucratic**. We soften it with **attentive auxiliaries and hospitality phrasing**:

| Cold 합니다체 | Warmed 합니다체 |
|---|---|
| 저장되었습니다 | 보관해 두었습니다 |
| 로그인하세요 | 입장해 주십시오 |
| 오류가 발생했습니다 | 잠시 닿지 못했습니다 |
| 확인하세요 | 확인해 보시겠습니까 |

**Do not use 해요체** (해요/이에요) in product surfaces. It is warm, but it is the register of cafes and consumer apps — not of a boutique club.

**Exception — legal & policy:** pure 합니다체, no softeners. Legal copy should read as clean, respectful, and precise (조선호텔 회원약관 tone), not ornamental.

**Exception — editorial body (essays, Surf):** writer's voice wins. The register follows the author. Our guide is only for UI and framing copy around the content.

### 3.2 Addressing the patron

- **회원님** for direct address when salutation is warranted (welcome surfaces, email opening, concierge moments).
- **Avoid 당신** — feels cold / confrontational in Korean.
- **Avoid 고객님** — too commercial, too retail.
- **No name-plus-씨** ("지민씨") in system copy. First-name direct address is earned, not defaulted.
- Use **the Hideaway itself** (더 하이드어웨이 /  하이드어웨이) as the subject for institutional statements, same as in English.

### 3.3 Punctuation & mechanics (Korean)

- **느낌표 금지** in UI — same rule as English.
- **물결표(~)와 이모티콘 금지** in product surfaces. They are casual markers and break register.
- **줄임표는 '…'** (U+2026), not `...`
- **가운뎃점(·)** for inline series in editorial; **쉼표(,)** in UI.
- **숫자는 아라비아 숫자** in UI; 편집 본문에서는 문맥에 따라 한글 숫자 허용.
- **띄어쓰기는 국립국어원 권장안** 기준. `더 하이드어웨이` (띄어쓰기 포함).

### 3.4 Tone-preserving translation — the three checks

Before committing a Korean string, read it against three questions:

1. **Would a Seoul Club attendant say this to a member?** If it sounds like a delivery app push notification, rewrite. The hospitality metaphor must survive: "Check in" is not 로그인; "Keep" is not 저장.
2. **Does it carry the English string's restraint?** If the English has one beat and the Korean has three, trim. If the English is quiet and the Korean is eager, the wrong suffix is doing it.
3. **Is the suffix register correct — and consistent with every other sentence in the same block?** See §3.5. `~기` for invitations, `~니다` for statements, `~십시오` for direct requests. Never `~세요` / `~해요`. Never mix within a block.

### 3.5 Suffix Grammar — The Three-Register Rule

Korean suffix choice is not cosmetic. A wrong ending turns a quiet club invitation into a growth-hacky push notification, or a library into a DMV. We work with **three registers**, and within any one block (button, paragraph, modal body, email, marketing section) only **one** register may appear.

**The failure mode to avoid above all:** translating an English bare imperative with no subject — *"Become a patron"*, *"Give it a try"*, *"Discover essays"* — as a `~가 되다` / `~를 하다` / `~하세요` form. The English reads as a label or a soft invitation; the naive Korean renders it as either a command (`회원이 되십시오`), an eager plea (`회원이 되세요`), or a dictionary entry (`회원이 되다`). The result is the "all your base are belong to us" register — unmistakably machine-translated, tonally broken. **Use the `~기` nominal form instead.**

#### Register A — `~기` / `~보기` (nominal; labels, CTAs, invitations, suggestions)

The default register for anything the patron **may** choose to do but is not being **directed** to do. It reads as the name of an action, not a command — closer to a printed menu item than a waiter's instruction.

Use for:
- Button labels: `보관하기`, `입장하기`, `밑줄 긋기`, `팔로우하기`
- Nav / menu items acting as verbs: `에세이 둘러보기`, `회원되기`
- Soft invitations and marketing CTAs: `조용히 둘러보기`, `라디오 들어보기`
- Any action framed as optional, explorable, or considered

#### Register B — `~니다` (declarative; status, confirmation, prohibition, authoritative statement)

Use when the system states a fact, confirms a completed action, issues a warning, or defines a boundary. `~니다` commands full attention without eagerness — it is not asking the patron to do anything; it is telling them the shape of the world.

Use for:
- Completed-action toasts: `보관했습니다.`, `전했습니다.`, `발행했습니다.`
- Errors as statements: `잠시 닿지 못했습니다.`, `지금은 연결이 어렵습니다.`
- Boundaries and prohibitions: `회원 전용입니다.`, `더 이상 변경할 수 없습니다.`
- Declarative brand copy: `더 하이드어웨이는 피드가 아닙니다.`

#### Register C — `~십시오` (composed direct request; rare, reserved)

Use only when the system genuinely needs the patron to do a specific thing next (error recovery, required field, a direct concierge moment). `~십시오` in 합니다체 is the composed equivalent of "please" — not eager, not casual.

Use for:
- Error-recovery instruction: `다시 시도해 주십시오.`
- Required next step: `이메일을 확인해 주십시오.`
- Classical hospitality set phrases: `어서 오십시오.`

#### Banned in product surfaces

- **`~세요`** — the café / consumer-app register. Reads as eager ("please do it!"), which is the voice we most want to avoid. No exceptions in UI, marketing, errors, or toasts. Acceptable only inside a first-person editor's letter as a deliberate stylistic choice.
- **`~해요` / `~이에요`** — 해요체, already excluded in §3.1.
- **`~가 되다` / `~를 하다` bare dictionary forms** — only valid in headings when the form is genuinely nominal (e.g., 사전식 용어) which is almost never the right call here.

### 3.5.1 The consistency rule

Within any single coherent unit — a paragraph, a modal's full body, an email, a section of marketing copy — **the register must not switch**. Korean sentence endings are visually prominent; switching from `~기` to `~니다` to `~십시오` across three consecutive sentences reads as three different speakers.

This often means **restructuring the Korean from the English**. English can mix "Become a patron. Your reading stays private. Try Radio." in one breath — declarative, invitational, imperative — and read fine. In Korean, you pick one posture and reshape the block:

**All-`~기` (invitational block):**
> 회원되기. 조용히 읽기. 라디오 들어보기.

**All-`~니다` (declarative block):**
> 회원으로 합류하실 수 있습니다. 읽으시는 내용은 기록되지 않습니다. 라디오를 이용하실 수 있습니다.

Pick the register that matches the **dominant purpose** of the block, and rewrite every non-matching sentence into that register. Do not preserve English sentence shapes at the cost of Korean cohesion.

### 3.6 Before/After (Korean)

> ❌ 회원이 되세요! 프리미엄 기능을 잠금 해제하세요!
> ❌ 회원이 되다 — 프리미엄 기능
> ❌ 회원이 되십시오.
> ✅ 회원되기

> ❌ 하이라이트가 성공적으로 저장되었습니다!
> ✅ 보관했습니다.

> ❌ 로그인 하시겠어요?
> ❌ 로그인하세요
> ✅ 입장하기

> ❌ 앗! 오류가 발생했어요. 다시 시도해 주세요!
> ✅ 잠시 닿지 못했습니다. 다시 시도해 주십시오.

> ❌ 에세이를 둘러보세요. 마음에 드는 글을 저장하세요. 친구에게 공유하세요.
>   *(three eager commands, three different endings — tonal chaos)*
> ✅ 에세이 둘러보기. 마음에 드는 글 보관하기. 조용히 전하기.
>   *(unified `~기` block — invitational, coherent)*

> ❌ 오늘의 에세이를 읽어보세요. 작가님의 글은 매주 업데이트되어요.
>   *(mixed `~세요` + `~요` — cafe register)*
> ✅ 오늘의 에세이입니다. 필자의 글은 매주 새롭게 도착합니다.
>   *(unified `~니다` declarative block)*

---

## 4. Glossary (Canonical Terms)

**Rule of thumb:**
- **Proper-noun brand surfaces** stay in English (or are left in Latin script in Korean copy).
- **Role words** are Hangulized where an established Korean term is stronger (회원 over 패트런).
- **Verbs** are translated into their hospitality equivalent, not their tech equivalent.

### 4.1 Brand & surfaces

| English | Korean | Notes |
|---|---|---|
| The Hideaway | The Hideaway / 더 하이드어웨이 | Prefer Latin in headers and nav. Hangul in body prose where mixed-script feels wrong. Never translate the meaning. |
| Radio | Radio | Surface name — keep in English |
| Surf | Surf | Surface name — keep in English |
| Essays | Essays / 에세이 | "Essays" in nav and listings; "에세이" in Korean body copy |
| Playlists | Playlists / 플레이리스트 | Same rule as Essays |
| Albums | Albums / 앨범 | |
| Tracks | Tracks / 트랙 | |
| Series | Series / 시리즈 | |
| Compilations | Compilations / 편집선 | "편집선" (편집된 선집) carries a literary feel Hangulization misses |
| Shelf (library) | Shelf / 서가 | 서가 is the club-library word |
| The Vault (admin) | The Vault / 금고 | Internal only; patrons don't see this |

### 4.2 Role & membership words

| English | Korean | Notes |
|---|---|---|
| Patron | 회원 | **Do not** use 패트런 or 후원자. 회원 is the Seoul Club term and the right fit |
| Member | 회원 | |
| Patrons-only / Members-only | 회원 전용 | |
| Editor | 에디터 | |
| Author | 필자 / 저자 | 필자 in editorial bylines; 저자 in metadata |
| Admin | 관리자 | Staff-facing only |
| Concierge | 콘시어지 | If ever surfaced as a role |
| Guest (non-member viewer) | 방문객 | Never 게스트 in member-facing copy |

### 4.3 Core verbs

> Two Korean columns: **CTA / label (`~기`)** for buttons, menu items, and invitations; **declarative copy (`~니다`)** for statements, confirmations, and body prose referring to the same action. Never introduce a new form outside these two without a reason that fits §3.5.

| English | CTA / label (`~기`) | Declarative copy (`~니다`) | Don't use |
|---|---|---|---|
| Check in | **입장하기** | 입장하실 수 있습니다 | ❌ 로그인, ❌ 체크인, ❌ 입장하세요 |
| Step out (sign out) | **나가기** | 나가셨습니다 / 퇴장하셨습니다 | ❌ 로그아웃, ❌ 나가세요 |
| Join / Request membership | **입회하기** / 입회 신청하기 | 입회하실 수 있습니다 | ❌ 회원가입하세요, ❌ 등록, ❌ 가입 |
| Close membership | **회원 해지하기** | 회원 자격을 해지하실 수 있습니다 | ❌ 계정 삭제, ❌ 탈퇴하세요 |
| Become a patron | **회원되기** | 회원으로 합류하실 수 있습니다 | ❌ 회원이 되세요, ❌ 회원이 되다, ❌ 회원이 되십시오, ❌ 구독하기 |
| Keep (save / bookmark) | **보관하기** | 보관했습니다 / 보관해 두었습니다 | ❌ 저장하세요 (patron surfaces), ❌ 북마크 |
| Pass along (share, editorial) | **전하기** | 전했습니다 | ❌ 공유하세요 |
| Share (utilitarian) | **공유하기** | 공유되었습니다 | |
| Highlight (verb) | **밑줄 긋기** | 밑줄을 그으셨습니다 | ❌ 하이라이트 하기, ❌ 밑줄 그으세요 |
| Highlight (noun) | **밑줄** | — | ❌ 하이라이트 for patron copy (acceptable only in dense UI where 밑줄 is ambiguous) |
| Memo (on a highlight) | **메모 남기기** | 메모를 남기셨습니다 | |
| Annotate / note | **주석 달기** / 메모 남기기 | | |
| Follow | **팔로우하기** | 팔로우 중입니다 | ❌ 팔로우하세요, ❌ 구독하기 |
| Unfollow | **팔로우 해제하기** | | |
| Explore / Browse (invitation) | **둘러보기** | 둘러보실 수 있습니다 | ❌ 둘러보세요 (eager) |
| Try (invitation) | **들어보기** / 읽어보기 / 써보기 | 이용해 보실 수 있습니다 | ❌ 시도해 보세요 (eager) |
| Welcome in | **어서 오십시오** (classical set phrase) | — | ❌ 환영합니다 (flat), ❌ 어서 오세요 (café register) |
| One moment | — | **잠시만 기다려 주십시오** | ❌ 잠시만요, ❌ 잠시만 기다려 주세요 |

### 4.3.1 The "no commanding suggestion" rule

Anything the patron is invited to do — but is free to ignore — takes the `~기` column. Anything the system asserts or confirms takes the `~니다` column. The `~십시오` column from §3.5 is not represented here because it is reserved for the narrow set of direct requests already covered in §4.4 (error recovery, required-step instructions).

### 4.4 Errors, empty states, toasts

| English | Korean |
|---|---|
| That didn't land. | 잠시 닿지 못했습니다. |
| We couldn't reach that. | 지금은 연결이 어렵습니다. |
| Try once more. | 다시 시도해 주십시오. |
| Kept. | 보관했습니다. |
| Sent. | 전했습니다. |
| Published. | 발행했습니다. |
| Nothing here yet. | 아직 비어 있습니다. |
| Only patrons may view this. | 회원 전용입니다. |

### 4.5 Commerce

| English | Korean | Notes |
|---|---|---|
| Plan | 플랜 / 회원권 | Prefer 회원권 (club membership) in patron copy; 플랜 acceptable in admin / billing tables |
| Invoice | 인보이스 / 청구서 | 청구서 in Korean-primary surfaces |
| Receipt | 영수증 | |
| Refund | 환불 | |
| Coupon | 쿠폰 | |
| Subscription (billing mechanism) | 정기 결제 | Distinct from 구독 (content) |

---

## 5. Translator's Working Procedure

When adding a new English string:

1. Write the English against §2.
2. Check the glossary (§4) for every noun and verb in the string.
3. Draft Korean in 합니다체, softened.
4. Run the three checks (§3.4).
5. Read the Korean out loud. If it sounds like a notification from a delivery app, rewrite.
6. Add both to the matching `messages/{en,ko}/*.json` file under the same key path.
7. Never ship a Korean string identical to the English one (the parity script will flag this as untranslated — if the English **is** the intended Korean value, mark with a `_locked` sibling key documenting why).

### 5.1 When in doubt

- **Keep English** if Hangulizing the term would read as cheap or generic.
- **Translate** if an established Korean hospitality term is stronger than a loanword.
- **Ask the editor** (project owner) before inventing a term — glossary entries are locked, not drafted live.

---

## 6. Governance

- **This document is the source of truth.** PRs that introduce new strings must either use an existing glossary entry or propose a glossary addition in the same PR.
- **The glossary (§4) is versioned.** Changes to an entry require updating every existing string that used the prior term.
- **Parity is enforced in CI** via `scripts/i18n-parity.ts` (see §7 when implemented).
- **Tone drift is a bug.** File it as one.

---

## 7. Related Files (to be created alongside this doc)

- `messages/en/*.json`, `messages/ko/*.json` — split per surface (common, auth, highlightr, radio, brand, legal, etc.)
- `scripts/i18n-parity.ts` — key-tree diff, ICU placeholder check, identical-value check
- `scripts/i18n-audit.ts` — one-off grep for hardcoded JSX text to migrate

---

*Last reviewed: 2026-04-23. Owner: project editor.*
