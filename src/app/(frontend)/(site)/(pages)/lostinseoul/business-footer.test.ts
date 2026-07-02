import { describe, expect, it } from "vitest";
import { getLostBusinessDisclosure } from "./business-footer";

const labels = {
  address: "Olympic-ro 4-gil 15, Songpa-gu, Seoul, Republic of Korea",
  addressLabel: "Address",
  businessHeading: "Business information",
  businessNameLabel: "Business name",
  businessRegistrationLabel: "Business registration",
  domainLabel: "Service URL",
  emailLabel: "Email",
  legalName: "Restored Projects",
  mailOrderPending: "Mail-order registration pending",
  mailOrderRegistrationLabel: "Mail-order registration",
  phoneLabel: "Phone",
  privacyOfficerLabel: "Privacy officer",
  representativeLabel: "Representative",
  representativeName: "Sungyoon Choi"
};

const identifiers = {
  businessRegistrationNumber: "Registration pending",
  domain: "lostinseoul.com",
  email: "concierge@hideawayseoul.com",
  mailOrderRegistrationNumber: "",
  phone: "Email support",
  privacyOfficerEmail: "concierge@hideawayseoul.com",
  privacyOfficerName: "Restored Projects Privacy Desk"
};

describe("getLostBusinessDisclosure", () => {
  it("returns reviewer-visible business information for LOSTINSEOUL", () => {
    const disclosure = getLostBusinessDisclosure(labels, identifiers);

    expect(disclosure.heading).toBe("Business information");
    expect(disclosure.items).toEqual([
      { label: "Business name", value: "Restored Projects" },
      { label: "Representative", value: "Sungyoon Choi" },
      { label: "Business registration", value: "Registration pending" },
      {
        label: "Mail-order registration",
        value: "Mail-order registration pending"
      },
      {
        label: "Address",
        value: "Olympic-ro 4-gil 15, Songpa-gu, Seoul, Republic of Korea"
      },
      { label: "Phone", value: "Email support" },
      {
        href: "mailto:concierge@hideawayseoul.com",
        label: "Email",
        value: "concierge@hideawayseoul.com"
      },
      {
        href: "https://lostinseoul.com",
        label: "Service URL",
        value: "lostinseoul.com"
      },
      {
        href: "mailto:concierge@hideawayseoul.com",
        label: "Privacy officer",
        value: "Restored Projects Privacy Desk - concierge@hideawayseoul.com"
      }
    ]);
    expect(disclosure.items.every((item) => item.value.length > 0)).toBe(true);
  });
});
