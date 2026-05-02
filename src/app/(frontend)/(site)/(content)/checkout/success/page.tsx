import { Link } from "@/components/core/Link/Link";
import s from "@/components/sections/Pricing/Pricing.module.scss";
import { RPage } from "@/components/UX/Transition";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ sub?: string; pending?: string }>;

export default async function CheckoutSuccess(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const isPending = sp.pending === "1";
  return (
    <RPage className={s.pricingShell} type="pages" slug={[]}>
      <section
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "160px 24px 100px",
          textAlign: "center"
        }}
      >
        <p className={s.eyebrow} style={{ marginBottom: 12 }}>
          {isPending ? "Awaiting confirmation" : "Welcome"}
        </p>
        <h1
          className={s.gradientTitle}
          style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 300,
            margin: "0 0 22px"
          }}
        >
          {isPending ? "We'll be in touch." : "You're in."}
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
          {isPending
            ? "Your subscription is queued. We'll email instructions for bank transfer (or pickup if cash). Access activates the moment we confirm receipt."
            : "Your subscription is active. Member-locked essays are open. Drop notifications on the way."}
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center"
          }}
        >
          <Link href="/" className={s.cta} prefetch={false}>
            To the front
          </Link>
          <Link href="/me" className={s.cta} prefetch={false}>
            Your account
          </Link>
        </div>
      </section>
    </RPage>
  );
}
