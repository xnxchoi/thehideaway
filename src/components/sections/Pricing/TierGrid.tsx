import { TierCard } from "./TierCard";
import { GuestTierCard } from "./GuestTierCard";
import s from "./Pricing.module.scss";
import type { ResolvedPlan } from "@/app/(frontend)/(site)/(pages)/plans/getPlansData";

export type TierGridProps = {
  plans: ResolvedPlan[];
  registered: boolean;
  cta: string;
  guestCta: string;
};

export function TierGrid({ plans, registered, cta, guestCta }: TierGridProps) {
  const inGrid = [...plans]
    .filter((p) => p.presentation !== "founder")
    .sort((a, b) => a.sort - b.sort);

  return (
    <section aria-label="Membership tiers" className={s.tierGridSection}>
      <div className={s.tierGridTwo}>
        <GuestTierCard cta={guestCta} registered={registered} />
        {inGrid.map((p) => (
          <TierCard key={p.id} plan={p} cta={cta} />
        ))}
      </div>
    </section>
  );
}
