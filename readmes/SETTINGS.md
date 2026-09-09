# Settings and user shell

Member account surfaces: `/me/settings/*`, plus the three convenience lanes
(UserDropdown, SideDrawer, ⌘K). Visual grammar is the Fey method in
`.claude/skills/admin-fey-surfaces/SKILL.md`. Copy follows `VOICE.md`.

`/vault` is a different shell. Do not restyle Payload list/edit as settings
panels. → `VAULT.md`.

---

## Settings (`/me/settings`)

Axis-based sections, not feature piles:

| Section | Holds |
|---|---|
| General | Language, theme, motion (OS mirror) |
| Profile | Public face — name, bio, location, link |
| Account | Handle, sign-in email, password, billing |
| Security | 2FA, sessions, OAuth, passkeys, account closure |
| Notifications | What we send |

Retired routes (redirects): `/connected` → `/security`, `/appearance` →
`/general`, `/subscriptions` → `/account`, `/highlights` → `/me/settings`.

**Desktop (xl+):** persistent rail + pane. Rail highlight moves on click via
`pendingHref`. The outgoing pane stays mounted until fade-out finishes, then
the incoming section fades in. In-settings navigation uses the `SHELL`
transition (no RPage snap, no scroll-to-top). Vertical padding
(`14rem` / `18rem`) keeps first and last items out of the FXFrame frost.

**Mobile:** hub is the index; sub-routes show `← Settings` (xl:hidden).

Root font-size is 62.5% (1rem = 10px). Do not treat Tailwind `pt-32` as 128px.

### File map

- Layout: `src/app/(frontend)/(site)/(auth)/me/settings/layout.tsx`
- Rail / pane / nav: `src/components/UX/Settings/SettingsRail.tsx`,
  `SettingsPane.tsx`, `SettingsNav.tsx`
- Panels and fields: `Panel.tsx`, `fields/`
- Places: `_helpers/searchPlaces.ts` + `/api/places/search`
- Copy: `messages/{en,ko}.json` → `Settings.*`. `sections.ts` is slugs only.

Do not hoist `RPage` to the settings layout. `SHELL` + `SettingsPane` is the
in-shell handoff.

---

## Convenience lanes

| Surface | Role |
|---|---|
| UserDropdown | Identity and ownership — profile, library, posts, tickets, settings, sign out |
| SideDrawer (⌘B) | Site nav + radio. Not search, not saved. |
| SearchBar (⌘K) | Find or do — content search, jump commands, recents, quick actions |

`/me/posts` is an editorial index that deeplinks to `/vault` for edit/new. It
is not a Fey settings surface.

---

## Open on this scope

1. Controlbar should own the settings back-link (`SubRouteHeader` is xl:hidden
   already; persistent chrome is still queued).
2. ⌘K context-aware suggestions (signed-in, current route).
3. `/me/posts` table-grade controls (filters, bulk actions, sort, pagination).
   Visual revisit after the interaction model.
4. SideDrawer theme + locale toggles.
5. Membership Plaque/PLATE on settings — not started; Profile works without it.
