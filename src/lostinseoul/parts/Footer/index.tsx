"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/components/core/Link/Link";
import { BUSINESS } from "@/constants/business";
import { LostFooterWordmark } from "@lostinseoul/parts/Footer/footer-wordmark";
import { getLostBusinessDisclosure } from "@lostinseoul/parts/Footer/business-footer";

function publicEnv(key: string, fallback: string) {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export function Footer() {
  const t = useTranslations("LOSTINSEOUL");
  const contactEmail = publicEnv(
    "NEXT_PUBLIC_LOSTINSEOUL_CONTACT_EMAIL",
    "contact@lostinseoul.com"
  );
  const disclosure = getLostBusinessDisclosure(
    {
      address: t("footer.business.address"),
      addressLabel: t("footer.business.addressLabel"),
      businessHeading: t("footer.business.heading"),
      businessNameLabel: t("footer.business.businessNameLabel"),
      businessRegistrationLabel: t("footer.business.businessRegistrationLabel"),
      domainLabel: t("footer.business.domainLabel"),
      emailLabel: t("footer.business.emailLabel"),
      legalName: t("footer.business.legalName"),
      phoneLabel: t("footer.business.phoneLabel"),
      privacyOfficerLabel: t("footer.business.privacyOfficerLabel"),
      representativeLabel: t("footer.business.representativeLabel"),
      representativeName: t("footer.business.representativeName")
    },
    {
      businessRegistrationNumber: BUSINESS.registrationNumber,
      domain: "lostinseoul.com",
      email: contactEmail,
      phone: BUSINESS.phone,
      privacyOfficerEmail: publicEnv(
        "NEXT_PUBLIC_LOSTINSEOUL_PRIVACY_EMAIL",
        contactEmail
      ),
      privacyOfficerName: publicEnv(
        "NEXT_PUBLIC_LOSTINSEOUL_PRIVACY_OFFICER",
        t("footer.business.privacyOfficerName")
      )
    }
  );

  return (
    <footer className="lost-footer relative bg-background text-foreground">
      <div className="relative z-2 px-4 pt-14 md:px-14 md:pt-16">
        <nav
          aria-label={t("footer.info")}
          className="border-b border-foreground/20 pb-5 md:pb-6"
        >
          <h3 className="sr-only">{t("footer.info")}</h3>
          <ul className="flex flex-wrap justify-end gap-x-7 gap-y-1 md:gap-x-9">
            <li>
              <Link className="lost-footer-link" href="/lostinseoul">
                {t("nav.shop")}
              </Link>
            </li>
            <li>
              <Link className="lost-footer-link" href="/lostinseoul#products">
                {t("nav.archive")}
              </Link>
            </li>
            <li>
              <Link className="lost-footer-link" href="/lostinseoul/privacy">
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link className="lost-footer-link" href="/lostinseoul/terms">
                {t("footer.terms")}
              </Link>
            </li>
            <li>
              <Link className="lost-footer-link" href="/lostinseoul/refund">
                {t("footer.returns")}
              </Link>
            </li>
            <li>
              <Link
                className="lost-footer-link"
                href={`mailto:${contactEmail}`}
              >
                {t("footer.contact")}
              </Link>
            </li>
          </ul>
        </nav>
        <section
          aria-labelledby="lost-footer-business"
          className="grid gap-y-8 border-b border-foreground/20 py-8 md:grid-cols-12 md:gap-5 md:py-10"
          data-lost-footer-registry
        >
          <div className="flex flex-col justify-between gap-8 md:col-span-3">
            <h3
              className="font-sans text-[1rem] leading-none font-medium tracking-[0.16em] text-foreground/70 uppercase"
              id="lost-footer-business"
            >
              {disclosure.heading}
            </h3>
            <p className="font-sans text-small leading-none tracking-[0.1em] text-foreground/60 uppercase">
              {t("footer.copyright")}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 text-[1.15rem] leading-snug md:col-span-9 md:gap-x-8 xl:grid-cols-3">
            {disclosure.items.map((item) => (
              <div
                className="min-w-0 nth-4:col-span-2 xl:nth-4:col-span-1"
                key={item.label}
              >
                <dt className="font-sans text-small leading-tight font-medium tracking-[0.11em] text-foreground/60 uppercase">
                  {item.label}
                </dt>
                <dd className="mt-2 wrap-break-word text-foreground/80">
                  {item.href ? (
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={item.href}
                    >
                      {item.value}
                    </Link>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <div
        className="relative z-2 overflow-hidden px-1 pt-7 pb-4 md:px-3 md:pt-10 md:pb-6"
        data-lost-footer-wordmark
      >
        <LostFooterWordmark />
      </div>
    </footer>
  );
}
