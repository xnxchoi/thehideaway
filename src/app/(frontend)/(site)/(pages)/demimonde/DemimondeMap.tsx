import { Link } from "@/components/core/Link/Link";
import { MAP } from "./content";

/**
 * DemimondeMap — illustrated neighborhood sketch + address card.
 * The SVG layer styles use Tailwind via the `[&_path]:` group-selector
 * pattern on the parent <svg>, since SVG presentation attributes
 * (stroke, fill) work with Tailwind colors.
 */
export function DemimondeMap() {
  return (
    <section
      className="relative z-[1] bg-[var(--paper)] px-8 py-24 max-sm:px-6 max-sm:py-18"
      aria-labelledby="map-section"
    >
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-14 flex flex-col gap-2 border-b border-[var(--rule)] pb-7 max-sm:mb-9">
          <span className="font-mono text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
            {MAP.eyebrow}
          </span>
          <h2
            id="map-section"
            className="m-0 font-serif text-[clamp(36px,5.5vw,72px)] leading-[0.96] tracking-[-0.025em] text-[var(--ink)] italic"
          >
            {MAP.title}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.55] text-[var(--ink-soft)]">
            {MAP.lede}
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <figure className="relative m-0 flex flex-col gap-4 border border-[var(--rule)] bg-[var(--paper-soft)] p-8 max-sm:p-5">
            <svg
              viewBox="0 0 600 600"
              className="block aspect-square h-auto w-full"
              role="img"
              aria-label="Stylized neighborhood sketch with the venue marked"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Topo curves */}
              <g
                stroke="var(--rule)"
                strokeWidth="0.8"
                fill="none"
                opacity="0.55"
              >
                <path d="M -20 110 Q 150 80 320 110 T 620 105" />
                <path d="M -20 150 Q 150 125 320 150 T 620 145" />
                <path d="M -20 190 Q 150 170 320 195 T 620 185" />
                <path d="M -20 230 Q 150 215 320 235 T 620 230" />
              </g>

              {/* River arc */}
              <path
                d="M -20 470 Q 150 440 320 480 T 620 460"
                fill="none"
                stroke="oklch(0.7 0.04 240)"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.45"
              />
              <text
                x="500"
                y="490"
                fontStyle="italic"
                className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
              >
                river
              </text>

              {/* Park patch */}
              <path
                d="M 70 320 L 215 305 L 235 365 L 195 405 L 90 410 L 55 360 Z"
                fill="var(--herb)"
                opacity="0.16"
              />
              <text
                x="105"
                y="360"
                className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
              >
                PARK
              </text>

              {/* Streets */}
              <g
                stroke="var(--ink-muted)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              >
                <path d="M -20 350 L 620 360" />
                <path d="M 380 -20 Q 360 200 388 400 T 365 620" />
                <path d="M 50 80 Q 200 250 388 360" />
                <path d="M -20 540 L 620 545" />
              </g>

              <text
                x="60"
                y="155"
                className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
              >
                STATION
              </text>
              <text
                x="450"
                y="200"
                className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
              >
                BAKERY
              </text>
              <text
                x="120"
                y="540"
                className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
              >
                CORNER STORE
              </text>

              {/* Venue marker */}
              <g transform="translate(388, 360)">
                <circle
                  r="22"
                  fill="none"
                  stroke="var(--tomato)"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <circle r="10" fill="var(--tomato)" />
                <path
                  d="M 22 -8 Q 60 -30 110 -42"
                  fill="none"
                  stroke="var(--tomato)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <text
                  x="115"
                  y="-38"
                  fontStyle="italic"
                  className="fill-[var(--ink)] font-serif text-[17px] tracking-[-0.015em]"
                >
                  the garden
                </text>
                <text
                  x="115"
                  y="-22"
                  className="fill-[var(--tomato)] font-mono text-[10px] tracking-[0.18em] uppercase"
                >
                  est. 14:00
                </text>
              </g>

              {/* Compass */}
              <g
                transform="translate(540, 75)"
                stroke="var(--ink-muted)"
                strokeWidth="0.8"
                fill="none"
                opacity="0.7"
              >
                <circle r="26" />
                <line
                  x1="0"
                  y1="-22"
                  x2="0"
                  y2="-3"
                  stroke="var(--tomato)"
                  strokeWidth="1.6"
                  opacity="1"
                />
                <line x1="0" y1="3" x2="0" y2="18" />
                <line x1="-18" y1="0" x2="-3" y2="0" />
                <line x1="3" y1="0" x2="18" y2="0" />
                <text
                  y="-32"
                  textAnchor="middle"
                  className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
                >
                  N
                </text>
              </g>

              {/* Scale bar */}
              <g
                transform="translate(40, 570)"
                stroke="var(--ink-muted)"
                strokeWidth="1"
                opacity="0.65"
              >
                <line x1="0" y1="0" x2="80" y2="0" />
                <line x1="0" y1="-4" x2="0" y2="4" />
                <line x1="40" y1="-3" x2="40" y2="3" />
                <line x1="80" y1="-4" x2="80" y2="4" />
                <text
                  x="0"
                  y="18"
                  className="fill-[var(--ink-muted)] font-mono text-[10px] tracking-[0.28em] uppercase"
                >
                  100m
                </text>
              </g>
            </svg>
            <figcaption className="text-center font-mono text-[10px] tracking-[0.22em] text-[var(--ink-muted)] uppercase">
              {MAP.caption}
            </figcaption>
          </figure>

          <aside className="min-w-0">
            <p className="m-0 mb-3 font-mono text-[10px] tracking-[0.32em] text-[var(--tomato)] uppercase">
              The address
            </p>
            <p className="m-0 mb-8 font-serif text-[clamp(22px,2.4vw,30px)] leading-[1.25] font-normal tracking-[-0.015em] text-[var(--ink)] italic">
              {MAP.address.line1}
              <br />
              {MAP.address.line2}
            </p>

            <ul className="m-0 mb-8 list-none border-t border-[var(--rule)] p-0">
              {MAP.metadata.map((item) => (
                <li
                  key={item.label}
                  className="grid grid-cols-1 gap-1 border-b border-dashed border-[var(--rule)] py-4 sm:grid-cols-[140px_1fr] sm:gap-[18px]"
                >
                  <span className="pt-[3px] font-mono text-[10px] tracking-[0.28em] text-[var(--ink-muted)] uppercase">
                    {item.label}
                  </span>
                  <span className="text-[14.5px] leading-[1.5] text-[var(--ink)]">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3.5">
              {MAP.ctas.map((cta) => (
                <Link
                  key={cta.text}
                  href={cta.href}
                  className="group inline-flex w-fit items-baseline justify-between gap-3 border-b border-[var(--ink)] py-3.5 pr-6 font-mono text-[11px] tracking-[0.22em] text-[var(--ink)] uppercase no-underline transition-[color,border-color,padding] duration-200 hover:border-[var(--tomato)] hover:pr-8 hover:text-[var(--tomato)]"
                >
                  {cta.text}
                  <span aria-hidden> ↗</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
