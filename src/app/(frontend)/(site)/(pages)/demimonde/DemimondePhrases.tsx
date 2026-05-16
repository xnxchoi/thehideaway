import { PHRASES } from "./content";

export function DemimondePhrases() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper-soft)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="phrases"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-mono text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {PHRASES.eyebrow}
          </span>
          <h2
            id="phrases"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {PHRASES.title}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.55] text-[var(--ink-soft)]">
            {PHRASES.lede}
          </p>
        </header>

        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-[var(--rule)] pb-4 pl-0 text-left font-mono text-[10px] font-normal tracking-[0.3em] text-[var(--ink-muted)] uppercase max-sm:pr-2 max-sm:pl-0 sm:px-4"
              >
                English
              </th>
              <th
                scope="col"
                className="border-b border-[var(--rule)] pb-4 text-left font-mono text-[10px] font-normal tracking-[0.3em] text-[var(--ink-muted)] uppercase max-sm:px-2 sm:px-4"
              >
                Say it
              </th>
              <th
                scope="col"
                className="border-b border-[var(--rule)] pb-4 text-left font-mono text-[10px] font-normal tracking-[0.3em] text-[var(--ink-muted)] uppercase max-sm:px-2 sm:px-4"
              >
                한국어
              </th>
            </tr>
          </thead>
          <tbody>
            {PHRASES.rows.map((row) => (
              <tr key={row.en}>
                <td className="border-b border-dashed border-[var(--rule)] py-4.5 pl-0 align-top text-[15px] font-medium text-[var(--ink)] max-sm:pr-2 sm:px-4">
                  {row.en}
                </td>
                <td className="border-b border-dashed border-[var(--rule)] py-4.5 align-top font-mono text-[13px] text-[var(--ink-muted)] max-sm:px-2 sm:px-4">
                  {row.say}
                </td>
                <td className="border-b border-dashed border-[var(--rule)] py-4.5 align-top font-serif text-[17px] text-[var(--tomato)] italic max-sm:px-2 sm:px-4">
                  {row.native}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
