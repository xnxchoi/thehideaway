import s from "./Pricing.module.scss";

export type Benefit = {
  label: string;
  /** When true, this row is patron-exclusive — gets ◐ glyph + PATRON badge. */
  patronOnly?: boolean;
};

export type BenefitListProps = {
  benefits: Benefit[];
  /** Show the legend row at the bottom. Defaults to true if any benefit is patronOnly. */
  showLegend?: boolean;
};

/**
 * Inset benefit list with a subtle glyph system instead of a comparison grid:
 * `○` for benefits any paid tier gets; `◐` + a small `PATRON` mono-cap badge
 * for patron-exclusive rows. A single legend row at the bottom names the glyph.
 *
 * Server component — purely structural. The visual `PATRON` badge is
 * `aria-hidden`; the row's primary content (the label text) is the canonical
 * accessible name. A future schema change can add a `patronOnly` boolean field
 * to Plan features and feed `benefits` directly from there; today the parent
 * (TheRoom) derives it from a regex against the label text.
 */
export function BenefitList({ benefits, showLegend }: BenefitListProps) {
  const hasPatronRow = benefits.some((b) => b.patronOnly);
  const legendVisible = showLegend ?? hasPatronRow;

  return (
    <ul className={s.benefitList} aria-label="What's included">
      {benefits.map((b, i) => (
        <li
          key={i}
          className={s.benefitRow}
          data-tier={b.patronOnly ? "patron" : "all"}
        >
          <span className={s.benefitGlyph} aria-hidden>
            {b.patronOnly ? "◐" : "○"}
          </span>
          <span className={s.benefitLabel}>{b.label}</span>
          {b.patronOnly ? (
            <span className={s.benefitTier} aria-hidden>
              PATRON
            </span>
          ) : null}
        </li>
      ))}
      {legendVisible ? (
        <li className={s.benefitLegend} aria-hidden>
          <span>◐</span>
          <span>Patron tier</span>
        </li>
      ) : null}
    </ul>
  );
}
