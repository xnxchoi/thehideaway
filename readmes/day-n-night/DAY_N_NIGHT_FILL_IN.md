# Day n Night — Fill-in sheet

> **For Sean to fill in.** Replace every `___` (and adjust any `<confirm>`
> values that are wrong). When done, hand the file back — the next session
> will transcribe it into `src/components/sections/DayNNight/survivalKit.config.ts`
> and the assorted asset paths. Don't worry about formatting; just type
> values next to the prompts.
>
> Anything already filled in is what I've inferred from prior sessions —
> tweak or confirm.

---

## 0. Hosts — locked at TWO (Choi & Choe)

Per § 2.1 of the handoff. Two people, both surnamed 최 in Hangul, distinguished
only by romanisation.

### Host 1 — Choi

- **Display name (EN):** `Sean Choi` <confirm>
- **Display name (KR):** `최성윤` <fill: 한글 이름>
- **Slug for the config:** `sean`
- **Phone (E.164, +82-…):** `+82 10 4637 9289`
- **KakaoTalk ID** (the @-handle people use to find you in Kakao): `SungyoonChoi`
- **Email:** `seanschoi@lostinseoul.com` <e.g. `concierge@hideawayseoul.com` or personal>
- **Portrait image:** `public/assets/day-n-night/hosts/sean.png` <to-supply, 512×512 JPEG q80; placeholder OK first 
  ship>

### Host 2 — Choe

- **Display name (EN):** `In Gyu Choe` <Nathan? Inju? Other?>
- **Display name (KR):** `최인규` <fill: 한글 이름>
- **Slug for the config:** `ingyu` <e.g. `nathan` / `inju` — kebab-case, used in config keys + URL fragments>
- **Phone (E.164, +82-…):** ''
- **KakaoTalk ID:** `___`
- **Email:** `___`
- **Portrait image:** `public/assets/day-n-night/hosts/ingyu.jpeg`
---

## 1. Venue

- **Address (EN, romanised):** `Sowol-ro 20-gil 64, 3F` <confirm>
- **Address (KR, 도로명주소):** `소월로20길 64, 3층` <confirm>
- **Neighbourhood label:** `Haebangchon · Yongsan` / `해방촌 · 용산` <confirm>
- **Coordinates (for the map embed):**
  - Latitude: `37.543933`
  - Longitude: `126.984232`
- **Kakao Map search string** — what someone types into the Kakao Map search box to land on this place: `_https://kko.to/0WZOd709uh_`
  *(Open Kakao Map, search for the venue, copy what you typed.)*
- **Naver Map URL (ID)** — same idea for Naver: `https://naver.me/GFB9v8Ug`
- **Google Maps Place ID or URL** — copy the URL after searching the venue in Google Maps: `https://maps.app.goo.gl/yvEE24K8PyiffftV8`
  *(Looks like `https://maps.app.goo.gl/XXXXX` or a long `/maps/place/...` URL.)*

---

## 2. Payment

- **Bank name:** `Toss Bank` <confirm>
- **Bank label for the Toss deep link (한글):** `토스뱅크` <confirm — must be Korean label, not code, not English>
- **Account number:** `1002-5436-0906` <confirm>
- **Account number, digits only (for the deep link):** `100254360906`<confirm>
- **Account holder (KR):** `리스토어드프로젝트` <confirm>
- **Amount per ticket (KRW):** `61000` <confirm>
- **Memo / 보내는 분 표시** (optional — what the host wants to see in the transfer line, e.g. `"DNN-" + guest_name`): `___`

The Toss deep link will resolve to (template, filled with above values):
```
supertoss://send?bank={한글 bank label}&accountNo={digits-only}&amount={krw}&origin=qr
```

Non-Toss users see a **copy-to-clipboard block** instead — confirmed via
research as the universal pattern (see handoff § 2.7.5).

---

## 3. Audio assets — Liminal handoff (§ 2.9)

- **Country track (Daytime):** `public/audio/day-n-night/daytime.opus` — already in repo? <confirm path + that it's the right cut>
- **House track (Sunset, fires at Liminal click):** `public/track_media/Track_3.mp3` <confirmed>
- **Hiphop/house track (Nighttime):** `public/audio/day-n-night/nighttime.opus` — already in repo? <confirm>
- **Cassette click SFX (≤200ms, mechanical):** `public/audio/day-n-night/cassette-click.<mp3|opus>` <to-supply>
  *(A real cassette button-press recording, or a synth approximation. Master to sit just under the house track's incoming level so it punches without clipping.)*

---

## 4. Subtitle copy — Liminal (§ 2.9 cue cards)

These are the two cinematic subtitle strings. Both English (KO mirrors per § 2.1).

- **Sunset cue (held ~4s):** `The sun is setting.` <confirm / replace>
- **Change-of-pace cue (morphs in at the cassette press):** `Time for a change of pace.` <confirm / replace>

If either reads off-voice once you see it staged, replace here. They're allowed to be different beats — *"And the room turns."* / *"Press play."* / etc. — your call.

---

## 5. YM.FM credit (§ 2.2) — already locked, just confirm

- **Display name:** `YM.FM` ✓ locked
- **Role line:** `Barber. Musician. Great Dude.` ✓ locked
- **Blurb:** `A dear friend, GOAT barber, and most importantly — a killer DJ.` ✓ locked
- **Handle:** `@yangminwoo` → `https://instagram.com/yangminwoo` ✓ locked
- **Eyebrow:** `On the decks` ✓ locked
- **Polaroid set for the scatter (§ 2.4):** 5–8 candid photos. Placeholders OK first ship. When real arrives, drop into `public/assets/day-n-night/ym/ym-01..08.jpg`. <to-supply>

---

## 6. Liminal friends-torrent photos (§ 3.8)

Past-event photos for the gliding multi-z-depth section. Curate ~12–20 images
that read well at small sizes and don't require captions.

- **Drop location:** `public/assets/day-n-night/past-events/`
- **Curated set:** <to-supply>
- **Soft-sell caption** (one short line, typewriter-style cursor will render it): `___` <e.g. "Some of you we've missed. Some of you we haven't met yet.">

---

## 7. Closing wordmark — footer.hosts

Currently placeholder. Lock per § 2.1.

- **EN value:** `Choi & Choe` <confirm>
  *(or — if you want to fold "× Day n Night" or similar into the byline, write it here)*
- **KO value:** mirrors EN per § 2.1 → `Choi & Choe`

---

## 8. Sensitive-data decision — locked

Per § 2.7.6 + Sean's "just post them. I have mine displayed on the site footer
anyway." → **the config is committed**. Phone numbers, KakaoTalk IDs, and
emails land in the repo as plain TypeScript values. No `.env.local` shim.

---

## How to hand back

When you're done filling in, either:

- Save and tell the next session "fill-in sheet is ready" → they'll
  transcribe into `survivalKit.config.ts` and stage the assets.
- Or — quickest — paste the filled values back into the chat and the
  session will do the transcription live.

If you can't fill a row, leave it as `___` and we ship the rest. Most
fields have placeholder paths that work even when the asset isn't there
yet (button shows the value but produces a no-op deep link until the real
URL is wired).
