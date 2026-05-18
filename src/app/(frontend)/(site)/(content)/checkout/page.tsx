import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Plan, Price, Currency } from "@/payload-types";
import { CheckoutClient } from "./CheckoutClient";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import { RPage } from "@/components/UX/Transition";

export const runtime = "nodejs";

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
    redirect(`/login?redirect=/checkout?plan=${encodeURIComponent(planId)}`);
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

  const price = plan.price?.[0] as Price | undefined;
  const krw = price?.currencies?.find(
    (c) => (c.currency as Currency)?.name === "KRW"
  );
  if (!krw) redirect("/plans");

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
  }).format(krw.amount);

  const validityCopy =
    plan.validity === "lifetime"
      ? "lifetime — pay once, never again"
      : "valid for 1 year — renews free if your work earns it";

  const bankAccount =
    process.env.NEXT_PUBLIC_BANK_ACCOUNT ??
    "기업은행 · 000-000000-00-000 · The Hideaway";

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

        <CheckoutClient planId={plan.id} tierLabel={plan.tier_label} />
      </section>
    </RPage>
  );
}
