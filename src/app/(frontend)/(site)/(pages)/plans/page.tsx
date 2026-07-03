import { getPlansData } from "./getPlansData";
import { getTranslations } from "next-intl/server";
import { PricingHero } from "@/components/sections/Pricing/PricingHero";
import { TheRoom } from "@/components/sections/Pricing/TheRoom";
import { CofounderApply } from "@/components/sections/Pricing/CofounderApply";
import { FAQAccordion } from "@/components/sections/Pricing/FAQAccordion";
import { PlansRefundNote } from "@/components/sections/Pricing/PlansRefundNote";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import PlansPageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";

export default async function PlansPage() {
  const [plans, t] = await Promise.all([
    getPlansData(),
    getTranslations("Plans")
  ]);

  return (
    <RPage className={s.pricingShell} type="pages" slug={[]}>
      <PlansPageClient />
      <PricingHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <TheRoom plans={plans} />
      <CofounderApply />
      <FAQAccordion />
      <PlansRefundNote />
    </RPage>
  );
}
