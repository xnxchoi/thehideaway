import { getTranslations } from "next-intl/server";
import { Link } from "@/components/core/Link/Link";
import { BenefitList, type Benefit } from "./BenefitList";
import type { ResolvedPlan } from "@/app/(frontend)/(site)/(pages)/plans/getPlansData";
import s from "./Pricing.module.scss";

export type TheRoomProps = {
  plans: ResolvedPlan[];
};

const PATRON_KEYWORDS =
  /\bpatron\b|\bquarterly\b|\bdemimonde\b|\bdrop\b|\baddress\b/i;

type RoomTranslator = (
  key: string,
  values?: Record<string, string | number>
) => string;

function getSeatLabel(plan: ResolvedPlan, t: RoomTranslator) {
  if (plan.sold_out) return t("seats.closed");
  if (typeof plan.seats_remaining === "number") {
    return t("seats.remaining", { count: plan.seats_remaining });
  }
  return t("seats.open");
}

function toBenefits(plan: ResolvedPlan | undefined, markPatronOnly: boolean) {
  return (plan?.features ?? [])
    .filter((feature) => feature.included)
    .map((feature) => ({
      label: feature.label,
      patronOnly: markPatronOnly ? PATRON_KEYWORDS.test(feature.label) : false
    }));
}

function PlanCard({
  plan,
  variant,
  benefits,
  t
}: {
  plan: ResolvedPlan;
  variant: "patron" | "resident";
  benefits: Benefit[];
  t: RoomTranslator;
}) {
  const href = `/checkout?plan=${encodeURIComponent(plan.id)}`;
  const methods = [...new Set(plan.payment_methods)].map((method) =>
    t(`methods.${method}`)
  );

  return (
    <article
      className={s.planCard}
      data-tier={variant}
      data-sold-out={plan.sold_out}
    >
      <div className={s.planCardTopline}>
        <span>
          {variant === "patron" ? t("patronBadge") : t("residentBadge")}
        </span>
        <span>{getSeatLabel(plan, t)}</span>
      </div>

      <div className={s.planCardHeader}>
        <div>
          <h3>{plan.tier_label}</h3>
          {plan.description ? <p>{plan.description}</p> : null}
        </div>
        <p className={s.planPrice}>
          <span>{plan.price.display}</span>
          <small>{t(`validity.${plan.validity}`)}</small>
        </p>
      </div>

      <BenefitList
        benefits={benefits}
        ariaLabel={t("benefitsLabel")}
        patronTierLabel={t("patronTierLabel")}
        showLegend={variant === "patron"}
      />

      {methods.length ? (
        <p className={s.paymentMethods}>
          <span>{t("methodsLabel")}</span>
          {methods.join(" / ")}
        </p>
      ) : null}

      {plan.sold_out ? (
        <span className={`${s.cta} ${s.ctaDisabled}`} aria-disabled="true">
          {t("cta.closed")}
        </span>
      ) : (
        <Link href={href} className={s.cta} prefetch={false}>
          {t(`cta.${variant}`)}
        </Link>
      )}
      <p className={s.ctaNote}>{t(`ctaNote.${variant}`)}</p>
    </article>
  );
}

export async function TheRoom({ plans }: TheRoomProps) {
  const t = (await getTranslations("Plans.room")) as RoomTranslator;
  const patron = plans.find((plan) => plan.tier === "patron");
  const resident = plans.find((plan) => plan.tier === "resident");

  if (!patron && !resident) return null;

  return (
    <section
      id="membership-options"
      aria-labelledby="membership-options-title"
      className={s.theRoom}
    >
      <header className={s.roomHeader}>
        <p className={s.eyebrow}>{t("eyebrow")}</p>
        <h2 id="membership-options-title">{t("title")}</h2>
        <p>{t("intro")}</p>
      </header>

      <div className={s.planDossier}>
        <aside className={s.planDecision}>
          <p className={s.eyebrow}>{t("summaryEyebrow")}</p>
          <h3>{t("summaryTitle")}</h3>
        </aside>
        <div className={s.planGrid}>
          {resident ? (
            <PlanCard
              plan={resident}
              variant="resident"
              benefits={toBenefits(resident, false)}
              t={t}
            />
          ) : null}
          {patron ? (
            <PlanCard
              plan={patron}
              variant="patron"
              benefits={toBenefits(patron, true)}
              t={t}
            />
          ) : null}
        </div>
      </div>

      {resident && patron ? (
        <p className={s.residentOnRamp}>
          <span className={s.residentMuted}>{resident.tier_label}: </span>
          {t("residentNote")}
        </p>
      ) : null}
    </section>
  );
}
