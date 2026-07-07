import "server-only";

import { BUSINESS } from "@/constants/business";
import type {
  LostBusinessDisclosureIdentifiers,
  LostBusinessDisclosureLabels
} from "./business-footer";

type LostFooterTranslationKey =
  | "footer.business.address"
  | "footer.business.addressLabel"
  | "footer.business.businessNameLabel"
  | "footer.business.businessRegistrationLabel"
  | "footer.business.domainLabel"
  | "footer.business.emailLabel"
  | "footer.business.heading"
  | "footer.business.legalName"
  | "footer.business.mailOrderPending"
  | "footer.business.mailOrderRegistrationLabel"
  | "footer.business.phoneLabel"
  | "footer.business.privacyOfficerLabel"
  | "footer.business.representativeLabel"
  | "footer.business.representativeName";

type LostFooterTranslator = (key: LostFooterTranslationKey) => string;

export type LostBusinessFooterProps = {
  footerBusinessIdentifiers: LostBusinessDisclosureIdentifiers;
  footerBusinessLabels: LostBusinessDisclosureLabels;
};

const lostEnv = (key: string, fallback: string): string => {
  const value = process.env[key]?.trim();

  return value && value.length > 0 ? value : fallback;
};

export function getLostBusinessFooterProps(
  t: LostFooterTranslator
): LostBusinessFooterProps {
  const contactEmail = lostEnv(
    "NEXT_PUBLIC_LOSTINSEOUL_CONTACT_EMAIL",
    "contact@lostinseoul.com"
  );
  const privacyOfficerEmail = lostEnv(
    "NEXT_PUBLIC_LOSTINSEOUL_PRIVACY_EMAIL",
    contactEmail
  );

  return {
    footerBusinessIdentifiers: {
      businessRegistrationNumber: BUSINESS.registrationNumber,
      domain: "lostinseoul.com",
      email: contactEmail,
      mailOrderRegistrationNumber: BUSINESS.mailOrderRegistrationNumber,
      phone: BUSINESS.phone,
      privacyOfficerEmail,
      privacyOfficerName: lostEnv(
        "NEXT_PUBLIC_LOSTINSEOUL_PRIVACY_OFFICER",
        "LOSTINSEOUL Privacy Desk"
      )
    },
    footerBusinessLabels: {
      address: t("footer.business.address"),
      addressLabel: t("footer.business.addressLabel"),
      businessHeading: t("footer.business.heading"),
      businessNameLabel: t("footer.business.businessNameLabel"),
      businessRegistrationLabel: t("footer.business.businessRegistrationLabel"),
      domainLabel: t("footer.business.domainLabel"),
      emailLabel: t("footer.business.emailLabel"),
      legalName: t("footer.business.legalName"),
      mailOrderPending: t("footer.business.mailOrderPending"),
      mailOrderRegistrationLabel: t(
        "footer.business.mailOrderRegistrationLabel"
      ),
      phoneLabel: t("footer.business.phoneLabel"),
      privacyOfficerLabel: t("footer.business.privacyOfficerLabel"),
      representativeLabel: t("footer.business.representativeLabel"),
      representativeName: t("footer.business.representativeName")
    }
  };
}
