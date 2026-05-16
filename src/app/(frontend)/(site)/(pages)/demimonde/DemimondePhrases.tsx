import s from "./Demimonde.module.scss";
import { PHRASES } from "./content";

export function DemimondePhrases() {
  return (
    <section className={`${s.section} ${s.phrases}`} aria-labelledby="phrases">
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{PHRASES.eyebrow}</span>
          <h2 id="phrases" className={s.sectionTitle}>
            {PHRASES.title}
          </h2>
          <p className={s.sectionLede}>{PHRASES.lede}</p>
        </header>

        <table className={s.phraseTable}>
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">English</th>
              <th scope="col">Say it</th>
              <th scope="col">한국어</th>
            </tr>
          </thead>
          <tbody>
            {PHRASES.rows.map((row) => (
              <tr key={row.en}>
                <td className={s.phraseEn}>{row.en}</td>
                <td className={s.phraseSay}>{row.say}</td>
                <td className={s.phraseNative}>{row.native}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
