import { Link } from "@/components/core/Link/Link";
import s from "./Pricing.module.scss";

const MAILTO =
  "mailto:concierge@hideawayseoul.com?subject=Cofounder%20application";

/**
 * CofounderApply — the deliberately under-invested 100vh tease.
 *
 * Cofounder is invite-only, by application. The marketing posture is to
 * make people curious, not to sell them. So this section is monolithic:
 * eyebrow, one short heading, one CTA. No subtitle. No benefit list. No
 * price. No seat count. The under-investment IS the design.
 *
 * If the user later wants a real `/apply/cofounder` route or a contact
 * form, swap the Link href for the route — the surrounding section
 * doesn't change.
 */
export function CofounderApply() {
  return (
    <section aria-labelledby="cofounder-apply" className={s.cofounderApply}>
      <p className={s.eyebrow}>Apply</p>
      <h2 id="cofounder-apply" className={s.cofounderTitle}>
        You really wanna know?
      </h2>
      <Link href={MAILTO} className={s.cofounderCta} prefetch={false}>
        Write to us
      </Link>
    </section>
  );
}
