import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function LostPaymentSuccessPage({ searchParams }: Props) {
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  return (
    <RPage slug={["lostinseoul", "payment", "success"]} type="pages">
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--fg)]">
        <section className="max-w-xl text-center">
          <p className="font-mono text-[11px] tracking-[0.22em] text-[oklch(from_var(--fg)_l_c_h_/_0.6)] uppercase">
            {t("successEyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-6xl font-bold tracking-tight">
            {t("successTitle")}
          </h1>
          {order ? (
            <p className="mt-5 font-mono text-xs text-[oklch(from_var(--fg)_l_c_h_/_0.65)]">
              {order}
            </p>
          ) : null}
          <Link
            className="mt-8 inline-flex min-h-12 items-center bg-[var(--fg)] px-6 text-sm font-medium text-[var(--bg)]"
            href="/lostinseoul"
          >
            {t("continue")}
          </Link>
        </section>
      </main>
    </RPage>
  );
}
