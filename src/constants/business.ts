/**
 * Business identification — required by 전자상거래법 §13.
 *
 * Values marked TBD must be filled in before the PG (PortOne / TossPayments)
 * goes live. The 통신판매업 신고번호 is obtained from the merchant's 관할 구청.
 *
 * **Locale-bearing display values live in `messages/*.json`, not here.**
 * The `*Ko` / `*En` parallel fields below are scheduled for removal — they
 * predate the next-intl migration and exist only because privacy/terms/
 * refund pages still reference them. Do NOT add new locale-pair fields
 * here. Use `t("LegalFooter.businessName")`, `t("LegalFooter.address")`,
 * `t("LegalFooter.serviceHours")`, `t("LegalFooter.representativeName")`
 * via next-intl instead. See `LegalFooter.tsx` for the canonical shape.
 *
 * Single-locale identifiers (registration numbers, phone, email, domain)
 * remain here — they're language-agnostic and benefit from env override.
 */

export interface BusinessInfo {
  // ─── Single-locale identifiers (language-agnostic) ─────────────────
  readonly registrationNumber: string;
  readonly mailOrderRegistrationNumber: string;
  readonly phone: string;
  readonly email: string;
  readonly privacyOfficerName: string;
  readonly privacyOfficerEmail: string;
  readonly hostingProvider: string;
  readonly domain: string;

  /**
   * @deprecated Use `t("LegalFooter.businessName")`. Kept while
   *   privacy/terms/refund pages migrate to next-intl.
   */
  readonly legalName: string;
  /** @deprecated Use `t("LegalFooter.businessName")`. */
  readonly legalNameKo: string;
  /** @deprecated Use `t("LegalFooter.representativeName")`. */
  readonly representative: string;
  /** @deprecated Use `t("LegalFooter.representativeName")`. */
  readonly representativeKo: string;
  /** @deprecated Use `t("LegalFooter.address")`. */
  readonly addressEn: string;
  /** @deprecated Use `t("LegalFooter.address")`. */
  readonly addressKo: string;
  /** @deprecated Use `t("LegalFooter.serviceHours")`. */
  readonly serviceHours: string;
  /** @deprecated Use `t("LegalFooter.serviceHours")`. */
  readonly serviceHoursKo: string;
}

const env = (key: string, fallback: string): string =>
  process.env[key] && process.env[key].length > 0
    ? (process.env[key] as string)
    : fallback;

export const BUSINESS: BusinessInfo = {
  registrationNumber: env("NEXT_PUBLIC_BIZ_REG_NO", "TBD"),
  mailOrderRegistrationNumber: env("NEXT_PUBLIC_BIZ_MAIL_ORDER_NO", ""),
  phone: env("NEXT_PUBLIC_BIZ_PHONE", "TBD"),
  email: env("NEXT_PUBLIC_BIZ_EMAIL", "concierge@hideawayseoul.com"),
  privacyOfficerName: env("NEXT_PUBLIC_BIZ_PRIVACY_OFFICER", "TBD"),
  privacyOfficerEmail: env(
    "NEXT_PUBLIC_BIZ_PRIVACY_EMAIL",
    "concierge@hideawayseoul.com"
  ),
  hostingProvider: env("NEXT_PUBLIC_BIZ_HOSTING", "ITEasy"),
  domain: env("NEXT_PUBLIC_BIZ_DOMAIN", "hideawayseoul.com"),

  // Deprecated locale-pair fields (see interface JSDoc).
  legalName: env("NEXT_PUBLIC_BIZ_NAME", "Restored Projects"),
  legalNameKo: env("NEXT_PUBLIC_BIZ_NAME_KO", "Restored Projects"),
  representative: env("NEXT_PUBLIC_BIZ_REP", "TBD"),
  representativeKo: env("NEXT_PUBLIC_BIZ_REP_KO", "TBD"),
  addressEn: env(
    "NEXT_PUBLIC_BIZ_ADDR_EN",
    "Olympic-ro 4-gil 15, Songpa-gu, Seoul, Republic of Korea"
  ),
  addressKo: env("NEXT_PUBLIC_BIZ_ADDR_KO", "서울특별시 송파구 올림픽로4길 15"),
  serviceHours: env(
    "NEXT_PUBLIC_BIZ_HOURS",
    "Mon–Fri 10:00–18:00 KST (closed weekends and holidays)"
  ),
  serviceHoursKo: env(
    "NEXT_PUBLIC_BIZ_HOURS_KO",
    "평일 10:00–18:00 (주말 및 공휴일 휴무)"
  )
};
