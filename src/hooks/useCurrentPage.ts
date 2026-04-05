"use client";

import { useGetPageType } from "@/hooks/useGetPageType";
import { useRPStore } from "@/providers/RP_Pro";
import { getMenuPagePreviewKey } from "@/utilities/Helpers";
import { usePathname } from "next/navigation";

export type CurrentPageInfo = {
  currentPageKey: string | null;

  pageType: string;
};
export const useCurrentPage = (): CurrentPageInfo => {
  const pathName = usePathname();

  const { pageType } = useGetPageType();

  const pagePreviewKeys = useRPStore((l) => l.navigationPageItemKeys);

  const pk = getMenuPagePreviewKey(pageType, pathName.split("/")[0]);
  return {
    currentPageKey:
      pagePreviewKeys.find((value, index) => {
        if (value === pk) return value;
      }) ?? null,

    pageType
  };
};
