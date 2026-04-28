import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { getPlansData } from "./getPlansData";
import { PricingHero } from "@/components/sections/Pricing/PricingHero";
import { TierGrid } from "@/components/sections/Pricing/TierGrid";
import { FeatureMatrix } from "@/components/sections/Pricing/FeatureMatrix";
import { DropTeaser } from "@/components/sections/Pricing/DropTeaser";
import { FAQAccordion } from "@/components/sections/Pricing/FAQAccordion";
import { DemimondeTease } from "@/components/sections/Pricing/DemimondeTease";
import { FounderRibbonIsland } from "@/components/sections/Pricing/FounderRibbonIsland";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import PlansPageClient from "./page.client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const [plans, registered] = await Promise.all([
    getPlansData(),
    (async (): Promise<boolean> => {
      try {
        const payload = await getPayload({ config });
        const headersList = await nextHeaders();
        const auth = await payload.auth({ headers: headersList });
        return Boolean(auth.user);
      } catch {
        return false;
      }
    })()
  ]);

  const founderPlan = plans.find((p) => p.presentation === "founder");

  return (
    <main className={s.pricingShell} data-theme="dark">
      <PlansPageClient />
      <PricingHero
        eyebrow="Membership"
        title="Find your way in."
        subtitle="The Hideaway is a small, opinionated editorial. One-time payment, no recurring charges. Two ways in — find yours."
      />
      <TierGrid
        plans={plans}
        registered={registered}
        cta="Request access"
        guestCta={registered ? "You're in" : "Register as guest"}
      />
      {founderPlan ? (
        <FounderRibbonIsland
          planId={founderPlan.id}
          priceDisplay={founderPlan.price.display}
          validityLabel={
            founderPlan.validity === "lifetime" ? "lifetime · once" : "per year"
          }
          features={founderPlan.features}
          seatsRemaining={founderPlan.seats_remaining ?? 0}
          seatsTotal={founderPlan.seat_limit ?? 0}
          soldOut={founderPlan.sold_out}
        />
      ) : null}
      <FeatureMatrix />
      <DemimondeTease />
      <DropTeaser />
      <FAQAccordion />
    </main>
  );
}
