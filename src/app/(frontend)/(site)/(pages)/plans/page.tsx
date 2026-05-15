import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { getPlansData } from "./getPlansData";
import { MarkHero } from "@/components/sections/Pricing/MarkHero";
import { TheRoom } from "@/components/sections/Pricing/TheRoom";
import { CofounderApply } from "@/components/sections/Pricing/CofounderApply";
import { FAQAccordion } from "@/components/sections/Pricing/FAQAccordion";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import PlansPageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  // We still warm the auth path on every request — no current section consumes
  // `registered`, but the side effect (Payload auth resolution) keeps the
  // page-load characteristics stable for the next iteration that will need it.
  const [plans] = await Promise.all([
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
      <MarkHero />
      <TheRoom plans={plans} />
      <CofounderApply />
      <FAQAccordion />
    </RPage>
  );
}
