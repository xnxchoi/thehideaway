import { MarkerLink } from "@/components/UX/MarkerStroke";
import { MembershipBand } from "./MembershipBand";
import type { Benefit } from "./BenefitList";
import type { ResolvedPlan } from "@/app/(frontend)/(site)/(pages)/plans/getPlansData";
import s from "./Pricing.module.scss";

export type TheRoomProps = {
  plans: ResolvedPlan[];
};

/**
 * Single-identity composition: Patron is the membership; Resident appears
 * as a one-line on-ramp underneath. Cofounder Plans are filtered out by
 * getPlansData() at the data layer (Track A), so this component never sees
 * one even if a cofounder Plan exists in the admin.
 *
 * INTERIM heuristic — patron-exclusivity is derived from feature label text.
 * A single regex captures "patron", "quarterly", "demimonde", "drop", or
 * "address" (the words that show up in patron-exclusive copy in the seed).
 * The right long-term fix is a `patronOnly: boolean` field on Plan features
 * in Payload; it's a Track A-style schema change and out of scope here. See
 * the Track B plan's Task 4 GOTCHA for the rationale.
 */
const PATRON_KEYWORDS = /patron|quarterly|demimonde|drop|address/i;

export function TheRoom({ plans }: TheRoomProps) {
  const patron = plans.find((p) => p.tier === "patron");
  const resident = plans.find((p) => p.tier === "resident");

  if (!patron) return null;

  const benefits: Benefit[] = patron.features
    .filter((f) => f.included)
    .map((f) => ({
      label: f.label,
      patronOnly: PATRON_KEYWORDS.test(f.label)
    }));

  return (
    <section aria-label="Membership" className={s.theRoom}>
      <MembershipBand
        variant="page"
        tierLabel={patron.tier_label}
        priceDisplay={patron.price.display}
        validityLabel={
          patron.validity === "lifetime" ? "lifetime · once" : "per year"
        }
        description={patron.description}
        benefits={benefits}
        ctaLabel="Request access"
        ctaHref={`/checkout?plan=${encodeURIComponent(patron.id)}`}
      />
      {resident ? (
        <p className={s.residentOnRamp}>
          <span className={s.residentMuted}>Or start as a Resident — </span>
          <MarkerLink
            href={`/checkout?plan=${encodeURIComponent(resident.id)}`}
            variant="underline"
          >
            {resident.price.display} / year, same door, smaller key.
          </MarkerLink>
        </p>
      ) : null}
    </section>
  );
}
