import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { isPortOneCheckoutEnabled } from "@/lib/lost-commerce/portone";
import { LostCheckoutPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function LostCheckoutPage() {
  const t = await getTranslations("LOSTINSEOUL");
  return (
    <RPage slug={["lostinseoul", "checkout"]} type="pages">
      <LostCheckoutPageClient
        portOneEnabled={isPortOneCheckoutEnabled()}
        labels={{
          title: t("checkout.title"),
          back: t("nav.back"),
          contact: t("checkout.contact"),
          shipping: t("checkout.shipping"),
          payment: t("checkout.payment"),
          portone: t("checkout.portone"),
          manual: t("checkout.manual"),
          submit: t("checkout.submit"),
          pending: t("checkout.pending"),
          failed: t("checkout.failed"),
          portoneUnavailable: t("checkout.portoneUnavailable"),
          name: t("checkout.name"),
          email: t("checkout.email"),
          phone: t("checkout.phone"),
          address: t("checkout.address"),
          note: t("checkout.note"),
          empty: t("cart.empty"),
          total: t("cart.total")
        }}
      />
    </RPage>
  );
}
