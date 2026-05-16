import s from "./Demimonde.module.scss";
import { WELCOME } from "./content";

function renderProse(text: string): React.ReactNode {
  // Treat **bold** segments as <strong>. Skeleton-grade markdown.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function DemimondeWelcome() {
  return (
    <section className={`${s.section} ${s.welcome}`} aria-labelledby="welcome">
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{WELCOME.eyebrow}</span>
          <h2 id="welcome" className={s.sectionTitle}>
            {WELCOME.title}
          </h2>
        </header>

        <div className={s.welcomeBody}>
          <blockquote className={s.welcomeBlockquote}>
            {WELCOME.blockquote}
          </blockquote>
          <div className={s.welcomeProse}>
            {WELCOME.paragraphs.map((p, i) => (
              <p key={i}>{renderProse(p)}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
