"use client";

import { usePathname } from "next/navigation";
import {
  Announcement,
  EntrySequence,
  FooterOverride,
  Header
} from "@lostinseoul/components";
import { isEntryPath, isShopChromePath } from "./routes";

export function StoreChrome({
  drops
}: {
  drops: Array<{ title: string; slug: string }>;
}) {
  const pathname = usePathname() ?? "";
  if (!isShopChromePath(pathname)) return null;

  return (
    <>
      <FooterOverride />
      {isEntryPath(pathname) ? <EntrySequence /> : null}
      <div className="lost-commerce-chrome fixed inset-x-0 top-0 z-[1002]">
        <Announcement />
        <Header drops={drops} />
      </div>
    </>
  );
}
