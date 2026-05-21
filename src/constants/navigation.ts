import type { PayloadLinkProps } from "@/components/core/Link/types";

export type NavLink = PayloadLinkProps<"custom"> & {
  url: string;
  label: string;
};

const link = (href: string, label: string): NavLink => ({
  type: "custom",
  url: href,
  newTab: false,
  label
});

// ─── TEMPORARY EVENT MODE ───────────────────────────────────────────────
// While the Day n Night event is the only surface we want guests pushed
// toward, the header / menu / sidedrawer nav collapses to event-only
// links. The full site nav lives below in commented-out form — swap the
// two blocks (move the comment markers) to restore site-wide nav after
// the event closes.

/**
 * RPMenu — full-screen overlay navigation. EVENT MODE: only the event
 * landing + reserve CTA.
 */
export const MENU_LINKS: NavLink[] = [
  link("/day-n-night", "Day & Night"),
  link("/tickets/day-n-night", "Reserve")
];

/**
 * SideDrawer — site navigation & ambient utility (⌘B). EVENT MODE: same
 * shape as the menu for consistency across surfaces.
 */
export const SIDE_DRAWER_LINKS: NavLink[] = [
  link("/day-n-night", "Day & Night"),
  link("/tickets/day-n-night", "Reserve")
];

/**
 * Dev-only links appended to RPMenu in development.
 */
export const DEV_LINKS: NavLink[] = [
  link("/dev", "DEV"),
  link("/dodo", "DoDo")
];

// ─── POST-EVENT SITE NAV (commented-out for restoration) ─────────────
// Restore by swapping these arrays for the EVENT-MODE ones above.
//
// export const MENU_LINKS: NavLink[] = [
//   link("/", "Reception"),
//   link("/essays", "Essays"),
//   link("/radio", "Radio"),
//   link("/search", "Search"),
//   link("/plans", "Membership"),
//   link("/the-team", "The Team")
// ];
//
// export const SIDE_DRAWER_LINKS: NavLink[] = [
//   link("/", "Reception"),
//   link("/essays", "Essays"),
//   link("/surf", "Surf"),
//   link("/radio", "Radio"),
//   link("/users", "Directory"),
//   link("/plans", "Membership"),
//   link("/the-team", "The Team")
// ];
