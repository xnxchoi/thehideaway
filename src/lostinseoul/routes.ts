import { lostInternalPath } from "@/lib/lostinseoul/domain";

export function isShopChromePath(pathname: string) {
  const path =
    lostInternalPath(pathname) ?? (pathname.replace(/\/$/, "") || "/");
  if (path === "/lostinseoul") return true;
  return [
    "/lostinseoul/collections",
    "/lostinseoul/products",
    "/lostinseoul/fragrance",
    "/lostinseoul/policy",
    "/lostinseoul/privacy",
    "/lostinseoul/terms",
    "/lostinseoul/refund"
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isEntryPath(pathname: string) {
  const path =
    lostInternalPath(pathname) ?? (pathname.replace(/\/$/, "") || "/");
  return (
    path === "/lostinseoul" || path.startsWith("/lostinseoul/collections/")
  );
}
