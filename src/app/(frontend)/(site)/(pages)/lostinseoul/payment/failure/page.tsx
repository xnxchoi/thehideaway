import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";

export default async function LostPaymentFailurePage() {
  const t = await getTranslations("LOSTINSEOUL.payment");
  return (
    <RPage slug={["lostinseoul", "payment", "failure"]} type="pages">
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-6 text-[#161412]">
        <section className="max-w-xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/60">
            {t("failureEyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-6xl font-bold tracking-tight">
            {t("failureTitle")}
          </h1>
          <Link
            className="mt-8 inline-flex min-h-12 items-center bg-black px-6 text-sm font-medium text-[#f5f0e8]"
            href="/lostinseoul/cart"
          >
            {t("retry")}
          </Link>
        </section>
      </main>
    </RPage>
  );
}
