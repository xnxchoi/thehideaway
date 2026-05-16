import s from "./Demimonde.module.scss";
import { CLOSING } from "./content";

/**
 * Closing — a quiet sign-off. No marquee. Big italic line, the RSVP ask,
 * and the host's contact. Athens-26 ends almost mid-thought; we copy the
 * understatement.
 */
export function DemimondeClosing() {
  return (
    <section className={s.closing} aria-label="Closing">
      <div className={s.closingInner}>
        <div className={s.closingMark}>{CLOSING.mark}</div>
        <p className={s.closingLine}>{CLOSING.line}</p>
        <p className={s.closingMeta}>{CLOSING.meta}</p>

        {CLOSING.cta ? (
          <a
            className={s.closingCta}
            href={CLOSING.cta.href}
            aria-label={CLOSING.cta.aria}
          >
            {CLOSING.cta.text}
            <span aria-hidden> →</span>
          </a>
        ) : null}

        {CLOSING.hosts ? (
          <p className={s.closingHosts}>
            <span className={s.closingHostsLabel}>{CLOSING.hosts.label}</span>{" "}
            {CLOSING.hosts.names}
            {CLOSING.hosts.contact ? (
              <>
                {" · "}
                <a href={`mailto:${CLOSING.hosts.contact}`}>
                  {CLOSING.hosts.contact}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
