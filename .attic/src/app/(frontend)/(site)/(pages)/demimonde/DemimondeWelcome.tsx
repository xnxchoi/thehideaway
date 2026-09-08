import { WELCOME } from "./content";

function renderProse(text: string): React.ReactNode {
  // Treat **bold** segments as <strong>. Skeleton-grade markdown.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-[var(--ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function DemimondeWelcome() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="welcome"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-sans text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {WELCOME.eyebrow}
          </span>
          <h2
            id="welcome"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {WELCOME.title}
          </h2>
        </header>

        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[1fr_1.4fr] md:gap-24">
          <blockquote className="m-0 border-l-2 border-[var(--tomato)] pl-6 font-serif text-[clamp(22px,2.6vw,32px)] leading-[1.2] tracking-[-0.015em] text-[var(--ink)] italic max-sm:pl-4">
            {WELCOME.blockquote}
          </blockquote>
          <div className="flex max-w-[60ch] flex-col gap-4 text-base leading-[1.7] text-[var(--ink-soft)]">
            {WELCOME.paragraphs.map((p, i) => (
              <p key={i} className="m-0">
                {renderProse(p)}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
