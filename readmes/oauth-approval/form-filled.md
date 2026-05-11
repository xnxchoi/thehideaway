# Filled-in OAuth Approval Form

Source of truth for every value the consoles ask for. Everything here is
already wired into the code (`src/constants/business.ts` + `messages/*.json`)
and rendered on `/privacy` and `/terms` — but the consoles will ask you to
*re-enter* most of these by hand.

**Copy from here. Don't re-derive.**

---

## 1. Legal entity (rendered on `/privacy`, `/terms`)

| Field                              | Value                                                             |
|------------------------------------|-------------------------------------------------------------------|
| Legal entity name                  | `Restored Projects`                                               |
| Business / contact address         | `Olympic-ro 4-gil 15, Songpa-gu, Seoul, Republic of Korea`        |
| Privacy contact email              | `concierge@hideawayseoul.com`                                     |
| Legal / terms contact email        | `concierge@hideawayseoul.com`                                     |
| Minimum user age                   | `16` (EU GDPR default)                                            |
| Hosting provider                   | `ITEasy` (EasyCloud, Seoul)                                       |
| Data retention after deletion      | `90 days`                                                         |
| Liability cap                      | `Fees paid in the last 12 months`                                 |
| Governing jurisdiction             | `Republic of Korea` — venue: Seoul                                |
| Effective date                     | `2026-04-15`                                                      |

These are derived from `src/constants/business.ts` and overridable via
`NEXT_PUBLIC_BIZ_*` env vars — but production already uses these defaults, so
you don't need to override anything.

---

## 2. Google OAuth Consent Screen

| Field                       | Value                                                  |
|-----------------------------|--------------------------------------------------------|
| App name                    | `The Hideaway`                                         |
| User support email          | `hideawayseoul@gmail.com`                              |
| Developer contact email     | `hideawayseoul@gmail.com`                              |
| App logo                    | *not yet uploaded* — optional (recommended later)      |
| Homepage URL                | `https://hideawayseoul.com`                            |
| Privacy Policy URL          | `https://hideawayseoul.com/privacy`                    |
| Terms of Service URL        | `https://hideawayseoul.com/terms`                      |
| Application type            | `Web application`                                      |
| Authorized JavaScript origin| `https://hideawayseoul.com`                            |
| User type                   | `External` → `In production` (after verification)      |

### Scopes (non-sensitive only)

- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `openid`

No restricted scopes. No verification beyond domain ownership required.

### Authorized redirect URIs

```
https://hideawayseoul.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

---

## 3. Naver Developer Console

| Field                                    | Value                                                                                                                                                  |
|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| App name (Korean, required)              | `하이드어웨이`                                                                                                                                          |
| App name (English, optional)             | `The Hideaway`                                                                                                                                         |
| Service description (Korean, 1–2 sent.)  | `에디토리얼 에세이와 큐레이션 컬렉션을 제공하는 멤버십 기반 읽기 플랫폼입니다. 사용자는 글을 읽고, 하이라이트와 메모를 남기며, 자신만의 리스트를 구성할 수 있습니다.` |
| Naver login use-case (Korean)            | `회원가입 및 로그인을 간소화하기 위해 네이버 아이디로 로그인을 사용합니다. 사용자의 이메일과 이름만 수집합니다.`                                            |
| Screenshot of login flow                 | `screenshots/01-sign-in-page.png` (dev) → replace with prod capture before submitting                                                                    |
| Service URL                              | `https://hideawayseoul.com`                                                                                                                            |
| Callback URL (production)                | `https://hideawayseoul.com/api/auth/callback/naver`                                                                                                    |
| Callback URL (development)               | `http://localhost:3000/api/auth/callback/naver`                                                                                                        |

### Permitted info (the only fields we read)

- `email`
- `name` (display name)

Do not check `gender`, `birthday`, `mobile`, `profile_image`, or `nickname`
unless a future feature needs them. Asking for less = faster review and less
user drop-off on the consent screen.

---

## 4. Production env vars (must be set on the VPS)

```env
NEXT_PUBLIC_SERVER_URL=https://hideawayseoul.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://hideawayseoul.com
COOKIE_DOMAIN=hideawayseoul.com

GOOGLE_CLIENT_ID=…           # from Google Console → Credentials
GOOGLE_CLIENT_SECRET=…       # from Google Console → Credentials

AUTH_NAVER_ID=…              # from Naver Developers → 내 애플리케이션
AUTH_NAVER_SECRET=…          # from Naver Developers → 내 애플리케이션
```

The `BIZ_*` overrides are optional — defaults in `src/constants/business.ts`
already match the values in section 1.

---

## 5. Callback URLs (copy-paste-ready)

### Google Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs

```
https://hideawayseoul.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### Naver Developers → App Settings → Callback URL (서비스 URL)

```
Service URL:  https://hideawayseoul.com
Callback URL: https://hideawayseoul.com/api/auth/callback/naver
              http://localhost:3000/api/auth/callback/naver
```

> Naver allows multiple callback URLs separated by commas in some UIs, by
> newlines in others. If only one slot is shown, prioritize the production
> URL — localhost works because Naver allows all `localhost` callbacks by
> default for the registered app.
