<!-- Generated: 2026-11-02 | Files scanned: 2221 | Token estimate: ~840 -->
# Frontend

App Router. `page.tsx` fetches; `page.client.tsx` renders. Pages wrap in `<RPage>`. Copy via `useTranslations` / `getTranslations` only.

## Page tree (public URLs)

```
/                          home
/essays  /essays/:slug  /essays/in/:page
/surf/:slug
/users  /users/:user  /users/:user/posts|profile
/lists/:username/:hashId
/tagged  /tagged/:slug
/archived/:slug
/radio  /radio/:slug  /radio/tapes/vol-001
/search
/plans  /the-team  /privacy  /terms  /refund
/day-n-night  /day-n-night/my  /guests  /claim/:token
/event-entry
/checkout  /checkout/success|return|canceled
/sign-in  /sign-up  /forgot-password  /reset-password  /two-factor
/me/settings/{profile,account,general,appearance,connected,highlights,notifications,security,subscriptions}
/me/inbox  /me/posts  /me/library/{saved,lists}  /me/onboarding  /me/account
/lostinseoul  /cart  /checkout  /products/:slug  /collections/:slug
/lostinseoul/fragrance  /gate  /orders/:ref  /payment/{pending,return,success,failure}
/lostinseoul/policy/:kind  /auth/sign-in
/vault                     Payload admin
(dev) /dev /lexy /ticks /dodo /invoice /coming-soon /dn-friends-torrent
```

Rewrites (`next.config.ts`): `/@:user/essays|surf|lists/:id` → internal; `/@:user/:path*` → `/users/:user/:path*`; `/me` → `/me/settings/profile`.

Permanent redirects: `/me/account` → settings/account; `/me/saved|lists` → `/me/library/*`; `/me/notifications` → `/me/inbox`; `/auth/*` → first-party auth screens.

## Shell

```
(frontend)/layout.tsx
  BetterAuthProvider, NextIntl, InitTheme, HideawayFM
  Header, RP_Menu, SearchSheet, SideDrawer, ContentMask, LivePreview
  Main → route page → RPage
```

Lost chrome: `src/lostinseoul/storefront.tsx`, `store-chrome.tsx`. Fragrance scene: `src/app/(frontend)/(site)/lostinseoul/fragrance/*`.

## Component layers

| Dir | Holds |
|---|---|
| `src/components/core` | Main, Logo, Button, Link, AnimatedFavicon |
| `src/components/Shells` | Header, Footer, Controlbar, ContentMask |
| `src/components/sections` | Home blocks: FeaturedHero, DayNNight, Pricing, StationHideaway |
| `src/components/content` | Radio, surf, archive-view |
| `src/components/UX` | Highlightr, TapePlayer, Settings, CommandKey, Tour, Ticket |
| `src/components/auth` | First-party auth screens |
| `src/components/ui` | Radix/shadcn primitives |
| `src/components/three` | R3F helpers |
| `src/blocks` | Payload layout blocks (Content, CTA, Image, Hero, FOTD) |
| `src/lostinseoul` | Storefront motion, cart frame, product panel |

## State

```
UI chrome          stores/RP_Ui.ts                 Zustand
device / cursor    stores/Device, stores/Cursor    Zustand
routing            stores/Routing/RP_Voyageur      Zustand
tour               stores/Tour/TourStore           Zustand
CMDK               stores/CMDK/SearchStore         Zustand
server cache       @tanstack/react-query           QueryProvider
session            providers/Session + useRPSession
theme              providers/Theme (next-themes)
radio playback     providers/HideawayFM            Howler
highlights         components/UX/Highlightr        Zustand + React Query
cart               src/lib/lost-commerce/useStoreCart.tsx
```

Motion: `import * as m from "motion/react-m"`. Transitions: `providers/TransitionProvider.tsx`.
