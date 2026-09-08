import { PACKING } from "./content";

export function DemimondePacking() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper-soft)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="packing"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-sans text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {PACKING.eyebrow}
          </span>
          <h2
            id="packing"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {PACKING.title}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.55] text-[var(--ink-soft)]">
            {PACKING.lede}
          </p>
        </header>

        <ol className="m-0 grid list-none grid-cols-1 gap-0 border-t border-[var(--rule)] p-0 md:grid-cols-2 md:border-t-0">
          {PACKING.items.map((item, i) => (
            <li
              key={item.head}
              className="flex items-baseline gap-6 border-b border-dashed border-[var(--rule)] py-5 md:[&:nth-child(even)]:pl-8 md:[&:nth-child(odd)]:border-r md:[&:nth-child(odd)]:border-dashed md:[&:nth-child(odd)]:border-r-[var(--rule)] md:[&:nth-child(odd)]:pr-8"
            >
              <span className="min-w-8 font-sans text-[11px] tracking-[0.18em] text-[var(--tomato)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="mb-1 block text-lg font-medium text-[var(--ink)]">
                  {item.head}
                </strong>
                <span className="text-sm leading-[1.55] text-[var(--ink-muted)]">
                  {item.body}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
