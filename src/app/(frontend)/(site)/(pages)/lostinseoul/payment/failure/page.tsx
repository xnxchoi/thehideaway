import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";

export default async function LostPaymentFailurePage() {
  const t = await getTranslations("LOSTINSEOUL.payment");
  return (
    <RPage slug={["lostinseoul", "payment", "failure"]} type="pages">
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--fg)]">
        <section className="max-w-xl text-center">
          <p className="font-mono text-[11px] tracking-[0.22em] text-[oklch(from_var(--fg)_l_c_h_/_0.6)] uppercase">
            {t("failureEyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-6xl font-bold tracking-tight">
            {t("failureTitle")}
          </h1>
          <Link
            className="mt-8 inline-flex min-h-12 items-center bg-[var(--fg)] px-6 text-sm font-medium text-[var(--bg)]"
            href="/lostinseoul/cart"
          >
            {t("retry")}
          </Link>
        </section>
      </main>
    </RPage>
  );
}
