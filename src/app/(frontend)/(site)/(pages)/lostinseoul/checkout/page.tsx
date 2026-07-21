import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import {
  getPortOneSdkVersion,
  isPortOneCheckoutEnabled
} from "@/lib/lost-commerce/portone";
import { CheckoutColophon } from "@/components/Shells/Footer/CheckoutColophon";
import { isManualPaymentEnabled } from "@/lib/lost-commerce/payment-methods";
import { LostCheckoutPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function LostCheckoutPage() {
  const t = await getTranslations("LOSTINSEOUL");
  return (
    <RPage slug={["lostinseoul", "checkout"]} theme="dark" type="pages">
      <LostCheckoutPageClient
        colophon={<CheckoutColophon />}
        manualPaymentEnabled={isManualPaymentEnabled()}
        portOneEnabled={isPortOneCheckoutEnabled()}
        portOneSdkVersion={getPortOneSdkVersion()}
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
          recovering: t("checkout.recovering"),
          recovery: t("checkout.recovery"),
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
