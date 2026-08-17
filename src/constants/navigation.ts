import type { PayloadLinkProps } from "@/components/core/Link/types";

export type NavLink = PayloadLinkProps<"custom"> & {
  url: string;
  label: string;
  environment?: "all" | "dev";
};

const link = (
  href: string,
  label: string,
  environment: NavLink["environment"] = "all"
): NavLink => ({
  type: "custom",
  url: href,
  newTab: false,
  label,
  environment
});

export const MENU_LINKS: NavLink[] = [
  link("/", "Reception"),
  link("/essays", "Essays"),
  link("/radio", "Radio"),
  link("/search", "Search"),
  link("/plans", "Membership"),
  link("/the-team", "The Team")
];

export const SIDE_DRAWER_LINKS: NavLink[] = [
  link("/", "Reception"),
  link("/essays", "Essays"),
  link("/surf", "Surf"),
  link("/radio", "Radio"),
  link("/users", "Directory"),
  link("/plans", "Membership"),
  link("/the-team", "The Team")
];

export const DEV_LINKS: NavLink[] = [
  link("/dev", "DEV", "dev"),
];

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export function shouldShowDevNavigationLinks(hostname?: string): boolean {
  const runtimeHostname =
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : undefined);

  return runtimeHostname ? LOCAL_DEV_HOSTS.has(runtimeHostname) : false;
}

export function getMenuLinksForRuntime(hostname?: string): NavLink[] {
  return [
    ...MENU_LINKS,
    ...(shouldShowDevNavigationLinks(hostname) ? DEV_LINKS : [])
  ];
}

export const PROPS_COLLAPSIBLE = "Meta";