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
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0e8] px-6 text-[#161412]">
        <section className="max-w-xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/60">
            {t("successEyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-6xl font-bold tracking-tight">
            {t("successTitle")}
          </h1>
          {order ? (
            <p className="mt-5 font-mono text-xs text-black/65">{order}</p>
          ) : null}
          <Link
            className="mt-8 inline-flex min-h-12 items-center bg-black px-6 text-sm font-medium text-[#f5f0e8]"
            href="/lostinseoul"
          >
            {t("continue")}
          </Link>
        </section>
      </main>
    </RPage>
  );
}
