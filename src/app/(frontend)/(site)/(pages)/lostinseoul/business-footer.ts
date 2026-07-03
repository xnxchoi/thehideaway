export type LostBusinessDisclosureLabels = {
  address: string;
  addressLabel: string;
  businessHeading: string;
  businessNameLabel: string;
  businessRegistrationLabel: string;
  domainLabel: string;
  emailLabel: string;
  legalName: string;
  mailOrderPending: string;
  mailOrderRegistrationLabel: string;
  phoneLabel: string;
  privacyOfficerLabel: string;
  representativeLabel: string;
  representativeName: string;
};

export type LostBusinessDisclosureIdentifiers = {
  businessRegistrationNumber: string;
  domain: string;
  email: string;
  mailOrderRegistrationNumber: string;
  phone: string;
  privacyOfficerEmail: string;
  privacyOfficerName: string;
};

export type LostBusinessDisclosureItem = {
  href?: string;
  label: string;
  value: string;
};

export type LostBusinessDisclosure = {
  heading: string;
  items: LostBusinessDisclosureItem[];
};

const withFallback = (value: string, fallback: string) => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
};

export function getLostBusinessDisclosure(
  labels: LostBusinessDisclosureLabels,
  identifiers: LostBusinessDisclosureIdentifiers
): LostBusinessDisclosure {
  return {
    heading: labels.businessHeading,
    items: [
      {
        label: labels.businessNameLabel,
        value: labels.legalName
      },
      {
        label: labels.representativeLabel,
        value: labels.representativeName
      },
      {
        label: labels.businessRegistrationLabel,
        value: withFallback(
          identifiers.businessRegistrationNumber,
          labels.mailOrderPending
        )
      },
      {
        label: labels.mailOrderRegistrationLabel,
        value: withFallback(
          identifiers.mailOrderRegistrationNumber,
          labels.mailOrderPending
        )
      },
      {
        label: labels.addressLabel,
        value: labels.address
      },
      {
        label: labels.phoneLabel,
        value: identifiers.phone
      },
      {
        href: `mailto:${identifiers.email}`,
        label: labels.emailLabel,
        value: identifiers.email
      },
      {
        href: `https://${identifiers.domain}`,
        label: labels.domainLabel,
        value: identifiers.domain
      },
      {
        href: `mailto:${identifiers.privacyOfficerEmail}`,
        label: labels.privacyOfficerLabel,
        value: `${identifiers.privacyOfficerName} - ${identifiers.privacyOfficerEmail}`
      }
    ]
  };
}
