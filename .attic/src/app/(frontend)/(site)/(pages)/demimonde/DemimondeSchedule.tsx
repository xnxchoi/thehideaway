import { Link } from "../../../../../../../src/components/core/Link/Link";
import { SCHEDULE } from "./content";

export function DemimondeSchedule() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="schedule"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-mono text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {SCHEDULE.eyebrow}
          </span>
          <h2
            id="schedule"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {SCHEDULE.title}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.55] text-[var(--ink-soft)]">
            {SCHEDULE.lede}
          </p>
        </header>

        {SCHEDULE.days.map((day, dayIdx) => {
          const isFirst = dayIdx === 0;
          const isLast = dayIdx === SCHEDULE.days.length - 1;
          return (
            <div
              key={day.label}
              className={`grid grid-cols-1 gap-7 py-14 md:grid-cols-[280px_1fr] md:gap-14 ${
                isLast ? "border-b-0 pb-0" : "border-b border-[var(--rule)]"
              } ${isFirst ? "pt-0" : ""}`}
            >
              <div className="self-start md:sticky md:top-8">
                <div className="mb-2 font-mono text-[11px] tracking-[0.3em] text-[var(--tomato)] uppercase">
                  {day.label}
                </div>
                <h3 className="mb-3 font-serif text-4xl leading-[0.96] font-normal text-[var(--ink)] italic max-sm:text-3xl">
                  {day.title}
                </h3>
                <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--ink-muted)]">
                  {day.date}
                </div>
              </div>

              <div className="flex min-w-0 flex-col">
                {day.blocks.map((block, blockIdx) => (
                  <div
                    key={block.time}
                    className={`grid grid-cols-[72px_1fr] gap-6 py-5 max-sm:grid-cols-[60px_1fr] max-sm:gap-4 ${
                      blockIdx === 0
                        ? "border-t-0 pt-0"
                        : "border-t border-dashed border-[var(--rule)]"
                    }`}
                  >
                    <div className="pt-[3px] font-mono text-[12px] font-medium tracking-[0.1em] text-[var(--ink)]">
                      {block.time}
                    </div>
                    <div>
                      <strong className="mb-1.5 block text-lg leading-[1.35] font-medium text-[var(--ink)]">
                        {block.head}
                        {"star" in block && block.star ? (
                          <span
                            className="ml-2 inline-block font-mono text-[var(--citrus)]"
                            aria-label="featured"
                          >
                            ★
                          </span>
                        ) : null}
                      </strong>
                      <p className="m-0 text-[14.5px] leading-[1.6] text-[var(--ink-muted)]">
                        {block.body}
                        {"link" in block && block.link ? (
                          <>
                            {" "}
                            <Link
                              href={block.link.href}
                              className="text-[var(--tomato)] underline underline-offset-[3px] transition-colors hover:text-[var(--ink)]"
                            >
                              {block.link.text}
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
