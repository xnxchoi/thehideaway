import Link from "next/link";
import s from "./Pricing.module.scss";

export type GuestTierCardProps = {
  cta: string;
  registered: boolean;
};

export function GuestTierCard({ cta, registered }: GuestTierCardProps) {
  return (
    <article className={`${s.tierCard} ${s.fadeIn}`}>
      <div className={s.tierBadgeRow}>
        <span className={s.tierLabel}>Guest</span>
      </div>

      <div className={s.priceBlock}>
        <div className={s.priceMain} aria-hidden>
          Free
        </div>
        <div className={s.priceSecondary}>
          <span className={s.priceUnit}>Free, forever</span>
        </div>
      </div>

      <div className={s.divider} />

      <ul className={s.featureList}>
        <li className={s.featureRow}>
          <span className={s.featureMark}>
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
          </span>
          <span>Read all public essays</span>
        </li>
        <li className={s.featureRow}>
          <span className={s.featureMark}>
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
          </span>
          <span>Comment, bookmark, follow</span>
        </li>
        <li className={s.featureRow}>
          <span className={s.featureMark}>
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
          </span>
          <span>Draft your own posts</span>
        </li>
        <li className={s.featureRow} data-included="false">
          <span className={s.featureMark}>
            <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
              <path
                d="M3 7h8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
          <span>Member-locked content</span>
        </li>
        <li className={s.featureRow} data-included="false">
          <span className={s.featureMark}>
            <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden>
              <path
                d="M3 7h8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
          <span>Drops & exclusive events</span>
        </li>
      </ul>

      <p
        style={{
          fontSize: 12,
          color: "var(--pricing-fg-faint)",
          marginBottom: 18,
          lineHeight: 1.5
        }}
      >
        Begin as a guest. Upgrade whenever the door looks interesting.
      </p>

      <Link
        href={registered ? "/me" : "/signup"}
        className={s.cta}
        prefetch={false}
      >
        {cta}
      </Link>
    </article>
  );
}
