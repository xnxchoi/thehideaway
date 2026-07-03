/**
 * Business identification — required by 전자상거래법 §13.
 *
 * Values with pending fallbacks must be replaced with final company details
 * before PG (PortOne / TossPayments) go-live. The 통신판매업 신고번호 is obtained
 * from the merchant's 관할 구청.
 *
 * **Locale-bearing display values live in `messages/*.json`, not here.**
 * The `*Ko` / `*En` parallel fields below are scheduled for removal — they
 * predate the next-intl migration and exist only because privacy/terms/
 * refund pages still reference them. Do NOT add new locale-pair fields
 * here. Use `t("Footer.businessName")`, `t("Footer.address")`,
 * `t("Footer.serviceHours")`, `t("Footer.representativeName")`
 * via next-intl instead. See `Footer.tsx` for the canonical shape.
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
   * @deprecated Use `t("Footer.businessName")`. Kept while
   *   privacy/terms/refund pages migrate to next-intl.
   */
  readonly legalName: string;
  /** @deprecated Use `t("Footer.businessName")`. */
  readonly legalNameKo: string;
  /** @deprecated Use `t("Footer.representativeName")`. */
  readonly representative: string;
  /** @deprecated Use `t("Footer.representativeName")`. */
  readonly representativeKo: string;
  /** @deprecated Use `t("Footer.address")`. */
  readonly addressEn: string;
  /** @deprecated Use `t("Footer.address")`. */
  readonly addressKo: string;
  /** @deprecated Use `t("Footer.serviceHours")`. */
  readonly serviceHours: string;
  /** @deprecated Use `t("Footer.serviceHours")`. */
  readonly serviceHoursKo: string;
}

const env = (key: string, fallback: string): string =>
  process.env[key] && process.env[key].length > 0
    ? (process.env[key] as string)
    : fallback;

export const BUSINESS: BusinessInfo = {
  registrationNumber: env("NEXT_PUBLIC_BIZ_REG_NO", "753-32-01007"),
  mailOrderRegistrationNumber: env("NEXT_PUBLIC_BIZ_MAIL_ORDER_NO", ""),
  // Empty until a real landline is set — PortOne requires a landline and a
  // truthy placeholder would render as a fake number. Empty lets the footer /
  // colophon fall through to their pending / em-dash state.
  phone: env("NEXT_PUBLIC_BIZ_PHONE", ""),
  email: env("NEXT_PUBLIC_BIZ_EMAIL", "concierge@hideawayseoul.com"),
  privacyOfficerName: env(
    "NEXT_PUBLIC_BIZ_PRIVACY_OFFICER",
    "Restored Projects Privacy Desk"
  ),
  privacyOfficerEmail: env(
    "NEXT_PUBLIC_BIZ_PRIVACY_EMAIL",
    "concierge@hideawayseoul.com"
  ),
  hostingProvider: env("NEXT_PUBLIC_BIZ_HOSTING", "ITEasy"),
  domain: env("NEXT_PUBLIC_BIZ_DOMAIN", "hideawayseoul.com"),

  // Deprecated locale-pair fields (see interface JSDoc).
  legalName: env("NEXT_PUBLIC_BIZ_NAME", "Restored Projects"),
  legalNameKo: env("NEXT_PUBLIC_BIZ_NAME_KO", "리스토어드프로젝트"),
  representative: env("NEXT_PUBLIC_BIZ_REP", "Sungyoon Choi"),
  representativeKo: env("NEXT_PUBLIC_BIZ_REP_KO", "최성윤"),
  addressEn: env(
    "NEXT_PUBLIC_BIZ_ADDR_EN",
    "Olympic-ro 4-gil 15, Bldg 7 Unit 705, Songpa-gu, Seoul, Republic of Korea"
  ),
  addressKo: env(
    "NEXT_PUBLIC_BIZ_ADDR_KO",
    "서울특별시 송파구 올림픽로4길 15, 7동 705호(잠실동, 아시아선수촌아파트)"
  ),
  serviceHours: env(
    "NEXT_PUBLIC_BIZ_HOURS",
    "Sat–Sun & holidays 12:00–24:00 KST (closed on weekdays)"
  ),
  serviceHoursKo: env(
    "NEXT_PUBLIC_BIZ_HOURS_KO",
    "주말, 공휴일 12:00–24:00 (주중 휴무)"
  )
};
