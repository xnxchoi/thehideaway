# Filled-in OAuth Approval Form

Source of truth for provider-console values. Copy from here, then confirm exact
callback URLs in `callbacks.md` after running `pnpm oauth:approval:report`.

## 1. Legal Entity

| Field                         | Value                                                      |
| ----------------------------- | ---------------------------------------------------------- |
| Legal entity name             | `Restored Projects`                                        |
| Business / contact address    | `Olympic-ro 4-gil 15, Songpa-gu, Seoul, Republic of Korea` |
| Privacy contact email         | `concierge@hideawayseoul.com`                              |
| Legal / terms contact email   | `concierge@hideawayseoul.com`                              |
| Minimum user age              | `16`                                                       |
| Hosting provider              | `ITEasy` / EasyCloud, Seoul                                |
| Data retention after deletion | `90 days`                                                  |
| Liability cap                 | Fees paid in the last 12 months                            |
| Governing jurisdiction        | Republic of Korea, venue Seoul                             |
| Effective date                | `2026-04-15`                                               |

Before submission, verify `/privacy`, `/terms`, and the footer render no draft
markers, dev URLs, or stale provider list.

## 2. Google OAuth Consent Screen

| Field                        | Value                                           |
| ---------------------------- | ----------------------------------------------- |
| App name                     | `The Hideaway`                                  |
| User support email           | `concierge@hideawayseoul.com`                   |
| Developer contact email      | `concierge@hideawayseoul.com`                   |
| Homepage URL                 | `https://hideawayseoul.com`                     |
| Privacy Policy URL           | `https://hideawayseoul.com/privacy`             |
| Terms of Service URL         | `https://hideawayseoul.com/terms`               |
| Authorized domain            | `hideawayseoul.com`                             |
| Application type             | Web application                                 |
| Authorized JavaScript origin | `https://hideawayseoul.com`                     |
| App logo                     | `public/android-chrome-512x512.png` if uploaded |

Scopes:

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

Redirect URIs: use the Google row in `callbacks.md` after running the approval
report. For Better Auth native social login, the expected production shape is:

```text
https://hideawayseoul.com/api/auth/callback/google
```

## 3. Naver Developer Console

| Field             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| App name, Korean  | `하이드어웨이`                                                |
| App name, English | `The Hideaway`                                                |
| Service URL       | `https://hideawayseoul.com`                                   |
| Screenshot        | `readmes/oauth-approval/screenshots/01-sign-in-page-prod.png` |

Service description:

```text
에디토리얼 에세이와 큐레이션 컬렉션을 제공하는 멤버십 기반 읽기 플랫폼입니다. 사용자는 글을 읽고, 하이라이트와 메모를 남기며, 자신만의 리스트를 구성할 수 있습니다.
```

Naver Login use case:

```text
회원가입 및 로그인을 간소화하기 위해 네이버 아이디로 로그인을 사용합니다. 사용자의 이메일과 이름만 수집합니다.
```

Permitted info:

- Email address
- Name

Redirect URI: use the Naver row in `callbacks.md`. For Better Auth generic OAuth,
the expected production shape is:

```text
https://hideawayseoul.com/api/auth/oauth2/callback/naver
```

## 4. Kakao Developer Console

| Field             | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| App name, Korean  | `하이드어웨이`                                                |
| App name, English | `The Hideaway`                                                |
| Site domain       | `https://hideawayseoul.com`                                   |
| Redirect URI      | Use the Kakao row in `callbacks.md`                           |
| Screenshot        | `readmes/oauth-approval/screenshots/01-sign-in-page-prod.png` |

Service description:

```text
에디토리얼 에세이와 큐레이션 컬렉션을 제공하는 멤버십 기반 읽기 플랫폼입니다. 사용자는 글을 읽고, 하이라이트와 메모를 남기며, 자신만의 리스트를 구성할 수 있습니다.
```

Kakao Login use case:

```text
회원가입 및 로그인을 간소화하기 위해 카카오 로그인을 사용합니다. 사용자의 이메일과 닉네임만 수집하며, 계정 생성과 로그인 식별 목적으로만 사용합니다.
```

Consent items:

- `account_email` — required, account identifier
- `profile_nickname` — required, display name

Do not request `profile_image`, phone number, birthday, gender, age range, or
shipping/address consent for this approval round.

Expected generic OAuth callback shape:

```text
https://hideawayseoul.com/api/auth/oauth2/callback/kakao
```

## 5. Production Env Vars

```env
NEXT_PUBLIC_SERVER_URL=https://hideawayseoul.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://hideawayseoul.com
COOKIE_DOMAIN=hideawayseoul.com

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

AUTH_NAVER_ID=...
AUTH_NAVER_SECRET=...

AUTH_KAKAO_ID=...
AUTH_KAKAO_SECRET=...
```

Provider secrets must only live in `.env`, `.env.production`, encrypted
production env storage, or the VPS runtime environment. Never commit real values.
