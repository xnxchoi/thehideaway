import { Link } from "@/components/core/Link/Link";
import s from "@/components/sections/Pricing/Pricing.module.scss";

export default function CheckoutCanceled() {
  return (
    <main className={s.pricingShell} data-theme="dark">
      <section
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "160px 24px 100px",
          textAlign: "center"
        }}
      >
        <p className={s.eyebrow} style={{ marginBottom: 12 }}>
          No worries
        </p>
        <h1
          className={s.gradientTitle}
          style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 300,
            margin: "0 0 22px"
          }}
        >
          Door's still open.
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--pricing-fg-mute)",
            maxWidth: "44ch",
            margin: "0 auto 36px"
          }}
        >
          Nothing was charged. Pick up where you left off whenever you like.
        </p>
        <Link href="/plans" className={s.cta} prefetch={false}>
          Back to membership
        </Link>
      </section>
    </main>
  );
}
