import { getPlansData } from "./getPlansData";
import { MarkHero } from "@/components/sections/Pricing/MarkHero";
import { TheRoom } from "@/components/sections/Pricing/TheRoom";
import { CofounderApply } from "@/components/sections/Pricing/CofounderApply";
import { FAQAccordion } from "@/components/sections/Pricing/FAQAccordion";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import PlansPageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";

export default async function PlansPage() {
  const plans = await getPlansData();

  return (
    <RPage className={s.pricingShell} type="pages" slug={[]}>
      <PlansPageClient />
      <MarkHero plans={plans} />
      <TheRoom plans={plans} />
      <CofounderApply />
      <FAQAccordion />
    </RPage>
  );
}
