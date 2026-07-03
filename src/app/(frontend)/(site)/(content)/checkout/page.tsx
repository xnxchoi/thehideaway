import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { getTranslations } from "next-intl/server";
import type { Plan, Price } from "@/payload-types";
import { CheckoutClient } from "./CheckoutClient";
import { CheckoutRefundInfo } from "./CheckoutRefundInfo";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import { RPage } from "@/components/UX/Transition";
import { CheckoutColophon } from "@/components/Shells/Footer/CheckoutColophon";
import { signInRedirectPath } from "@/lib/routes/auth";
import { isPortOneCheckoutEnabled } from "@/lib/lost-commerce/portone";

export const runtime = "nodejs";

type PlanPaymentMethod = "card" | "bank_transfer" | "cash";

function currencyCodeOf(price: Price): string | null {
  const currency = price.currency;
  return typeof currency === "string" ? currency : (currency?.name ?? null);
}

async function findKrwCheckoutPrice(
  payload: Awaited<ReturnType<typeof getPayload>>,
  planId: string
): Promise<Price | null> {
  const prices = await payload
    .find({
      collection: "prices",
      depth: 1,
      limit: 50,
      overrideAccess: true,
      where: {
        and: [{ plan: { equals: planId } }, { active: { equals: true } }]
      }
    })
    .catch(() => null);

  return (
    ((prices?.docs as Price[] | undefined) ?? []).find(
      (price) => currencyCodeOf(price) === "KRW"
    ) ?? null
  );
}

type SearchParams = Promise<{ plan?: string }>;

export default async function CheckoutPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const planId = searchParams.plan;
  if (!planId) redirect("/plans");

  const payload = await getPayload({ config });
  const headersList = await nextHeaders();
  const auth = await payload.auth({ headers: headersList });
  if (!auth.user) {
    redirect(
      signInRedirectPath(`/checkout?plan=${encodeURIComponent(planId)}`)
    );
  }

  const plan = (await payload
    .findByID({
      collection: "plans",
      id: planId,
      depth: 2,
      overrideAccess: true
    })
    .catch(() => null)) as Plan | null;
  if (!plan || plan.state !== "active") redirect("/plans");

  const price = await findKrwCheckoutPrice(payload, plan.id);
  if (!price) redirect("/plans");

  // Seat-cap check — refuse to start checkout for a sold-out plan.
  if (plan.seat_limit && plan.seat_limit > 0) {
    const seats = await payload.count({
      collection: "subscriptions",
      overrideAccess: true,
      where: {
        and: [
          { plan: { equals: plan.id } },
          { subscription_status: { in: ["active", "pending"] } }
        ]
      }
    });
    if ((seats.totalDocs ?? 0) >= plan.seat_limit) {
      redirect("/plans");
    }
  }

  const display = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(price.unit_amount);

  const validityCopy =
    plan.validity === "lifetime"
      ? "lifetime — pay once, never again"
      : "valid for 1 year — renews free if your work earns it";

  const bankAccount =
    process.env.NEXT_PUBLIC_BANK_ACCOUNT ??
    "기업은행 · 000-000000-00-000 · The Hideaway";

  const planMethods = (plan.payment_methods ?? []) as PlanPaymentMethod[];
  const cardEnabled =
    planMethods.includes("card") && isPortOneCheckoutEnabled();
  const manualMethods = planMethods.filter(
    (method): method is "bank_transfer" | "cash" =>
      method === "bank_transfer" || method === "cash"
  );

  const tCheckout = await getTranslations("Plans.checkout");

  return (
    <RPage type="pages" slug={[]} className={s.pricingShell}>
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "120px 24px 80px"
        }}
      >
        <p className={s.eyebrow} style={{ marginBottom: 12 }}>
          Checkout · {plan.tier_label}
        </p>
        <h1
          className={s.gradientTitle}
          style={{
            fontSize: "clamp(36px, 4vw, 56px)",
            fontWeight: 300,
            margin: "0 0 32px"
          }}
        >
          {plan.tier_label}, by transfer.
        </h1>

        <div
          style={{
            border: "1px solid var(--pricing-line)",
            borderRadius: 10,
            padding: 28,
            background: "var(--pricing-card)",
            marginBottom: 28
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--pricing-fg-mute)"
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--pricing-fg-faint)",
                  marginTop: 4
                }}
              >
                {validityCopy}
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 300,
                letterSpacing: "-0.02em"
              }}
            >
              {display}
            </div>
          </div>
        </div>

        {manualMethods.length > 0 ? (
          <div
            style={{
              border: "1px solid var(--pricing-line)",
              borderRadius: 10,
              padding: 24,
              marginBottom: 32
            }}
          >
            <p className={s.eyebrow} style={{ marginBottom: 14 }}>
              Bank transfer
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono, ui-monospace, monospace)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--pricing-fg)",
                marginBottom: 12
              }}
            >
              {bankAccount}
            </p>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--pricing-fg-mute)",
                margin: 0
              }}
            >
              Send {display} to the account above. After you click below we'll
              start watching for your transfer; access unlocks the moment we
              confirm receipt.
            </p>
          </div>
        ) : null}

        <CheckoutClient
          planId={plan.id}
          priceId={price.id}
          tierLabel={plan.tier_label}
          cardEnabled={cardEnabled}
          manualMethods={manualMethods}
          amountDisplay={display}
          labels={{
            methodLabel: tCheckout("methodLabel"),
            methodCard: tCheckout("methodCard"),
            methodBankTransfer: tCheckout("methodBankTransfer"),
            methodCash: tCheckout("methodCash"),
            payWithCard: tCheckout("payWithCard", { amount: display }),
            processing: tCheckout("processing"),
            verifying: tCheckout("verifying"),
            cardHelp: tCheckout("cardHelp", { amount: display }),
            soldOut: tCheckout("soldOut"),
            genericError: tCheckout("genericError"),
            verifyError: tCheckout("verifyError"),
            cardUnavailable: tCheckout("cardUnavailable")
          }}
        />

        <CheckoutRefundInfo />

        <CheckoutColophon />
      </section>
    </RPage>
  );
}
