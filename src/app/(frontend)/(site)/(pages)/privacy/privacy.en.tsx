import type { BusinessInfo } from "@/constants/business";

interface Props {
  business: BusinessInfo;
}

/**
 * English translation of the Korean Privacy Policy.
 * The Korean version (privacy.ko.tsx) is the legally authoritative text under
 * Korean PIPA. This translation is provided as a courtesy.
 */
export function PrivacyEn({ business }: Props) {
  return (
    <>
      <section>
        <p className="text-[.85em] opacity-60">
          This English version is a translation provided for convenience. The
          Korean version of this policy is the legally authoritative text under
          the Personal Information Protection Act of the Republic of Korea.
        </p>
      </section>

      <section id="who-we-are">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">1. Who We Are</h2>
        <p>
          <strong>{business.legalName}</strong> (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the platform at{" "}
          <strong>{business.domain}</strong>. This Privacy Policy explains how
          we collect, use, and protect your personal information in accordance
          with the Personal Information Protection Act (PIPA) of the Republic of
          Korea.
        </p>
        <p>
          For questions about this policy, contact us at{" "}
          <strong>{business.email}</strong>.
        </p>
      </section>

      <section id="purposes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          2. Purposes of Processing
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            Account registration, identity confirmation, age verification (14+),
            abuse prevention.
          </li>
          <li>
            Service delivery: content access, personalized features, payment,
            and billing.
          </li>
          <li>
            Customer support: identifying inquirers, investigating issues,
            communicating outcomes.
          </li>
          <li>
            Marketing and advertising (only with separate, prior consent): new
            feature announcements, event invitations, demographic-based
            promotion.
          </li>
        </ul>
      </section>

      <section id="items">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          3. Information We Collect
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            <strong>At registration (required):</strong> email, password (stored
            hashed), name, username, age confirmation (14+).
          </li>
          <li>
            <strong>At registration (optional):</strong> profile photo, bio,
            location, external link.
          </li>
          <li>
            <strong>Social sign-in:</strong> email, name, profile image from
            Google or Naver.
          </li>
          <li>
            <strong>Paid services:</strong> payment-method tokens (issued by the
            PG — we do not store full card numbers, CVCs, or bank account
            numbers), payment and refund history.
          </li>
          <li>
            <strong>Automatically collected:</strong> IP address, authentication
            cookies, user agent, access logs, service-usage records.
          </li>
        </ul>
      </section>

      <section id="retention">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">4. Retention</h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            Member data: until account deletion (purged within 90 days
            post-deletion).
          </li>
          <li>
            As required by the Act on Consumer Protection in Electronic
            Commerce:
            <ul className="mt-[.4em] list-disc pl-[1.5em]">
              <li>
                Records of contracts and withdrawal of subscription: 5 years
              </li>
              <li>Records of payment and supply of goods/services: 5 years</li>
              <li>
                Records of consumer complaints or dispute resolution: 3 years
              </li>
            </ul>
          </li>
          <li>
            Access logs (under the Protection of Communications Secrets Act): 3
            months.
          </li>
          <li>
            Marketing-consent records: until withdrawal of consent or account
            deletion.
          </li>
        </ul>
      </section>

      <section id="third-parties">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          5. Disclosure to Third Parties
        </h2>
        <p>
          We do not disclose personal information to third parties except where
          the data subject has consented or where disclosure is permitted by law
          under Article 17 of PIPA.
        </p>
      </section>

      <section id="entrustment">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          6. Processing Entrustment
        </h2>
        <p>
          We entrust the following processors with limited processing tasks:
        </p>
        <div className="mt-[.75em] overflow-x-auto">
          <table className="w-full border-collapse text-[.9em]">
            <thead>
              <tr className="border-b border-foreground/20">
                <th className="py-[.5em] pr-[1em] text-left">Processor</th>
                <th className="py-[.5em] pr-[1em] text-left">Purpose</th>
                <th className="py-[.5em] text-left">Retention</th>
              </tr>
            </thead>
            <tbody className="opacity-80">
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">Google LLC</td>
                <td className="py-[.5em] pr-[1em]">Social sign-in</td>
                <td className="py-[.5em]">Until account deletion</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">NAVER Corp.</td>
                <td className="py-[.5em] pr-[1em]">Social sign-in</td>
                <td className="py-[.5em]">Until account deletion</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">Brevo (Sendinblue SAS)</td>
                <td className="py-[.5em] pr-[1em]">Transactional email</td>
                <td className="py-[.5em]">Until contract termination</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">
                  {business.hostingProvider}
                </td>
                <td className="py-[.5em] pr-[1em]">Hosting / database</td>
                <td className="py-[.5em]">Until contract termination</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">PortOne Co., Ltd.</td>
                <td className="py-[.5em] pr-[1em]">Payment integration</td>
                <td className="py-[.5em]">As required by law</td>
              </tr>
              <tr>
                <td className="py-[.5em] pr-[1em]">TossPayments Co., Ltd.</td>
                <td className="py-[.5em] pr-[1em]">Payment processing</td>
                <td className="py-[.5em]">As required by law</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-[.75em] text-[.9em] opacity-70">
          Some processors are located outside Korea. When entrusting personal
          information abroad we comply with Article 26 of PIPA.
        </p>
      </section>

      <section id="rights">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">7. Your Rights</h2>
        <p>You may at any time request:</p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>Access to the personal data we hold about you.</li>
          <li>Correction of inaccurate data.</li>
          <li>
            Deletion of your data (where not required by law to be retained).
          </li>
          <li>Suspension of processing.</li>
        </ul>
        <p className="mt-[.75em]">
          You may exercise these rights through your account settings, or in
          writing to <strong>{business.privacyOfficerEmail}</strong>.
        </p>
      </section>

      <section id="destruction">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">8. Destruction</h2>
        <p>
          When personal information is no longer needed, we destroy it without
          delay: electronic files are permanently deleted in a non-recoverable
          manner; paper documents are shredded or incinerated.
        </p>
      </section>

      <section id="security">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          9. Security Measures
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            Administrative: internal management plan; periodic staff training.
          </li>
          <li>
            Technical: one-way password hashing; HTTP-only cookies for session
            tokens; HTTPS (TLS) end-to-end; optional two-factor authentication;
            least-privilege access controls.
          </li>
          <li>Physical: data center access controls.</li>
        </ul>
      </section>

      <section id="cookies">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">10. Cookies</h2>
        <p>
          We use HTTP-only authentication cookies that are essential to the
          service. We do not use advertising or tracking cookies.
        </p>
      </section>

      <section id="officer">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          11. Privacy Officer
        </h2>
        <p>
          {business.privacyOfficerName} —{" "}
          <strong>{business.privacyOfficerEmail}</strong>
        </p>
      </section>

      <section id="remedies">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">12. Remedies</h2>
        <p>
          You may submit complaints to the Personal Information Dispute
          Mediation Committee (kopico.go.kr / 1833-6972) or the Privacy
          Infringement Reporting Center (privacy.kisa.or.kr / 118).
        </p>
      </section>

      <section id="changes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">13. Changes</h2>
        <p>
          We will announce material changes at least 7 days before they take
          effect through site notices.
        </p>
      </section>

      <section id="business">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          14. Business Information
        </h2>
        <p>
          <strong>{business.legalName}</strong>
          <br />
          Representative: {business.representative}
          <br />
          Business Registration Number: {business.registrationNumber}
          <br />
          Mail-Order Business Registration:{" "}
          {business.mailOrderRegistrationNumber}
          <br />
          Address: {business.addressEn}
          <br />
          Email: {business.email}
        </p>
      </section>
    </>
  );
}
