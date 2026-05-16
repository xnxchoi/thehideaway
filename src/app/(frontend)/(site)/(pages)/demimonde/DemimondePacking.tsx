import s from "./Demimonde.module.scss";
import { PACKING } from "./content";

export function DemimondePacking() {
  return (
    <section className={`${s.section} ${s.packing}`} aria-labelledby="packing">
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{PACKING.eyebrow}</span>
          <h2 id="packing" className={s.sectionTitle}>
            {PACKING.title}
          </h2>
          <p className={s.sectionLede}>{PACKING.lede}</p>
        </header>

        <ol className={s.packingList}>
          {PACKING.items.map((item, i) => (
            <li key={item.head} className={s.packingItem}>
              <span className={s.packingNum}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className={s.packingText}>
                <strong>{item.head}</strong>
                <span>{item.body}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
