"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "@/components/core/Link/Link";

import { submitClaim, type ClaimActionState } from "./action";

/**
 * Recipient-side password entry. Server action validates the entered
 * password against the parent order's 48h password, marks the ticket
 * claimed, and renders the success copy when state.ok flips true.
 */
export function ClaimGate({ ticketId }: { ticketId: string }) {
  const t = useTranslations("Event.Rsvp.claim");

  const [state, formAction, pending] = useActionState<
    ClaimActionState,
    FormData
  >(submitClaim, { ok: false });

  if (state.ok) {
    return (
      <div className="mt-10">
        <h2 className="font-wide text-2xl font-light tracking-tight">
          {t("success.title")}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed font-light text-off-white/75">
          {t("success.body")}
        </p>
        <Link
          href="/day-n-night/my"
          className="mt-7 inline-flex border border-off-white/40 px-5 py-2.5 font-sans text-[11px] tracking-widest text-off-white/85 uppercase transition-colors hover:border-off-white hover:text-off-white"
        >
          {t("success.cta")}
        </Link>
      </div>
    );
  }

  const errorKey = state.error;
  const errorMessage = errorKey
    ? errorKey === "expired"
      ? t("errors.expired")
      : errorKey === "alreadyClaimed"
        ? t("errors.alreadyClaimed")
        : errorKey === "emailMismatch"
          ? t("errors.emailMismatch")
          : errorKey === "throttled"
            ? // Throttled re-uses the invalid copy for now — same UX hint
              // ("try again") with the i18n key already in tree.
              t("errors.invalid")
            : errorKey === "authRequired"
              ? t("errors.authRequired")
              : t("errors.invalid")
    : null;

  return (
    <form action={formAction} className="mt-10">
      <input type="hidden" name="ticketId" value={ticketId} />
      <label className="block">
        <span className="sr-only">{t("passwordPlaceholder")}</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="off"
          spellCheck={false}
          maxLength={50}
          placeholder={t("passwordPlaceholder")}
          className="w-full border-b border-off-white/30 bg-transparent pb-2 text-base font-light tracking-tight text-off-white placeholder:text-off-white/30 focus:border-off-white/70 focus:outline-none"
        />
      </label>

      {errorMessage ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 font-sans text-[11px] tracking-widest text-off-white/80 uppercase"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-7 border border-off-white/40 px-5 py-2.5 font-sans text-[11px] tracking-widest text-off-white/85 uppercase transition-colors hover:border-off-white hover:text-off-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
