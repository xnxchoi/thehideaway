import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { FooterTickerCrown } from "@/components/core/FooterTickerCrown/FooterTickerCrown";
import { Link } from "@/components/core/Link/Link";
import { BUSINESS } from "@/constants/business";
import { LocaleSwitch } from "./LocaleSwitch";

type FooterLocale = "ko" | "en";

interface ColophonField {
  label: string;
  value: ReactNode;
}

/**
 * Centered editorial colophon — label/value pairs flow as continuous prose
 * separated by middots. Wraps naturally inside the centered column. Each
 * `label value` pair is held together by `whitespace-nowrap` so line breaks
 * fall between pairs, not within them.
 */
function Colophon({ fields, lang }: { fields: ColophonField[]; lang: string }) {
  return (
    <p
      className="text-[13px] leading-[2.05] [text-wrap:pretty] text-foreground/85"
      lang={lang}
    >
      {fields.map((field, index) => {
        const isLast = index === fields.length - 1;
        return (
          <span key={field.label}>
            <span className="whitespace-nowrap">
              <span className="text-foreground/55">{field.label}</span>{" "}
              <span className="text-foreground">{field.value}</span>
            </span>
            {!isLast ? (
              <span aria-hidden className="mx-2 text-foreground/30">
                ·
              </span>
            ) : null}{" "}
          </span>
        );
      })}
    </p>
  );
}

const KO_FIELD_LABELS = {
  tradeName: "상호",
  representative: "대표자",
  registration: "사업자등록번호",
  mailOrder: "통신판매업신고",
  address: "주소",
  phone: "전화",
  privacyOfficer: "개인정보보호책임자"
} as const;

const EN_FIELD_LABELS = {
  tradeName: "Trade name",
  representative: "Representative",
  registration: "Business Reg. No.",
  mailOrder: "Mail-Order Reg.",
  address: "Address",
  phone: "Phone",
  privacyOfficer: "Privacy Officer"
} as const;

const KO_PENDING = "신고 진행 중";
const EN_PENDING = "Pending application";

/**
 * Substitute the Korean default placeholder when the env-driven value is the
 * raw default. Real registration numbers (digits with hyphens) pass through
 * unchanged in either locale.
 */
function localizeMailOrder(value: string, locale: FooterLocale): string {
  if (locale === "ko") return value;
  return value === KO_PENDING ? EN_PENDING : value;
}

function buildColophonFields(locale: FooterLocale): ColophonField[] {
  const isKo = locale === "ko";
  const labels = isKo ? KO_FIELD_LABELS : EN_FIELD_LABELS;
  return [
    {
      label: labels.tradeName,
      value: isKo ? BUSINESS.legalNameKo : BUSINESS.legalName
    },
    {
      label: labels.representative,
      value: isKo ? BUSINESS.representativeKo : BUSINESS.representative
    },
    { label: labels.registration, value: BUSINESS.registrationNumber },
    {
      label: labels.mailOrder,
      value: localizeMailOrder(BUSINESS.mailOrderRegistrationNumber, locale)
    },
    {
      label: labels.address,
      value: isKo ? BUSINESS.addressKo : BUSINESS.addressEn
    },
    { label: labels.phone, value: BUSINESS.phone },
    {
      label: labels.privacyOfficer,
      value: (
        <>
          {BUSINESS.privacyOfficerName}
          <span aria-hidden className="mx-1.5 text-foreground/40">
            ·
          </span>
          <a
            href={`mailto:${BUSINESS.privacyOfficerEmail}`}
            className="underline-offset-[0.3em] transition-opacity hover:underline hover:opacity-80"
          >
            {BUSINESS.privacyOfficerEmail}
          </a>
        </>
      )
    }
  ];
}

export async function LegalFooter() {
  const rawLocale = await getLocale();
  const locale: FooterLocale = rawLocale === "ko" ? "ko" : "en";
  const isKo = locale === "ko";
  const year = new Date().getFullYear();

  const labels = {
    privacy: isKo ? "개인정보처리방침" : "Privacy",
    terms: isKo ? "이용약관" : "Terms",
    refund: isKo ? "취소·환불" : "Refunds",
    plans: isKo ? "멤버십" : "Membership",
    hours: isKo ? BUSINESS.serviceHoursKo : BUSINESS.serviceHours,
    businessAria: isKo ? "사업자 정보" : "Business information",
    legalNav: isKo ? "법적 고지" : "Legal"
  };

  const colophonFields = buildColophonFields(locale);
  const navLinks = [
    { href: "/privacy", label: labels.privacy },
    { href: "/terms", label: labels.terms },
    { href: "/refund", label: labels.refund },
    { href: "/plans", label: labels.plans }
  ];
  const businessNameDisplay = isKo ? BUSINESS.legalNameKo : BUSINESS.legalName;

  return (
    <footer
      role="contentinfo"
      data-legal-footer
      className="relative z-10 mt-32 border-t border-border/15 bg-background"
    >
      <div className="mx-auto max-w-2xl px-6 py-20 text-center sm:px-10 xl:py-28">
        {/* Nav strip */}
        <nav aria-label={labels.legalNav}>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] font-light tracking-tight">
            {navLinks.map((item, index) => (
              <li key={item.href} className="flex items-center gap-x-5">
                {index > 0 ? (
                  <span aria-hidden className="text-foreground/30">
                    ·
                  </span>
                ) : null}
                <Link
                  href={item.href}
                  className="text-foreground underline decoration-transparent underline-offset-[0.3em] transition-[text-decoration-color] duration-300 hover:decoration-foreground/60"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact line */}
        <p className="mt-6 text-[13px] text-foreground/80">
          <a
            href={`mailto:${BUSINESS.email}`}
            className="underline-offset-[0.3em] transition-opacity hover:underline hover:opacity-80"
          >
            {BUSINESS.email}
          </a>
          <span aria-hidden className="mx-3 text-foreground/30">
            ·
          </span>
          <span className="text-foreground/70">{labels.hours}</span>
        </p>

        {/* Ornament — classical editorial divider; single glyph between two
            hairlines. Replaces a plain UI rule with a typographic mark. */}
        <div
          aria-hidden
          className="mx-auto my-12 flex items-center justify-center gap-4 xl:my-16"
        >
          <span className="h-px w-12 bg-border/40" />
          <span className="text-[10px] leading-none text-foreground/40">◇</span>
          <span className="h-px w-12 bg-border/40" />
        </div>

        {/* 사업자정보 colophon — centered prose flow */}
        <section aria-label={labels.businessAria}>
          <Colophon fields={colophonFields} lang={locale} />
        </section>

        {/* Ornament */}
        <div
          aria-hidden
          className="mx-auto mt-12 mb-10 flex items-center justify-center gap-4 xl:mt-16 xl:mb-12"
        >
          <span className="h-px w-12 bg-border/40" />
          <span className="text-[10px] leading-none text-foreground/40">◇</span>
          <span className="h-px w-12 bg-border/40" />
        </div>

        {/* Bezel-strip motif — three lanes of vertical ticks reading as a
            rotating focus ring viewed edge-on. Crowns the wordmark below. */}
        <div className="mb-3 flex justify-center">
          <FooterTickerCrown />
        </div>

        {/* Brand sign-off — small, single instance, editorial serif */}
        <p
          className="text-2xl font-light tracking-tight text-foreground xl:text-3xl"
          style={{ fontFamily: "var(--font-siegfried), serif" }}
        >
          The Hideaway
        </p>

        {/* Copyright + locale strip */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-foreground/55">
          <span>© {year}</span>
          <span aria-hidden className="text-foreground/30">
            ·
          </span>
          <span lang={locale}>{businessNameDisplay}</span>
          <span aria-hidden className="text-foreground/30">
            ·
          </span>
          <LocaleSwitch />
        </div>
      </div>
    </footer>
  );
}
