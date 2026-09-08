# OAuth Provider Guide

How to add and submit a new OAuth provider to The Hideaway.

---

## Adding a New Provider (Code)

### Step 1 — Server: `src/lib/auth/options.ts`

**Native provider** (Google, GitHub, etc. — check [better-auth docs](https://www.better-auth.com/docs/authentication/social-sign-on)):

```ts
socialProviders: {
  yourProvider: {
    clientId: process.env.YOUR_PROVIDER_CLIENT_ID!,
    clientSecret: process.env.YOUR_PROVIDER_CLIENT_SECRET!,
    mapProfileToUser: async (profile) => ({
      email: profile.email,
      name: profile.name,
      // ... map to Hideaway user fields
    })
  }
}
```

**Provider without a built-in helper** (use `genericOAuth`, which registers as a social provider in Better Auth 1.7):

```ts
import { genericOAuth } from "better-auth/plugins/generic-oauth";

genericOAuth({
  config: [
    {
      providerId: "yourprovider",
      clientId: process.env.YOUR_PROVIDER_CLIENT_ID!,
      clientSecret: process.env.YOUR_PROVIDER_CLIENT_SECRET!,
      authorizationUrl: "https://provider.com/oauth/authorize",
      tokenUrl: "https://provider.com/oauth/token",
      userInfoUrl: "https://api.provider.com/user",
      scopes: ["profile", "email"],
      mapProfileToUser: async (profile) => ({
        email: profile.email,
        name: profile.name
      })
    }
  ]
});
```

Sign-in is the same as a native provider: `authClient.signIn.social({ provider: "yourprovider" })`. Callback URL is `/api/auth/callback/yourprovider`.

Also add to `account.accountLinking.trustedProviders`:

```ts
trustedProviders: ["google", "email-password", "naver", "yourprovider"];
```

### Step 2 — Client: `src/lib/auth/client.ts`

For native providers: no client plugin needed, sign-in uses `authClient.signIn.social({ provider: "yourprovider" })`.

For every provider, including ones registered through `genericOAuth`, sign-in is `authClient.signIn.social({ provider: "yourprovider" })`. No extra client plugin.

### Step 3 — UI: `src/components/auth/icons.tsx`

Add the provider icon:

```tsx
export const YourProviderIcon: ProviderIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* SVG path */}
  </svg>
);
```

### Step 4 — UI: `src/lib/auth/providers.ts`

**Native provider** — `kind: "social"`:

```ts
{ id: "yourprovider", name: "Your Provider", icon: YourProviderIcon, kind: "social" }
```

Add the same provider to `AUTH_PROVIDERS` with `kind: "social"` (Better Auth 1.7 treats generic OAuth as a social provider):

```ts
{ id: "yourprovider", name: "Your Provider", icon: YourProviderIcon, kind: "social" }
```

### Step 5 — Environment variables

Add to `.env` and deployment secrets:

```env
YOUR_PROVIDER_CLIENT_ID=
YOUR_PROVIDER_CLIENT_SECRET=
```

---

## Provider App Registration Checklist

### URLs required for ALL providers

| Item                             | Value                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| **Google callback URL**        | `https://hideawayseoul.com/api/auth/callback/google`        |
| **Generic OAuth callback URL** | `https://hideawayseoul.com/api/auth/callback/{id}`   |
| **Homepage URL**               | `https://hideawayseoul.com`                                 |
| **Privacy Policy URL**         | `https://hideawayseoul.com/privacy`                         |
| **Terms of Service URL**       | `https://hideawayseoul.com/terms`                           |

---

## Google OAuth — Review Submission

**Developer Console:** https://console.cloud.google.com/

### Pre-submission checklist

- [ ] Homepage live and accessible
- [ ] Privacy Policy live at `/privacy` — covers: data collected, Google data usage, third-party services, user rights
- [ ] Terms of Service live at `/terms`
- [ ] App logo prepared (1:1 ratio, 512×512px recommended, PNG)
- [ ] OAuth consent screen filled in:
  - App name: `The Hideaway`
  - User support email
  - Developer contact email
  - Authorized domains: `hideawayseoul.com`
  - Privacy Policy URL: `https://hideawayseoul.com/privacy`
  - Terms of Service URL: `https://hideawayseoul.com/terms`
  - Logo uploaded
- [ ] Scopes justified (we use: `openid`, `profile`, `email` — all non-sensitive)
- [ ] Test users added for internal testing
- [ ] OAuth callback URL registered: `https://hideawayseoul.com/api/auth/callback/google`

### Scopes used

| Scope     | Data received         | Why we need it                                 |
| --------- | --------------------- | ---------------------------------------------- |
| `openid`  | User's Google ID      | To uniquely identify the user                  |
| `profile` | Name, profile picture | To populate the user's display name and avatar |
| `email`   | Email address         | Primary account identifier                     |

### Review timeline

Google's verification process typically takes **3–5 business days** for apps requesting only basic scopes. Apps requesting sensitive or restricted scopes require additional review (weeks).

---

## Naver OAuth (네이버 로그인)

**Developer Console:** https://developers.naver.com/apps/

### Pre-submission checklist

- [ ] Naver developer account created
- [ ] Application registered with service type: `Web`
- [ ] Callback URL registered: `https://hideawayseoul.com/api/auth/callback/naver`
- [ ] Required permissions requested: `회원이름(name)`, `이메일 주소(email)`
- [ ] Service description (Korean required): 회원가입 및 간편 로그인
- [ ] Icon/logo uploaded
- [ ] Privacy policy URL registered: `https://hideawayseoul.com/privacy`

### Env vars

```env
AUTH_NAVER_ID=     # "Client ID" from Naver developer console
AUTH_NAVER_SECRET= # "Client Secret" from Naver developer console
```

### Notes

- Naver login is currently in development mode — only registered test accounts can sign in
- To publish for all users, submit for service review (검수 신청) in the Naver developer console
- Review typically takes **3–7 business days**

---

## Kakao OAuth (카카오 로그인)

**Developer Console:** https://developers.kakao.com/

Kakao is a built-in Better Auth social provider.

### Implementation notes

- Configure under `socialProviders.kakao` in `options.ts`
- Keep `disableDefaultScope: true` and `scope: ["profile_nickname", "account_email"]` so we do not request `profile_image`
- User info response path: `profile.kakao_account.profile`, `profile.kakao_account.email`
- Required env vars: `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`
- Production callback shape: `https://hideawayseoul.com/api/auth/callback/kakao`

### Approval notes

- Request only `account_email` and `profile_nickname`.
- Use `readmes/oauth-approval/03-kakao-console.md` for console submission copy.
- Generate the exact callback URL and screenshots with
  `BASE_URL=https://hideawayseoul.com pnpm oauth:approval:report`.

---

## Adding a Future Provider — Quick Reference

1. Register app at provider's developer portal, get `CLIENT_ID` and `CLIENT_SECRET`
2. Register callback URL: native providers use `/api/auth/callback/<providerId>`;
   generic OAuth providers now also use `/api/auth/callback/<providerId>`
3. Add env vars to `.env` and deployment
4. Add to `options.ts` (`socialProviders` when Better Auth has a built-in helper; otherwise `genericOAuth`, which still signs in through `signIn.social`)
5. Add icon to `src/components/auth/icons.tsx`
6. Add to `src/lib/auth/providers.ts` with `kind: "social"`
7. If needed, add to `account.accountLinking.trustedProviders` in `options.ts`
8. Submit for provider's app verification per their checklist above
