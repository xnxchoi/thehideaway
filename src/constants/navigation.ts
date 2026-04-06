import type { PayloadLinkProps } from "@/components/core/Link/types";

export type NavLink = PayloadLinkProps<"custom"> & { url: string; label: string };

const link = (href: string, label: string): NavLink => ({
  type: "custom",
  url: href,
  newTab: false,
  label
});

/**
 * RPMenu — full-screen overlay navigation.
 * Primary site destinations for discovery and orientation.
 */
export const MENU_LINKS: NavLink[] = [
  link("/", "Reception"),
  link("/essays", "Essays"),
  link("/radio", "Radio"),
  link("/search", "Search"),
  link("/plans", "Membership"),
  link("/the-team", "The Team")
];

/**
 * SideDrawer — sidebar/bottom-sheet shortcuts.
 * Quick access for returning users. Radio player is integrated separately.
 */
export const SIDE_DRAWER_LINKS: NavLink[] = [
  link("/essays", "Latest"),
  link("/users", "Directory"),
  link("/search", "Search"),
  link("/me/saved", "Saved")
];

/**
 * Dev-only links appended to RPMenu in development.
 */
export const DEV_LINKS: NavLink[] = [
  link("/dev", "DEV"),
  link("/dodo", "DoDo")
];
