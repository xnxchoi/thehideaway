"use client";

import { useTranslations } from "next-intl";

export function CartMutationFeedback({
  unconfirmed
}: {
  unconfirmed: boolean;
}) {
  const t = useTranslations("LOSTINSEOUL.cart");
  if (!unconfirmed) return null;
  return (
    <div className="grid gap-2 py-3">
      <p role="alert">{t("updateUnconfirmed")}</p>
      <button
        type="button"
        className="min-h-11 justify-self-start border border-current px-3 py-2"
        onClick={() => window.location.reload()}
      >
        {t("reload")}
      </button>
    </div>
  );
}
