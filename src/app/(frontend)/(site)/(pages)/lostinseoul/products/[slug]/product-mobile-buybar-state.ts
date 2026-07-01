import { cn } from "@/lib/utils";

export function getLostProductMobileBuybarClassName() {
  return cn(
    "lost-product-mobile-buybar fixed inset-x-0 bottom-0 z-[1002] grid gap-3 border-t px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden",
    "border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.14)] bg-[var(--n-s-bg)] shadow-[0_-18px_40px_oklch(from_var(--n-s-bg)_l_c_h_/_0.72)]"
  );
}
