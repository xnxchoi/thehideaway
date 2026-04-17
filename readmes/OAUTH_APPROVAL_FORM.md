# OAuth Approval — Fill-in Form

Fill in the `[ ]` brackets below. Notes in _italics_ explain what each field should be.
Once complete, hand back to Claude and the legal pages + OAuth consoles will be updated.

---

## 1. Legal Entity Info (used in `/privacy` and `/terms`)

**Legal entity name:** `[Restored Projects]`
_Your registered business name, OR your full personal name if operating as a sole proprietor. This is the "we/us" in the legal docs._

**Business / contact address:** `[Olympic-ro 4-gil 15, Seoul]`
_Full address if you have a registered business. For a personal site, a city + country is acceptable (e.g. "Seoul, South Korea"). Google requires *some* address._

**Privacy contact email:** `[concierge@hideawayseoul.com]`
_Suggested: `privacy@hideawayseoul.com`. Must be a real inbox you monitor._

**Legal / terms contact email:** `[concierge@hideawayseoul.com]`
_Suggested: `legal@hideawayseoul.com`. Can be the same as privacy email._

**Minimum user age:** `[16]`
_Pick one: 13 (US COPPA minimum), 16 (EU GDPR default), or 18 (safest, avoids minor-related compliance). Most editorial platforms pick 16._

**Hosting provider:** `[ITEasy]`
_Where the servers run. E.g. "AWS", "Vercel", "DigitalOcean", "self-hosted VPS in Seoul". Required for the "third parties we share data with" section._

**Data retention after account deletion:** `[90]`
_How many days you keep backups/logs after a user deletes their account. Common values: 30 days, 60 days, 90 days._

**Liability cap amount:** `[Fees paid in the last 12 months]`
_Max dollar amount your liability is capped at in the Terms. Common values: USD $100, USD $500, or "fees paid in the last 12 months"._

**Governing jurisdiction:** `[Republic of Korea]`
_The country/state whose laws govern disputes. Suggested: "Republic of Korea". If you want to be sued only in Seoul, also specify "Seoul, South Korea" as the venue._

**Effective date:** `[2026-04-15]`
_Date the policies take effect. Can be today (2026-04-14) or a specific launch date._

---

## 2. Google OAuth Consent Screen (you fill in the Google Console)

**App name:** `[The Hideaway]`
_Suggested: `The Hideaway`. This is what users see on the Google sign-in prompt._

**User support email:** `[hideawayseoul@gmail.com]`
_Shown to users on the consent screen. Must be a real Google-associated email._

**Developer contact email:** `[hideawayseoul@gmail.com]`
_Google contacts you here about the app. Can be the same as support email._
**App logo:** `[ ]`
_Path or URL to a square PNG, minimum 120×120px, max 1MB. Google shows this on the consent screen. Skip if you don't have one yet — logo isn't required, but recommended._

**Homepage URL:** `https://hideawayseoul.com` _(pre-filled, confirm correct)_ yes

**Privacy Policy URL:** `https://hideawayseoul.com/privacy` _(pre-filled)_

**Terms of Service URL:** `https://hideawayseoul.com/terms` _(pre-filled)_

---

## 3. Naver Developer Console (you fill in the Naver console)

**App name (Korean, required):** `[하이드어웨이]`
_Naver requires a Korean-language name. Suggested: `하이어웨이` or `더 하이어웨이`._

**App name (English, optional):** `[ ]`
_Suggested: `The Hideaway`._->this

**Service description (Korean, 1–2 sentences):** `[에디토리얼 에세이와 큐레이션 컬렉션을 제공하는 멤버십 기반 읽기 플랫폼입니다. 사용자는 글을 읽고, 하이라이트와 메모를 남기며, 자신만의 리스트를 구성할 수 있습니다.]`
_Short description of what your service does, in Korean. Example: "에디토리얼 에세이 플랫폼. 사용자는 글을 읽고 하이라이트하며 컬렉션을 큐레이션합니다."_

**Naver login use-case description:** `[회원가입 및 로그인을 간소화하기 위해 네이버 아이디로 로그인을 사용합니다. 사용자의 이메일과 이름만 수집합니다.]`
_Explain why you need Naver login. Example: "회원가입 및 로그인을 간소화하기 위해 네이버 아이디로 로그인을 사용합니다. 사용자의 이메일과 이름만 수집합니다."_

**Screenshot of login flow:** `[ ]`
_Naver review requires a screenshot showing the Naver login button on your site. Take a screenshot of `/login` after deployment and save the path here._

---

## 4. Production Env Vars (confirm these are set on the server)

- [ ] `NEXT_PUBLIC_SERVER_URL=https://hideawayseoul.com`
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL=https://hideawayseoul.com`
- [ ] `COOKIE_DOMAIN=hideawayseoul.com`
- [ ] `GOOGLE_CLIENT_ID` (already set)
- [ ] `GOOGLE_CLIENT_SECRET` (already set)
- [ ] `AUTH_NAVER_ID` (already set)
- [ ] `AUTH_NAVER_SECRET` (already set)

---

## 5. Callback URLs to register (copy-paste into each console)

**Google Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs:**
```
https://hideawayseoul.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

**Naver Developers → App Settings → Callback URL (서비스 URL):**
```
Service URL:  https://hideawayseoul.com
Callback URL: https://hideawayseoul.com/api/auth/callback/naver
              http://localhost:3000/api/auth/callback/naver
```

---

## When done

Return this filled-in file to Claude. Claude will:
1. Replace all `[PLACEHOLDER: ...]` strings in `src/app/(frontend)/(site)/(pages)/privacy/page.tsx`
2. Replace all `[PLACEHOLDER: ...]` strings in `src/app/(frontend)/(site)/(pages)/terms/page.tsx`
3. Confirm the callback URLs and env vars match what's in the code
4. Give you a final pre-flight checklist before you hit "Publish" in each console
