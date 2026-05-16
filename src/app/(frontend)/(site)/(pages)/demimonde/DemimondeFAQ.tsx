import { FAQ } from "./content";

/**
 * FAQ — always-open per Athens-26 reference. No accordion; questions as
 * inline headers with answers immediately below.
 */
export function DemimondeFAQ() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="faq"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-mono text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {FAQ.eyebrow}
          </span>
          <h2
            id="faq"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {FAQ.title}
          </h2>
        </header>

        <ol className="m-0 flex list-none flex-col border-t border-[var(--rule)] p-0">
          {FAQ.items.map((item, i) => (
            <li
              key={item.q}
              className="grid grid-cols-1 gap-5 border-b border-[var(--rule)] py-9 max-sm:py-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] md:gap-14"
            >
              <div className="flex items-baseline gap-4">
                <span className="min-w-9 shrink-0 font-mono text-[11px] tracking-[0.18em] text-[var(--tomato)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="m-0 font-serif text-[clamp(20px,2.2vw,28px)] leading-[1.2] font-normal tracking-[-0.015em] text-[var(--ink)] italic max-sm:text-[19px]">
                  {item.q}
                </h3>
              </div>
              <div className="flex max-w-[60ch] flex-col gap-3 text-[15.5px] leading-[1.7] text-[var(--ink-soft)]">
                {item.a.map((p, j) => (
                  <p key={j} className="m-0">
                    {p}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
