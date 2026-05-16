import s from "./Demimonde.module.scss";
import { DIRECTIONS } from "./content";

/**
 * Directions — a short utility section between the schedule and the
 * phrases. Athens-26 leans on inline links in FAQ for this; for a
 * one-day cookout it earns its own block because addresses are the
 * single most-asked-about thing on the day.
 */
export function DemimondeDirections() {
  return (
    <section
      className={`${s.section} ${s.directions}`}
      aria-labelledby="directions"
    >
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{DIRECTIONS.eyebrow}</span>
          <h2 id="directions" className={s.sectionTitle}>
            {DIRECTIONS.title}
          </h2>
        </header>

        <dl className={s.directionsGrid}>
          {DIRECTIONS.items.map((item) => (
            <div key={item.label} className={s.directionsItem}>
              <dt className={s.directionsLabel}>{item.label}</dt>
              <dd className={s.directionsBody}>
                <p>{item.body}</p>
                {item.link ? (
                  <a
                    className={s.directionsLink}
                    href={item.link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.link.text}
                  </a>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
