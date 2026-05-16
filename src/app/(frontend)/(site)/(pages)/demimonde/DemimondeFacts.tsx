import s from "./Demimonde.module.scss";
import { FACTS } from "./content";

/**
 * "The facts" strip — Athens-26-style shorthand. Comma-separated, mono-cased
 * blurb on one row when there's space, stacks vertically on mobile. Each fact
 * gets a small mono label above its value.
 */
export function DemimondeFacts() {
  return (
    <section className={s.facts} aria-label="The facts">
      <div className={s.factsHead}>
        <span className={s.factsHeadLabel}>The facts</span>
        <span className={s.factsHeadRule} aria-hidden />
      </div>
      <div className={s.factsGrid}>
        {FACTS.map((fact) => (
          <div key={fact.label} className={s.factItem}>
            <span className={s.factLabel}>{fact.label}</span>
            <span className={s.factValue}>{fact.value}</span>
            {"note" in fact && fact.note ? (
              <span className={s.factNote}>{fact.note}</span>
            ) : null}
            {"link" in fact && fact.link ? (
              <a
                className={s.factLink}
                href={fact.link.href}
                target="_blank"
                rel="noreferrer"
              >
                {fact.link.text}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
