# Voice & Translation Guide: Revised 2026-04-23

> The source-of-truth document for how The Hideaway speaks — in English, and in Korean.
> Read this before writing any user-facing text. Reference the glossary before translating any new string.

---

## 1. Brand Positioning (the why behind the voice)

The Hideaway is a **retreat from the hectic socialsphere** — a bridge between the private and the public. It borrows its
posture from boutique, high-end hospitality and exclusive members' clubs: Seoul Club, Aman, Rosewood, Soho House in its
quieter moments.

Patrons come here to:

- **convene** — not to broadcast
- **be read, not ranked**
- **step out of the feed**

The voice should feel like a concierge who knows you, a librarian who curates for you, and a quiet lounge where
conversation is unhurried. Never a tech product. Never a social network.

#### What the voice is NOT

| Not this                                                | Because                                           |
|---------------------------------------------------------|---------------------------------------------------|
| Playful startup tone ("Oops!", "Awesome!", "Let's go!") | Feels like a growth-hacking app                   |
| Cheerful exclamation marks                              | Breaks composure                                  |
| "Hey there!" / "Welcome back, friend!"                  | Over-familiar; wrong for a members' club          |
| Bureaucratic formality ("You must now proceed to…")     | Cold; also wrong                                  |
| Emoji in UI copy                                        | Never                                             |
| "Users" addressed as such                               | They are **patrons**, **members**, or **readers** |

### 1.1 The tonal target (new)

The Hideaway does not borrow from legacy grand-hotel language.
The closer reference point is younger, design-led luxury: culturally aware, self-possessed, slightly dry, never loud.

The voice should feel:

* composed, but not ceremonious
* warm, but not pampering
* witty, but not playful
* deferential, but not overly attentive

It is closer to a well-run private house, design hotel, or members’ club than to a traditional five-star hotel lobby.

The result should not feel like:

* a startup app
* a heritage luxury brochure
* a stiff institutional system
* an overly affectionate concierge

The aim is a narrower midpoint:
nonchalant restraint + dry warmth + professional polish

### 1.2 Functional priority over metaphor (new)

Not every line should be hospitality-coded.

When a message carries technical information, operational status, or a required next step, clarity takes priority over
metaphor. In these cases, use the most natural and precise Korean available.

Examples:

* network or server issues
* login or authentication issues
* payment failures
* permission restrictions
* required user actions
* legal or policy notices

In these contexts, do not force atmospheric substitutions where the literal wording is clearer.

This means:

* 연결이 어렵습니다 may be better than 잠시 닿지 못했습니다
* 로그인이 필요합니다 may be better than an over-stylized substitute
* 다시 시도해 주십시오 is often better than a more ornamental line

> Metaphor is a tonal instrument, not a rule.

---

## 2. English Voice — Core Rules

### 2.1 Register

- **Understated, composed, attentive.** The staff of a good club is present without hovering.
- **Never hype.** If something is new or premium, let hierarchy, typography, and whitespace say so — not the copy.
- **Short over long where short will do.** An editorial sentence earns its length; a button does not.

### 2.2 Punctuation & mechanics

- **No exclamation marks in UI.** None. Not even for success toasts. Editorial body may use one, sparingly, for a quoted
  voice.
- **Em dash (—) preferred over semicolons** in editorial copy; hyphens (-) only for compound words.
- **Sentence case** for headlines and buttons. Title case only for proper nouns and the product name itself.
- **No trailing periods on UI microcopy** (button labels, menu items, eyebrows, badges). Editorial sentences keep their
  periods.
- **Numerals over words** in UI (`3 essays`, not `three essays`); words in editorial prose when natural.
- **Oxford comma**, always.
- **Curly quotes** (" " ' ') in editorial copy; straight quotes acceptable in code-facing strings where the renderer
  handles it.

### 2.3 The verb set (hospitality over tech)

| Instead of                   | Use                                                                          |
|------------------------------|------------------------------------------------------------------------------|
| Sign in                      | **Check in**                                                                 |
| Sign up / Register           | **Request membership** (onboarding) / **Join** (short form)                  |
| Sign out / Log out           | **Step out**                                                                 |
| Delete account               | **Close membership**                                                         |
| Subscribe                    | **Become a patron**                                                          |
| Save / Bookmark              | **Keep**                                                                     |
| Share                        | **Pass along** (when editorial); **Share** (when necessary)                  |
| Submit                       | **Send** or the specific verb (**Publish**, **Post**)                        |
| Upload                       | **Add**                                                                      |
| Try again                    | **Try once more**                                                            |
| Error / Something went wrong | **That didn't land.** / **We couldn't reach that.**                          |
| Loading…                     | no copy — use the visual indicator alone; if copy is needed, **One moment.** |
| Welcome back!                | **Welcome in.** (on arrival) or **Good to see you.**                         |

### 2.4 Honorifics toward the patron

- Address the patron in second person singular ("you"), **never plural folksy** ("you all", "folks").
- Refer to their things with a possessive only when it is theirs ("your essays", "your shelf"). Never "our essays for
  you".
- When referring to staff action, prefer the passive or the institutional **"The Hideaway"**: *"The Hideaway keeps your
  reading private."* not *"We keep your reading private."* The "we" voice is reserved for the editor's letter and
  similar first-person surfaces.

### 2.5 A tone scale for reference

| Surface           | Tone                                                |
|-------------------|-----------------------------------------------------|
| Hero / brand copy | Editorial, literary, quietly confident              |
| Section headings  | Declarative, calm                                   |
| Button labels     | Verbs. Short. Sentence case, no period              |
| Empty states      | Considered; one line of poetry permitted            |
| Errors            | Unalarmed. Names the failure, offers the next step  |
| Success toasts    | A single word or short phrase. No exclamation       |
| Legal / policy    | Plain, precise, respectful. Not a law firm's voice  |
| Admin (`/vault`)  | Functional, terse — staff-facing, not patron-facing |

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

**Primary register: 합니다체** (격식체), consistent with the language of a premium members' club and of literary publications.
Seoul Club, Shilla, Four Seasons Seoul, 조선호텔 all use 합니다체 in member-facing copy.

But **flat 합니다체 reads as bureaucratic**. We soften it with **attentive auxiliaries and hospitality phrasing**:

| Cold 합니다체  | Warmed 합니다체 |
|------------|-------------|
| 저장되었습니다    | 보관해 두었습니다   |
| 로그인하세요     | 입장해 주십시오    |
| 오류가 발생했습니다 | 잠시 닿지 못했습니다 |
| 확인하세요      | 확인해 보시겠습니까  |

**Do not use 해요체** (해요/이에요) in product surfaces. It is warm, but it is the register of cafes and consumer apps — not of
a boutique club.

**Exception — legal & policy:** pure 합니다체, no softeners. Legal copy should read as clean, respectful, and precise (조선호텔
회원약관 tone), not ornamental.

**Exception — editorial body (essays, Surf):** writer's voice wins. The register follows the author. Our guide is only
for UI and framing copy around the content.

#### 3.1.2 Technical clarity rule (new)

Korean copy should be divided into two classes before tone is considered:

**A. Technical / operational copy**
Use direct, conventional Korean where precision matters.

Examples:

- 로그인이 필요합니다.
- 네트워크 연결이 어렵습니다.
- 결제를 완료하지 못했습니다.
- 접근 권한이 없습니다.

**B. Atmospheric / low-risk copy**
Where the meaning is simple and no critical action depends on terminological precision, the line may carry more tone.

Examples:

- 아직은 조용합니다.
- 천천히 둘러보셔도 좋습니다.
- 아직 완성된 글이 없습니다.

**Do not stylize class A as if it were class B.**

#### 3.1.3 The omission advantage (new)

English UI often uses subjectless, objectless fragments.
Korean benefits from this too, but for a different reason.

Using nominal or fragment forms:

* reduces forced honorific handling
* avoids awkward omitted-subject full sentences
* preserves calmness
* prevents over-addressing the user

This is one of the strongest reasons to prefer short nominal structures in Korean UI.

Examples:

* 에세이 둘러보기
* 저장해 두기
* 라디오 들어보기

These often read more naturally than full-sentence alternatives burdened by honorific structure.

### 3.2 Addressing the patron

- **회원님** for direct address when salutation is warranted (welcome surfaces, email opening, concierge moments).
- **Avoid 당신** — feels cold / confrontational in Korean.
- **Avoid 고객님** — too commercial, too retail.
- **No name-plus-씨** ("지민씨") in system copy. First-name direct address is earned, not defaulted.
- Use **the Hideaway itself** (더 하이드어웨이 / 하이드어웨이) as the subject for institutional statements, same as in English.

### 3.3 Punctuation & mechanics (Korean)

- **느낌표 금지** in UI — same rule as English.
- **물결표(~)와 이모티콘 금지** in product surfaces. They are casual markers and break register.
- **줄임표는 '…'** (U+2026), not `...`
- **가운뎃점(·)** for inline series in editorial; **쉼표(,)** in UI.
- **숫자는 아라비아 숫자** in UI; 편집 본문에서는 문맥에 따라 한글 숫자 허용.
- **띄어쓰기는 국립국어원 권장안** 기준. `더 하이드어웨이` (띄어쓰기 포함).

### 3.4 Tone-preserving translation — the three checks

Before committing a Korean string, read it against three questions:

1. **Would a Seoul Club attendant say this to a member?** If it sounds like a delivery app push notification, rewrite.
   The hospitality metaphor must survive: "Check in" is not 로그인; "Keep" is not 저장.
2. **Does it carry the English string's restraint?** If the English has one beat and the Korean has three, trim. If the
   English is quiet and the Korean is eager, the wrong suffix is doing it.
3. **Is the suffix register correct — and consistent with every other sentence in the same block?** See §3.5. `~기` for
   invitations, `~니다` for statements, `~십시오` for direct requests. Never `~세요` / `~해요`. Never mix within a block.

### 3.5 Suffix Grammar — The Three-Register Rule

Korean suffix choice is not cosmetic. A wrong ending turns a quiet club invitation into a growth-hacky push
notification, or a library into a DMV. We work with **three registers**, and within any one block (button, paragraph,
modal body, email, marketing section) only **one** register may appear.

**The failure mode to avoid above all:** translating an English bare imperative with no subject — *"Become a patron"*,
*"Give it a try"*, *"Discover essays"* — as a `~가 되다` / `~를 하다` / `~하세요` form. The English reads as a label or a soft
invitation; the naive Korean renders it as either a command (`회원이 되십시오`), an eager plea (`회원이 되세요`), or a dictionary
entry (`회원이 되다`). The result is the "all your base are belong to us" register — unmistakably machine-translated, tonally
broken. **Use the `~기` nominal form instead.**

#### 3.5.1 Register A — `~기` / `~보기` (nominal; labels, CTAs, invitations, suggestions)

The default register for anything the patron **may** choose to do but is not being **directed** to do. It reads as the
name of an action, not a command — closer to a printed menu item than a waiter's instruction.

Use for:

- Button labels: `보관하기`, `입장하기`, `밑줄 긋기`, `팔로우하기`
- Nav / menu items acting as verbs: `에세이 둘러보기`, `회원되기`
- Soft invitations and marketing CTAs: `조용히 둘러보기`, `라디오 들어보기`
- Any action framed as optional, explorable, or considered

##### 3.5.1.1 ~기 is useful, but not sacred (new)

The ~기 form remains the default for labels, invitations, and optional actions.
But it should not be applied so rigidly that the interface begins to sound machine-generated.

Use ~기 when it produces a natural and quiet label:

* 입장하기
* 둘러보기
* 들어보기

Do not force it when a more standard or cleaner form is better:

* 로그인 필요
* 접근 불가
* 저장 완료
* 회원 전용

A short fragment may sometimes outperform a grammatically purer ~기 form.

Respect should be carried by register and restraint, not by repeated forms of address

#### 3.5.2 Register B — `~니다` (declarative; status, confirmation, prohibition, authoritative statement)

Use when the system states a fact, confirms a completed action, issues a warning, or defines a boundary. `~니다` commands
full attention without eagerness — it is not asking the patron to do anything; it is telling them the shape of the
world.

Use for:

- Completed-action toasts: `보관했습니다.`, `전했습니다.`, `발행했습니다.`
- Errors as statements: `잠시 닿지 못했습니다.`, `지금은 연결이 어렵습니다.`
- Boundaries and prohibitions: `회원 전용입니다.`, `더 이상 변경할 수 없습니다.`
- Declarative brand copy: `더 하이드어웨이는 피드가 아닙니다.`

#### 3.5.3 Register C — `~십시오` (composed direct request; rare, reserved)

Use only when the system genuinely needs the patron to do a specific thing next (error recovery, required field, a
direct concierge moment). `~십시오` in 합니다체 is the composed equivalent of "please" — not eager, not casual.

Use for:

- Error-recovery instruction: `다시 시도해 주십시오.`
- Required next step: `이메일을 확인해 주십시오.`
- Classical hospitality set phrases: `어서 오십시오.`

### 3.6 Banned in product surfaces

- **`~세요`** — the café / consumer-app register. Reads as eager ("please do it!"), which is the voice we most want to
  avoid. No exceptions in UI, marketing, errors, or toasts. Acceptable only inside a first-person editor's letter as a
  deliberate stylistic choice.
- **`~해요` / `~이에요`** — 해요체, already excluded in §3.1.
- **`~가 되다` / `~를 하다` bare dictionary forms** — only valid in headings when the form is genuinely nominal (e.g., 사전식 용어)
  which is almost never the right call here.

#### 3.6.1 The consistency rule

Within any single coherent unit — a paragraph, a modal's full body, an email, a section of marketing copy — **the
register must not switch**. Korean sentence endings are visually prominent; switching from `~기` to `~니다` to `~십시오`
across three consecutive sentences reads as three different speakers.

This often means **restructuring the Korean from the English**. English can mix "Become a patron. Your reading stays
private. Try Radio." in one breath — declarative, invitational, imperative — and read fine. In Korean, you pick one
posture and reshape the block:

**All-`~기` (invitational block):**
> 회원되기. 조용히 읽기. 라디오 들어보기.

**All-`~니다` (declarative block):**
> 회원으로 합류하실 수 있습니다. 읽으시는 내용은 기록되지 않습니다. 라디오를 이용하실 수 있습니다.

Pick the register that matches the **dominant purpose** of the block, and rewrite every non-matching sentence into that
register. Do not preserve English sentence shapes at the cost of Korean cohesion.

#### 3.6.2 Avoid over-addressing the user (new)

Do not add 회원님, 고객님, or possessive framing unless the moment genuinely calls for direct address.

Avoid:

* 회원님의 공간에 저장해 두었습니다
* 회원님을 위해 준비했습니다
* 고객님의 선택을 기다립니다

Prefer:

* 저장되었습니다
* 준비되어 있습니다
* 선택하실 수 있습니다

### 3.7 Before/After (Korean)

These are the examples that most usefully show the tonal shift.

#### Errors

Current:
잠시 닿지 못했습니다. 다시 시도해 주십시오.

Revised directive:

* For technical connection failure: 연결이 어렵습니다. 다시 시도해 주십시오.
* For softer, non-critical disruption: 잠시 연결이 머뭇거립니다. 다시 시도해 주십시오.

Reason:
The current version is elegant, but too abstract as a default. Use it only when ambiguity is harmless. Literal terms
like 연결 are preferable when the user benefits from immediate recognition. This aligns with your own correction.

#### Empty states

Current:
아직 비어 있습니다.

Revised:

* neutral: 아직 비어 있습니다.
* preferred tonal version: 아직은 조용합니다.

Reason:
This is exactly the kind of simple, low-risk informational copy where tone can do more work without sacrificing clarity.

#### “Keep / Save”

Current guide:
보관하기 / 보관했습니다 / 보관해 두었습니다

Revised:

* default digital action: 저장하기
* confirmation: 저장되었습니다 or 저장해 두었습니다
* use 보관 selectively only where the object feels editorial, collectible, or archival

Reason:
Your pushback is right. 보관 is elegant, but can feel too physical or too curated if applied platform-wide. For many
digital actions, 저장 is cleaner and more natural. Keep 보관 as a selective brand word, not the universal default.

#### “Check in / Sign in”

Current guide:
입장하기

Revised:

* for brand-forward entry CTA: 입장하기
* for actual authentication context: 로그인 or 로그인하기
* for required auth message: 로그인이 필요합니다.

Reason:
This is one of the biggest changes. Forcing “check in” logic into every auth context will make the product feel
affected. When the user is performing an actual authentication task, standard Korean product language is better. The
metaphor can survive elsewhere.

#### “Become a patron”

Current guide strongly prefers:
회원되기

Revised:

* 회원 가입
* 멤버십 신청
* 입회 신청
  depending on context

Reason:
회원되기 is tonally distinctive, but also one of the most translation-shaped phrases in the document. It reads more
written-for-system than written-for-brand. If the surface is onboarding or access gating, 멤버십 신청 or 입회 신청 will usually
land better. If the flow is simple and product-like, 회원 가입 may be the most natural.

#### Unified block example

Current guide approves:
에세이 둘러보기. 마음에 드는 글 보관하기. 조용히 전하기.

Revised:
에세이 둘러보기. 마음에 드는 글은 저장해 두기. 필요하다면 전하기.

Reason:
Still restrained, still fragment-led, but less mannered. The shift is toward natural elegance, not literary insistence.

---

## 4. Glossary (Canonical Terms)

**Rule of thumb:**

- **Proper-noun brand surfaces** stay in English (or are left in Latin script in Korean copy).
- **Role words** are Hangulized where an established Korean term is stronger (회원 over 패트런).
- **Verbs** are translated into their hospitality equivalent, not their tech equivalent.

### 4.1 Brand & surfaces

| English           | Korean                  | Notes                                                                                                                                                                     |
|-------------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| The Hideaway      | The Hideaway / 더 하이드어웨이 | Keep the brand name untranslated. Prefer Latin in headers, nav, and logo-adjacent surfaces. Use `더 하이드어웨이` in Korean body copy where mixed script feels visually awkward. |
| Radio             | Radio                   | Surface name. Keep in English.                                                                                                                                            |
| Surf              | Surf                    | Surface name. Keep in English.                                                                                                                                            |
| Essays            | Essays / 에세이            | `Essays` in nav, listings, and surface labels. `에세이` in Korean body copy.                                                                                                 |
| Playlists         | Playlists / 플레이리스트      | Same rule as `Essays`.                                                                                                                                                    |
| Albums            | Albums / 앨범             | Keep `Albums` where other surface names remain English. Use `앨범` in Korean body copy.                                                                                     |
| Tracks            | Tracks / 트랙             | Same rule as above.                                                                                                                                                       |
| Series            | Series / 시리즈            | Same rule as above.                                                                                                                                                       |
| Compilations      | Compilations / 선집       | `편집선` is too coined. `선집` is cleaner, more literary, and more native.                                                                                                     |
| Shelf (library)   | Shelf / 서가              | `서가` works well when the library metaphor is foregrounded. Use selectively, not everywhere.                                                                               |
| The Vault (admin) | The Vault / Vault       | Internal/admin-facing only. Do not force `금고` unless there is a deliberate Korean-only internal surface.                                                                  |

### 4.2 Role & membership words

| English                     | Korean    | Notes                                                                                                                                       |
|-----------------------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------|
| Patron                      | 회원        | Correct default. `패트런` and `후원자` are both wrong for this use.                                                                               |
| Member                      | 회원        | Same as above. No need to distinguish in Korean.                                                                                            |
| Patrons-only / Members-only | 회원 전용     | Standard and correct.                                                                                                                       |
| Editor                      | 에디터       | Fine.                                                                                                                                       |
| Author                      | 필자 / 저자   | `필자` for editorial/byline contexts, `저자` for bibliographic or metadata contexts.                                                            |
| Admin                       | 관리자       | Staff-facing only.                                                                                                                          |
| Concierge                   | 콘시어지      | Use only if the role is explicitly surfaced as part of the brand experience.                                                                |
| Guest (non-member viewer)   | 방문자 / 방문객 | `방문자` is better for product/UI. `방문객` is slightly more formal and can work in brand copy. Avoid `게스트` in Korean member-facing product copy. |

### 4.3 Core verbs

> Two Korean columns: **recommended UI / CTA** and **recommended declarative / system copy**.  
> These are preferred defaults, not inviolable laws. Where the action is technical, standard Korean product language may
> be better than the hospitality metaphor.

| English                       | Recommended UI / CTA   | Recommended declarative / system copy | Avoid                                                                   |
|-------------------------------|------------------------|---------------------------------------|-------------------------------------------------------------------------|
| Check in                      | 입장하기 / 로그인             | 입장하실 수 있습니다 / 로그인이 필요합니다              | `체크인` as a product auth term                                            |
| Sign in / Log in              | 로그인 / 로그인하기            | 로그인이 필요합니다 / 로그인되었습니다                 | forcing `입장` into every auth context                                    |
| Step out / Sign out           | 나가기 / 로그아웃             | 로그아웃되었습니다                             | `퇴장하셨습니다` unless deliberately theatrical                                |
| Join / Request membership     | 멤버십 신청 / 입회 신청 / 회원 가입 | 멤버십을 신청하실 수 있습니다 / 회원 가입이 가능합니다       | `회원되기` as a universal default                                           |
| Close membership              | 회원 탈퇴 / 멤버십 해지         | 회원 탈퇴가 완료되었습니다 / 멤버십이 해지되었습니다         | `계정 삭제` if membership is the real concept; `회원 자격 해지` if too legalistic |
| Become a patron               | 멤버십 신청 / 회원 가입         | 회원으로 가입하실 수 있습니다                      | `회원이 되십시오`, `회원되기` as the only approved form                            |
| Keep (save / bookmark)        | 저장하기 / 저장              | 저장되었습니다 / 저장해 두었습니다                   | `보관하기` as the universal default                                         |
| Bookmark                      | 북마크 / 저장               | 북마크에 추가되었습니다 / 저장되었습니다                | banning `북마크` outright                                                  |
| Pass along (share, editorial) | 전하기 / 공유하기             | 공유되었습니다 / 전했습니다                       | forcing `전하기` in dense utilitarian UI                                   |
| Share (utilitarian)           | 공유하기                   | 공유되었습니다                               | over-stylizing standard share actions                                   |
| Highlight (verb)              | 밑줄 긋기 / 표시하기           | 밑줄이 저장되었습니다 / 표시되었습니다                 | `하이라이트 하기`                                                              |
| Highlight (noun)              | 밑줄 / 하이라이트             | —                                     | banning `하이라이트` in all contexts                                         |
| Memo (on a highlight)         | 메모 남기기                 | 메모가 저장되었습니다                           | —                                                                       |
| Annotate / note               | 메모 남기기 / 주석 달기         | 메모가 저장되었습니다 / 주석이 추가되었습니다             | —                                                                       |
| Follow                        | 팔로우 / 팔로우하기            | 팔로우 중입니다                              | `구독하기` unless the product really means subscription                     |
| Unfollow                      | 팔로우 해제                 | 팔로우가 해제되었습니다                          | —                                                                       |
| Explore / Browse              | 둘러보기                   | 둘러보실 수 있습니다                           | `둘러보세요` in eager consumer-app tone                                      |
| Try                           | 들어보기 / 읽어보기 / 써보기      | 이용하실 수 있습니다 / 지금 사용하실 수 있습니다          | `시도해 보세요` when it feels salesy                                          |
| Welcome in                    | 어서 오십시오 / 환영합니다        | —                                     | treating this as mandatory on every arrival surface                     |
| One moment                    | 잠시만 기다려 주십시오 / 잠시만요    | 잠시만 기다려 주십시오                          | banning all conventional waiting language in the name of tone           |

### 4.3.1 Revised rule

Anything optional, exploratory, or lightly invitational may use the shorter nominal / fragment form.  
Anything technical, stateful, or action-critical should use the clearest conventional Korean available.

Do not force one metaphorical register across all product surfaces.

### 4.4 Errors, empty states, toasts

| English                     | Korean                          | Notes                                                                                       |
|-----------------------------|---------------------------------|---------------------------------------------------------------------------------------------|
| That didn't land.           | 잠시 처리되지 않았습니다. / 잠시 연결이 머뭇거립니다. | Use the first for clearer system contexts; the second only where slight tone is acceptable. |
| We couldn't reach that.     | 지금은 연결이 어렵습니다.                  | Better default than the more abstract `닿지 못했습니다`.                                           |
| Try once more.              | 다시 시도해 주십시오.                    | Keep.                                                                                       |
| Saved. / Kept.              | 저장되었습니다. / 저장해 두었습니다.           | `보관했습니다` is too physical or archival as a universal toast.                                  |
| Sent.                       | 전송되었습니다 / 공유되었습니다 / 전했습니다       | Pick by action type. Do not overuse `전했습니다`.                                                |
| Published.                  | 게시되었습니다 / 발행되었습니다               | `발행` for editorial/publishing surfaces, `게시` for generic platform actions.                  |
| Nothing here yet.           | 아직 비어 있습니다. / 아직은 조용합니다.        | Second version is good where tone can breathe.                                              |
| Only patrons may view this. | 회원 전용입니다.                       | Keep.                                                                                       |
| Login required.             | 로그인이 필요합니다.                     | Add explicitly.                                                                             |
| Access denied.              | 접근 권한이 없습니다.                    | Add explicitly for technical/legal clarity.                                                 |

### 4.5 Commerce

| English                          | Korean            | Notes                                                                                 |
|----------------------------------|-------------------|---------------------------------------------------------------------------------------|
| Plan                             | 멤버십 / 이용권 / 플랜    | `회원권` feels too offline-club unless that is truly the business model. Use by context. |
| Invoice                          | 인보이스 / 청구서        | `청구서` for Korean-primary surfaces.                                                    |
| Receipt                          | 영수증               | Keep.                                                                                 |
| Refund                           | 환불                | Keep.                                                                                 |
| Coupon                           | 쿠폰                | Keep.                                                                                 |
| Subscription (billing mechanism) | 정기 결제 / 구독        | Use `정기 결제` when referring specifically to billing mechanics.                         |
| Membership fee                   | 멤버십 요금 / 가입비 / 회비 | Split by actual business meaning; do not flatten these into one term.                 |

---

## 5. Translator's Working Procedure

When adding a new English string:

1. Write the English against §2.
2. Check the glossary (§4) for every noun and verb in the string.
3. Draft Korean in 합니다체, softened.
4. Run the three checks (§3.4).
5. Read the Korean out loud. If it sounds like a notification from a delivery app, rewrite.
6. Add both to the matching `messages/{en,ko}/*.json` file under the same key path.
7. Never ship a Korean string identical to the English one (the parity script will flag this as untranslated — if the
   English **is** the intended Korean value, mark with a `_locked` sibling key documenting why).

### 5.1 Tone-routing test (new)

Before translating or writing a Korean string, classify it first:

1. Is this technical, procedural, legal, or action-critical?

* If yes, use conventional and literal Korean first.
* Tone comes second.

2. Is this simple, low-risk, atmospheric, or brand-framing?

* If yes, allow more texture, dryness, or slight tonal play.

3. Does the Korean sound like a translated concept rather than something a Korean brand would naturally publish?

* If yes, rewrite toward native idiom, even if it moves away from the English metaphor.

4. Is the line respectful without explicitly over-addressing the user?

* If no, remove unnecessary direct address.

#### 5.1.1 When in doubt

- **Keep English** if Hangulizing the term would read as cheap or generic.
- **Translate** if an established Korean hospitality term is stronger than a loanword.
- **Ask the editor** (project owner) before inventing a term — glossary entries are locked, not drafted live.

---

## 6. Governance

- **This document is the source of truth.** PRs that introduce new strings must either use an existing glossary entry or
  propose a glossary addition in the same PR.
- **The glossary (§4) is versioned.** Changes to an entry require updating every existing string that used the prior
  term.
- **Parity is enforced in CI** via `scripts/i18n-parity.ts` (see §7 when implemented).
- **Tone drift** is not only becoming too casual or too bureaucratic.

### 6.1 Tone drift also includes:

* over-literal metaphor porting
* excessive hospitality affectation
* unnecessary direct address
* replacing clear technical wording with vague atmospheric wording

> The Hideaway should feel designed, not translated.

---

## 7. Related Files (to be created alongside this doc)

- `messages/en/*.json`, `messages/ko/*.json` — split per surface (common, auth, highlightr, radio, brand, legal, etc.)
- `scripts/i18n-parity.ts` — key-tree diff, ICU placeholder check, identical-value check
- `scripts/i18n-audit.ts` — one-off grep for hardcoded JSX text to migrate

---

*Last reviewed: 2026-04-23. Owner: project editor.*
