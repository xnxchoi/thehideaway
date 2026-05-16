import s from "./Demimonde.module.scss";
import { FAQ } from "./content";

/**
 * FAQ — always-open per Athens-26 reference. No accordion; questions as
 * inline headers with answers immediately below. Each item is numbered so
 * the page can be referenced verbally ("see number 4 about dogs").
 */
export function DemimondeFAQ() {
  return (
    <section className={`${s.section} ${s.faq}`} aria-labelledby="faq">
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{FAQ.eyebrow}</span>
          <h2 id="faq" className={s.sectionTitle}>
            {FAQ.title}
          </h2>
        </header>

        <ol className={s.faqList}>
          {FAQ.items.map((item, i) => (
            <li key={item.q} className={s.faqItem}>
              <div className={s.faqQ}>
                <span className={s.faqIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={s.faqText}>{item.q}</h3>
              </div>
              <div className={s.faqA}>
                {item.a.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
