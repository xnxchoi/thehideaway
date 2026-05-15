import { Link } from "@/components/core/Link/Link";
import s from "./Pricing.module.scss";
import type { ResolvedPlan } from "@/app/(frontend)/(site)/(pages)/plans/getPlansData";

export type TierCardProps = {
  plan: ResolvedPlan;
  cta: string;
};

const Check = () => (
  <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
    <path
      d="M2 7.4 5.6 11 12 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const Dash = () => (
  <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
    <path
      d="M3 7h8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const validitySuffix = (v: ResolvedPlan["validity"]): string =>
  v === "lifetime" ? " · lifetime" : " / year";

export function TierCard({ plan, cta }: TierCardProps) {
  const soldOut = plan.sold_out;

  return (
    <article className={`${s.tierCard} ${s.fadeIn}`} data-sold-out={soldOut}>
      <div className={s.tierBadgeRow}>
        <span className={s.tierLabel}>{plan.tier_label}</span>
        {plan.discount_label ? (
          <span className={s.savePill}>{plan.discount_label}</span>
        ) : null}
      </div>

      <div className={s.priceBlock}>
        <div className={s.priceMain} aria-hidden>
          <span data-strike={soldOut}>{plan.price.display}</span>
        </div>
        <div className={s.priceSecondary}>
          <span className={s.priceUnit}>
            {plan.price.display}
            {validitySuffix(plan.validity)}
          </span>
        </div>
        {plan.seat_limit ? (
          <div className={s.seatLine}>
            {soldOut
              ? "Closed — seats taken"
              : `${plan.seats_remaining} ${
                  plan.seats_remaining === 1 ? "spot remains" : "spots remain"
                }`}
          </div>
        ) : null}
      </div>

      <div className={s.divider} />

      <ul className={s.featureList}>
        {plan.features.map((f, i) => (
          <li
            key={`${plan.id}-f-${i}`}
            className={s.featureRow}
            data-included={f.included}
          >
            <span className={s.featureMark}>
              {f.included ? <Check /> : <Dash />}
            </span>
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      {plan.description ? (
        <p className={s.tierDescription}>{plan.description}</p>
      ) : null}

      {soldOut ? (
        <button
          type="button"
          className={s.cta}
          disabled
          aria-disabled
          style={{ opacity: 0.4, cursor: "not-allowed" }}
        >
          Closed
        </button>
      ) : (
        <Link
          href={`/checkout?plan=${encodeURIComponent(plan.id)}`}
          className={s.cta}
          prefetch={false}
          aria-label={`${cta} — ${plan.tier_label}`}
        >
          {cta}
        </Link>
      )}
    </article>
  );
}
