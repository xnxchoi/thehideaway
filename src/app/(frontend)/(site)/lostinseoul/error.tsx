"use client";

import { useTranslations } from "next-intl";
import { RPage } from "@/components/UX/Transition";

export default function StoreError({
  retry
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("LOSTINSEOUL.error");

  return (
    <RPage slug={["lostinseoul"]} theme="dark" type="pages">
      <section className="mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-light">{t("title")}</h1>
        <button
          className="mt-6 border border-current px-4 py-2 text-sm"
          onClick={retry}
          type="button"
        >
          {t("retry")}
        </button>
      </section>
    </RPage>
  );
}
