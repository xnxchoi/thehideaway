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
 * SideDrawer — site navigation & ambient utility (⌘B).
 * "Where to go + what's playing." Site destinations only —
 * identity (saved, posts, settings) lives in UserDropdown,
 * search lives in ⌘K. Radio player is integrated separately.
 */
export const SIDE_DRAWER_LINKS: NavLink[] = [
  link("/", "Reception"),
  link("/essays", "Essays"),
  link("/surf", "Surf"),
  link("/radio", "Radio"),
  link("/users", "Directory"),
  link("/plans", "Membership"),
  link("/the-team", "The Team")
];

/**
 * Dev-only links appended to RPMenu in development.
 */
export const DEV_LINKS: NavLink[] = [
  link("/dev", "DEV"),
  link("/dodo", "DoDo")
];
