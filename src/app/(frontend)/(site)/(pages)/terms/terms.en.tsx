import { Link } from "@/components/core/Link/Link";
import type { BusinessInfo } from "@/constants/business";

interface Props {
  business: BusinessInfo;
}

/**
 * English translation of the Korean Terms of Service.
 * The Korean version (terms.ko.tsx) is the legally authoritative text.
 */
export function TermsEn({ business }: Props) {
  return (
    <>
      <section>
        <p className="text-[.85em] opacity-60">
          This English version is a translation provided for convenience. The
          Korean version is the legally authoritative text under the laws of the
          Republic of Korea.
        </p>
      </section>

      <section id="purpose">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">1. Purpose</h2>
        <p>
          These Terms govern your use of <strong>{business.domain}</strong> (the
          &ldquo;Service&rdquo;) operated by{" "}
          <strong>{business.legalName}</strong> (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By using the Service you agree to these Terms.
        </p>
      </section>

      <section id="definitions">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">2. Definitions</h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            <strong>Service</strong> — the platform and any related features.
          </li>
          <li>
            <strong>User</strong> — anyone who accesses the Service, member or
            non-member.
          </li>
          <li>
            <strong>Member</strong> — a registered account holder.
          </li>
          <li>
            <strong>Paid Service</strong> — any service offered for a fee,
            including memberships and tickets.
          </li>
        </ul>
      </section>

      <section id="amendment">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          3. Posting and Amendment
        </h2>
        <p>
          We post these Terms in a location accessible from the Service. We may
          amend these Terms within the limits of the Standardized Contracts Act,
          the Act on Consumer Protection in Electronic Commerce, and other
          applicable laws. Material changes are announced at least 7 days before
          they take effect — or 30 days when changes are unfavorable to users.
        </p>
      </section>

      <section id="formation">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          4. Formation of the User Agreement
        </h2>
        <p>
          The user agreement is formed when you accept these Terms, request
          membership, and we accept the request. You must be at least 14 years
          of age.
        </p>
      </section>

      <section id="obligations">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          5. Member Obligations
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>Comply with these Terms and applicable law.</li>
          <li>
            Do not impersonate others or register under another person's
            identity.
          </li>
          <li>
            Do not use the Service for commercial purposes without our written
            consent.
          </li>
          <li>Do not interfere with the stable operation of the Service.</li>
          <li>
            Do not collect, use, or disclose other users' personal data without
            consent.
          </li>
        </ul>
      </section>

      <section id="content">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">6. Content</h2>
        <p>
          You retain ownership of content you submit. You grant us a
          non-exclusive, royalty-free license to use, display, and distribute
          that content for the purpose of operating, exhibiting, and promoting
          the Service.
        </p>
        <p className="mt-[.75em]">
          We may remove content that violates these Terms or applicable law
          without prior notice.
        </p>
      </section>

      <section id="payment">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          7. Paid Services and Payment
        </h2>
        <p>
          A paid-service contract is formed when you confirm the order, complete
          payment, and we accept the request. Payments are processed through a
          payment gateway designated by us. We do not store full card numbers,
          CVCs, or bank account numbers — only non-identifying tokens issued by
          the gateway.
        </p>
      </section>

      <section id="withdrawal">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          8. Withdrawal of Subscription and Refunds
        </h2>
        <p>
          Under the Act on Consumer Protection in Electronic Commerce you may
          withdraw your subscription as follows:
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            <strong>General paid services (memberships):</strong> within 7 days
            of payment. For digital content already accessed, withdrawal may be
            limited.
          </li>
          <li>
            <strong>Event tickets:</strong> withdrawal is available up to a
            period before the event date as specified per event and in our{" "}
            <Link href="/refund" className="underline">
              Refund Policy
            </Link>
            .
          </li>
          <li>
            You may declare withdrawal in writing, by email, or via the refund
            function provided in the Service.
          </li>
        </ul>
        <p className="mt-[.75em]">
          Refunds are processed within 3 business days of receipt of a valid
          withdrawal request, using the original method of payment. For
          virtual-account payments, refunds are processed after you provide a
          destination account.
        </p>
      </section>

      <section id="termination">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">9. Termination</h2>
        <p>
          You may delete your account at any time from your account settings. We
          may suspend or terminate accounts that violate these Terms or
          applicable law, with prior notice where reasonably possible.
        </p>
      </section>

      <section id="service">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          10. Service Provision and Changes
        </h2>
        <p>
          We may modify the Service in whole or in part for operational or
          technical reasons. We may temporarily suspend the Service for
          maintenance, force majeure, or telecommunications outages.
        </p>
      </section>

      <section id="liability">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          11. Disclaimer and Limitation of Liability
        </h2>
        <p>
          We are not liable for failures to perform caused by force majeure or
          by user fault. Where we are liable for breach of these Terms, our
          liability is limited to the amount you paid us in the 12 months
          preceding the claim — except in cases of willful misconduct or gross
          negligence.
        </p>
      </section>

      <section id="disputes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          12. Governing Law and Dispute Resolution
        </h2>
        <p>
          These Terms are governed by the laws of the Republic of Korea.
          Disputes are subject to the courts having jurisdiction under the
          Korean Civil Procedure Act. You may also seek mediation via the Korea
          Consumer Agency or the Fair Trade Commission under Article 13(2) of
          the Act on Consumer Protection in Electronic Commerce.
        </p>
      </section>

      <section id="business">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          13. Business Information and Contact
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
