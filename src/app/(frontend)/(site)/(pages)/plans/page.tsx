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
import s from "@/components/sections/Pricing/Pricing.module.scss";
import PlansPageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";

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

  return (
    <RPage className={s.pricingShell} type="pages" slug={[]}>
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
      <FeatureMatrix />
      <DemimondeTease />
      <DropTeaser />
      <FAQAccordion />
    </RPage>
  );
}
