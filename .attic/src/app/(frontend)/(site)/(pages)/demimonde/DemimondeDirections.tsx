import { Link } from "../../../../../../../src/components/core/Link/Link";
import { DIRECTIONS } from "./content";

/**
 * Directions — four-way "Getting there" block: subway/taxi/car/foot.
 * Cookout pages need this prominent because addresses are the single
 * most-asked-about thing on the day.
 */
export function DemimondeDirections() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper-soft)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="directions"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-sans text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {DIRECTIONS.eyebrow}
          </span>
          <h2
            id="directions"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {DIRECTIONS.title}
          </h2>
        </header>

        <dl className="m-0 grid grid-cols-1 gap-0 border-t border-[var(--rule)] md:grid-cols-2 md:border-t-0">
          {DIRECTIONS.items.map((item, i) => {
            const isLastRowDesktop = i >= DIRECTIONS.items.length - 2;
            return (
              <div
                key={item.label}
                className={`m-0 grid grid-cols-1 gap-2 border-b border-dashed border-[var(--rule)] py-7 max-sm:py-5 sm:grid-cols-[120px_1fr] sm:gap-6 md:[&:nth-child(even)]:pl-10 md:[&:nth-child(odd)]:border-r md:[&:nth-child(odd)]:border-dashed md:[&:nth-child(odd)]:border-r-[var(--rule)] md:[&:nth-child(odd)]:pr-10 ${
                  isLastRowDesktop ? "md:border-b-0" : ""
                }`}
              >
                <dt className="pt-[3px] font-sans text-[11px] tracking-[0.22em] text-[var(--tomato)] uppercase">
                  {item.label}
                </dt>
                <dd className="m-0 min-w-0">
                  <p className="m-0 mb-3 text-[14.5px] leading-[1.65] text-[var(--ink-soft)]">
                    {item.body}
                  </p>
                  {item.link ? (
                    <Link
                      href={item.link.href}
                      className="font-sans text-[11px] tracking-[0.14em] text-[var(--tomato)] uppercase underline underline-offset-[4px] transition-colors hover:text-[var(--ink)]"
                    >
                      {item.link.text}
                    </Link>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
