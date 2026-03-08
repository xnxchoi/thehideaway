"use client";
import { getPageTypeFromUrl } from "@/utilities/Helpers";
import { useParams, usePathname } from "next/navigation";

export const useGetPageType = () => {
  const path = usePathname();
  const pageType = getPageTypeFromUrl(path);
  return {
    pageType
  };
};
export const useOrderedSlugs = () => {
  const params = useParams();
  const para = Object.keys(params);
  let k: string[] = [];
  if (para.length > 0) {
    k = [
      ...para.flatMap((item) => {
        const b = params[item];
        if (!b) return [];
        if (typeof b === "string") {
          return b;
        }
        return b.flatMap((item) => item);
      })
    ];
  }
  return k;
};
export const constructURL = (pathName: string, slugs: string[]) => {
  return pathName;
};
