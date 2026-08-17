import { getTranslations } from "next-intl/server";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import { RPage } from "@/components/UX/Transition";
import { CheckoutColophon } from "@/components/Shells/Footer/CheckoutColophon";
import { CheckoutReturnClient } from "./CheckoutReturnClient";

type SearchParams = Promise<{ payment?: string }>;

/**
 * PortOne redirect-return landing (mobile card flow). PortOne redirects the
 * browser here after the payment window; the client runs the same idempotent
 * verify the desktop path runs inline, then routes to success. If verify is
 * still settling, the webhook reconciles the subscription in the background.
 */
export default async function CheckoutReturnPage(props: {
  searchParams: SearchParams;
}) {
  const { payment } = await props.searchParams;
  const t = await getTranslations("Plans.checkout");

  return (
    <RPage className={s.pricingShell} type="pages" slug={[]}>
      <section
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "160px 24px 100px",
          textAlign: "center"
        }}
      >
        <CheckoutReturnClient
          paymentRef={payment ?? null}
          verifyingLabel={t("verifying")}
          errorLabel={t("verifyError")}
        />
        <div style={{ textAlign: "left", marginTop: 48 }}>
          <CheckoutColophon />
        </div>
      </section>
    </RPage>
  );
}
