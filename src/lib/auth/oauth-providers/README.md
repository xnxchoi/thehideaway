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

**Non-native provider** (Naver, Kakao, etc. — use `genericOAuth`):

```ts
// Already imported: import { genericOAuth } from "better-auth/plugins/generic-oauth"
// Add to betterAuthPlugins array alongside existing genericOAuth config:
genericOAuth({
  config: [
    // existing naver config...
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
        // ...
      })
    }
  ]
});
```

Also add to `account.accountLinking.trustedProviders`:

```ts
trustedProviders: ["google", "email-password", "naver", "yourprovider"];
```

### Step 2 — Client: `src/lib/auth/client.ts`

For native providers: no client plugin needed, sign-in uses `authClient.signIn.social({ provider: "yourprovider" })`.

For genericOAuth providers: already included via `genericOAuthClient()` — no additional changes needed.

### Step 3 — UI: `src/lib/auth/betterauth-ui/src/components/provider-icons.tsx`

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

### Step 4 — UI: `src/app/(frontend)/(site)/(auth)/authProviders.tsx`

**Native provider** — add to `social.providers`:

```tsx
social={{ providers: ["google", "yourprovider"] }}
```

**genericOAuth provider** — add to `genericOAuth.providers`:

```tsx
genericOAuth={{
  providers: [
    { provider: "naver", name: "Naver", icon: NaverIcon },
    { provider: "yourprovider", name: "Your Provider", icon: YourProviderIcon }
  ]
}}
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
| **Generic OAuth callback URL** | `https://hideawayseoul.com/api/auth/oauth2/callback/{id}`   |
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
- [ ] Callback URL registered: `https://hideawayseoul.com/api/auth/oauth2/callback/naver`
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

Kakao is integrated as a Better Auth generic OAuth provider.

### Implementation notes

- Use `genericOAuth` (Kakao is not a native better-auth provider)
- Authorization URL: `https://kauth.kakao.com/oauth/authorize`
- Token URL: `https://kauth.kakao.com/oauth/token`
- User info URL: `https://kapi.kakao.com/v2/user/me`
- Scopes: `profile_nickname`, `account_email`
- User info response path: `profile.kakao_account.profile`, `profile.kakao_account.email`
- Required env vars: `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`
- Production callback shape: `https://hideawayseoul.com/api/auth/oauth2/callback/kakao`

### Approval notes

- Request only `account_email` and `profile_nickname`.
- Use `readmes/oauth-approval/03-kakao-console.md` for console submission copy.
- Generate the exact callback URL and screenshots with
  `BASE_URL=https://hideawayseoul.com pnpm oauth:approval:report`.

---

## Adding a Future Provider — Quick Reference

1. Register app at provider's developer portal, get `CLIENT_ID` and `CLIENT_SECRET`
2. Register callback URL: native providers use `/api/auth/callback/<providerId>`;
   generic OAuth providers use `/api/auth/oauth2/callback/<providerId>`
3. Add env vars to `.env` and deployment
4. Add to `options.ts` (native via `socialProviders` or generic via `genericOAuth`)
5. Add icon to `provider-icons.tsx`
6. Add to `authProviders.tsx` (`social.providers` or `genericOAuth.providers`)
7. If needed, add to `account.accountLinking.trustedProviders` in `options.ts`
8. Submit for provider's app verification per their checklist above
