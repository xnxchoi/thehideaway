"use client";

import {
  constructURL,
  useOrderedSlugs,
  useGetPageType
} from "@/hooks/useGetPageType";
import { useRPStore } from "@/providers/RP_Pro";
import { getMenuPagePreviewKey } from "@/utilities/Helpers";
import { usePathname } from "next/navigation";

export type CurrentPageInfo = {
  currentPath: string;
  currentPageKey: string | null;
  currentPageSlug: string | null;
  pageType: string;
  isHome: boolean;
  urlModuleIsOn: string;
};
export const useCurrentPage = (): CurrentPageInfo => {
  const pathName = usePathname();
  const slugg = useOrderedSlugs();
  const url = constructURL(pathName, slugg);
  const isHome = pathName === "/home" || pathName === "/";
  const { pageType } = useGetPageType();
  const urlModuleIsOn = url;
  const pagePreviewKeys = useRPStore((l) => l.navigationPageItemKeys);
  const slug = slugg.length > 0 ? slugg[0] : "";
  const pk = getMenuPagePreviewKey(pageType, slug);
  return {
    isHome,
    currentPath: pathName,
    currentPageKey:
      pagePreviewKeys.find((value, index) => {
        if (value === pk) return value;
      }) ?? null,
    currentPageSlug: slug,
    pageType,
    urlModuleIsOn
  };
};
