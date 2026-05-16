import { Link } from "@/components/core/Link/Link";
import { CLOSING } from "./content";

/**
 * Closing — quiet sign-off. Big italic line, the RSVP CTA, and the
 * host's contact. Athens-26 ends almost mid-thought; copy the
 * understatement.
 */
export function DemimondeClosing() {
  return (
    <section
      className="relative z-[1] border-t border-[oklch(0.78_0.06_75)] bg-[var(--paper-deep)] px-8 py-24 pb-32 max-sm:px-6 max-sm:py-18"
      aria-label="Closing"
    >
      <div className="mx-auto flex max-w-[720px] flex-col gap-5">
        <div className="font-mono text-[11px] tracking-[0.32em] text-[var(--tomato)] uppercase">
          {CLOSING.mark}
        </div>
        <p className="m-0 font-serif text-[clamp(28px,4vw,48px)] leading-[1.12] tracking-[-0.02em] text-balance text-[var(--ink)] italic">
          {CLOSING.line}
        </p>
        <p className="m-0 text-[15px] leading-[1.6] text-[var(--ink-soft)]">
          {CLOSING.meta}
        </p>

        {CLOSING.cta ? (
          <Link
            href={CLOSING.cta.href}
            aria-label={CLOSING.cta.aria}
            className="mt-2 inline-flex w-fit items-baseline gap-2.5 border-b border-[var(--ink)] py-3.5 pr-6 font-mono text-[12px] tracking-[0.22em] text-[var(--ink)] uppercase no-underline transition-colors duration-200 hover:border-[var(--tomato)] hover:text-[var(--tomato)]"
          >
            {CLOSING.cta.text}
            <span aria-hidden> →</span>
          </Link>
        ) : null}

        {CLOSING.hosts ? (
          <p className="m-0 mt-7 border-t border-[var(--rule)] pt-6 text-[13px] leading-[1.6] text-[var(--ink-muted)]">
            <span className="mr-1.5 font-mono text-[10px] tracking-[0.3em] text-[var(--ink-muted)] uppercase">
              {CLOSING.hosts.label}
            </span>{" "}
            {CLOSING.hosts.names}
            {CLOSING.hosts.contact ? (
              <>
                {" · "}
                <Link
                  href={`mailto:${CLOSING.hosts.contact}`}
                  className="text-[var(--tomato)] underline underline-offset-[3px] transition-colors hover:text-[var(--ink)]"
                >
                  {CLOSING.hosts.contact}
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
