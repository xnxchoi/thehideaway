import { Link } from "../../../../../../../src/components/core/Link/Link";
import { FACTS } from "./content";

/**
 * "The facts" strip — Athens-26-style shorthand. Each fact gets a small
 * mono label above its value; vertical rule between facts on desktop.
 */
export function DemimondeFacts() {
  return (
    <section
      className="relative z-[1] border-y border-[var(--rule)] bg-[var(--paper-soft)] px-8 py-10 max-sm:px-6"
      aria-label="The facts"
    >
      <div className="mx-auto mb-6 flex max-w-[1200px] items-center gap-4">
        <span className="shrink-0 font-mono text-[10px] tracking-[0.34em] text-[var(--ink-muted)] uppercase">
          The facts
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" aria-hidden />
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4 md:gap-x-8 md:gap-y-0">
        {FACTS.map((fact) => (
          <div
            key={fact.label}
            className="relative flex flex-col gap-1.5 pl-5 before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-px before:bg-[var(--rule)] before:content-[''] max-sm:pl-4"
          >
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--ink-muted)] uppercase">
              {fact.label}
            </span>
            <span className="font-serif text-2xl leading-[1.15] text-[var(--ink)] italic">
              {fact.value}
            </span>
            {"note" in fact && fact.note ? (
              <span className="mt-0.5 font-mono text-[10px] tracking-[0.18em] text-[var(--ink-muted)] uppercase">
                {fact.note}
              </span>
            ) : null}
            {"link" in fact && fact.link ? (
              <Link
                href={fact.link.href}
                className="mt-1 w-fit font-mono text-[11px] tracking-[0.14em] text-[var(--tomato)] uppercase underline underline-offset-[3px] transition-colors hover:text-[var(--ink)]"
              >
                {fact.link.text}
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
