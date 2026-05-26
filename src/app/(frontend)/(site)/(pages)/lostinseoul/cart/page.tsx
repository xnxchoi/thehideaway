import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { LostCartPageClient } from "./page.client";

export const metadata: Metadata = {
  title: "LOSTINSEOUL cart",
  description: "Review your LOSTINSEOUL bag."
};

export default async function LostCartPage() {
  const t = await getTranslations("LOSTINSEOUL");
  return (
    <RPage slug={["lostinseoul", "cart"]} type="pages">
      <LostCartPageClient
        labels={{
          title: t("cart.title"),
          empty: t("cart.empty"),
          checkout: t("cart.checkout"),
          remove: t("cart.remove"),
          total: t("cart.total"),
          back: t("nav.back"),
          objects: t("home.objects")
        }}
      />
    </RPage>
  );
}
