import { LegalShell } from "@/components/core/LegalShell/LegalShell";
import { RPage } from "@/components/UX/Transition";
import { BUSINESS } from "@/constants/business";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Refund Policy — The Hideaway",
  description:
    "Cancellation, withdrawal, and refund policy for paid services and event tickets."
};

const REFUND_LAST_UPDATED = "2026-04-15";

const TOC_KO = [
  { id: "withdrawal", label: "청약철회 일반원칙" },
  { id: "memberships", label: "멤버십·구독" },
  { id: "tickets", label: "이벤트 티켓" },
  { id: "process", label: "환불 절차" },
  { id: "disputes", label: "분쟁해결" }
];

const TOC_EN = [
  { id: "withdrawal", label: "Right of Withdrawal" },
  { id: "memberships", label: "Memberships" },
  { id: "tickets", label: "Event Tickets" },
  { id: "process", label: "Refund Process" },
  { id: "disputes", label: "Disputes" }
];

export default async function RefundPage() {
  const locale = await getLocale();
  const isKo = locale === "ko";

  return (
    <RPage type="pages" slug={["refund"]}>
      <LegalShell
        eyebrow={isKo ? "법적 고지" : "Legal"}
        title={isKo ? "취소·환불 정책" : "Refund Policy"}
        lastUpdatedLabel={isKo ? "최종 개정: " : "Last updated: "}
        lastUpdated={REFUND_LAST_UPDATED}
        toc={isKo ? TOC_KO : TOC_EN}
        tocLabel={isKo ? "목차" : "Contents"}
        relatedLabel={isKo ? "관련 문서" : "Related"}
        related={[
          { href: "/terms", label: isKo ? "이용약관" : "Terms of Service" },
          {
            href: "/privacy",
            label: isKo ? "개인정보처리방침" : "Privacy Policy"
          }
        ]}
      >
        {isKo ? <RefundKo /> : <RefundEn />}
      </LegalShell>
    </RPage>
  );
}

function RefundKo() {
  return (
    <>
      <section>
        <p>
          이 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」(이하
          &ldquo;전자상거래법&rdquo;) 및 관련 법령에 따라 작성되었으며,
          {` ${BUSINESS.legalNameKo}`}이 운영하는 서비스에서의 청약철회, 취소,
          환불에 관한 사항을 정합니다.
        </p>
      </section>

      <section id="withdrawal">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제1조 청약철회의 일반원칙
        </h2>
        <p>
          회원은 결제완료일로부터 7일 이내에 청약을 철회할 수 있습니다. 단, 다음
          각 호의 경우 청약철회가 제한될 수 있습니다.
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>회원의 책임 있는 사유로 콘텐츠가 멸실 또는 훼손된 경우</li>
          <li>회원이 콘텐츠를 사용 또는 일부 소비한 경우</li>
          <li>
            디지털 콘텐츠의 제공이 개시된 부분 — 단, 가분적인 콘텐츠로 구성된
            경우 제공이 개시되지 아니한 부분에 대해서는 그러하지 아니합니다.
          </li>
        </ul>
      </section>

      <section id="memberships">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제2조 멤버십·구독 서비스
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            결제일로부터 7일 이내, 콘텐츠 이용을 시작하지 않은 경우 전액 환불.
          </li>
          <li>
            이용을 시작한 경우, 사용기간에 해당하는 금액을 일할 계산하여 차감 후
            잔액 환불.
          </li>
          <li>
            자동갱신 구독은 다음 결제일 24시간 이전에 해지를 신청해야 다음 주기
            결제가 청구되지 않습니다. 이미 결제된 주기에 대한 환불은 위 기준에
            따릅니다.
          </li>
        </ul>
      </section>

      <section id="tickets">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제3조 이벤트 티켓
        </h2>
        <p>
          이벤트 티켓의 경우 행사일로부터의 잔여기간을 기준으로 다음과 같이
          환불합니다. 이 기준은 회사의 일반 환불기준이며, 개별 이벤트 페이지에
          별도 명시된 환불기준이 있는 경우 해당 기준을 우선 적용합니다.
        </p>
        <div className="mt-[.75em] overflow-x-auto">
          <table className="w-full border-collapse text-[.9em]">
            <thead>
              <tr className="border-b border-foreground/20">
                <th className="py-[.5em] pr-[1em] text-left">
                  행사일까지 잔여기간
                </th>
                <th className="py-[.5em] text-left">환불액</th>
              </tr>
            </thead>
            <tbody className="opacity-80">
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">10일 이상</td>
                <td className="py-[.5em]">100% 환불</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">7일 ~ 10일 미만</td>
                <td className="py-[.5em]">90% 환불</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">3일 ~ 7일 미만</td>
                <td className="py-[.5em]">70% 환불</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">1일 ~ 3일 미만</td>
                <td className="py-[.5em]">50% 환불</td>
              </tr>
              <tr>
                <td className="py-[.5em] pr-[1em]">행사일 당일 또는 이후</td>
                <td className="py-[.5em]">환불 불가</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-[.75em]">
          행사가 회사의 사정으로 취소된 경우에는 잔여기간과 무관하게 전액
          환불합니다.
        </p>
      </section>

      <section id="process">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          제4조 환불 절차 및 처리기간
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            환불 신청은 계정 설정 메뉴의 결제 내역 또는{" "}
            <strong>{BUSINESS.email}</strong>으로 접수합니다.
          </li>
          <li>
            회사는 환불 신청 접수 후 영업일 기준 3일 이내에 결제수단별로 환불을
            처리합니다.
          </li>
          <li>
            신용카드: 결제 취소 처리. 카드사 정책에 따라 환급까지 영업일 기준
            5–7일 소요될 수 있습니다.
          </li>
          <li>
            가상계좌·계좌이체: 회원이 제공한 환불계좌로 입금 처리. 회원이
            환불계좌 정보를 제공한 시점부터 영업일 기준 3일 이내.
          </li>
          <li>
            간편결제(네이버페이·카카오페이·토스페이 등): 결제수단의 잔여 또는 원
            결제수단으로 환원.
          </li>
        </ul>
      </section>

      <section id="disputes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">제5조 분쟁해결</h2>
        <p>
          환불에 관한 분쟁이 회원과 회사 간 합의로 해결되지 않을 경우, 회원은
          한국소비자원 또는 시·도에 설치된 소비자상담센터에 분쟁조정을 신청할 수
          있습니다.
        </p>
      </section>
    </>
  );
}

function RefundEn() {
  return (
    <>
      <section>
        <p className="text-[.85em] opacity-60">
          This English version is a translation provided for convenience. The
          Korean version is the legally authoritative text under the Act on
          Consumer Protection in Electronic Commerce of the Republic of Korea.
        </p>
      </section>

      <section id="withdrawal">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          1. General Right of Withdrawal
        </h2>
        <p>
          You may withdraw your subscription within 7 days of payment. The right
          of withdrawal may be limited where:
        </p>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>The content has been damaged or lost due to your fault.</li>
          <li>You have used or partially consumed the content.</li>
          <li>
            Digital content has been delivered and accessed — except for
            separable units that have not yet been delivered.
          </li>
        </ul>
      </section>

      <section id="memberships">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          2. Memberships / Subscriptions
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            Full refund within 7 days of payment if no content has been
            accessed.
          </li>
          <li>
            If access has begun, the prorated value of the used period is
            deducted and the remainder refunded.
          </li>
          <li>
            Auto-renewing subscriptions: cancel at least 24 hours before the
            next billing date to avoid the next charge. Already-billed periods
            are refunded under the rules above.
          </li>
        </ul>
      </section>

      <section id="tickets">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          3. Event Tickets
        </h2>
        <p>
          The default refund schedule for event tickets is below. Where an
          individual event page lists different terms, the event-specific terms
          prevail.
        </p>
        <div className="mt-[.75em] overflow-x-auto">
          <table className="w-full border-collapse text-[.9em]">
            <thead>
              <tr className="border-b border-foreground/20">
                <th className="py-[.5em] pr-[1em] text-left">
                  Time before event
                </th>
                <th className="py-[.5em] text-left">Refund amount</th>
              </tr>
            </thead>
            <tbody className="opacity-80">
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">10+ days</td>
                <td className="py-[.5em]">100%</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">7–10 days</td>
                <td className="py-[.5em]">90%</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">3–7 days</td>
                <td className="py-[.5em]">70%</td>
              </tr>
              <tr className="border-b border-foreground/10">
                <td className="py-[.5em] pr-[1em]">1–3 days</td>
                <td className="py-[.5em]">50%</td>
              </tr>
              <tr>
                <td className="py-[.5em] pr-[1em]">Day of event or later</td>
                <td className="py-[.5em]">No refund</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-[.75em]">
          If we cancel an event, the full amount is refunded regardless of
          timing.
        </p>
      </section>

      <section id="process">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          4. Refund Process and Timing
        </h2>
        <ul className="list-disc space-y-[.4em] pl-[1.5em]">
          <li>
            Submit refund requests through the payment-history menu in your
            account, or by emailing <strong>{BUSINESS.email}</strong>.
          </li>
          <li>
            Refunds are processed within 3 business days of receipt of a valid
            request.
          </li>
          <li>
            Card payments: charge reversed; the issuing bank may take 5–7
            business days to credit.
          </li>
          <li>
            Virtual account / bank transfer: refunded to the account you
            provide; processed within 3 business days of you providing it.
          </li>
          <li>
            Simple-pay (NaverPay, KakaoPay, TossPay, etc.): returned to the
            original payment method.
          </li>
        </ul>
      </section>

      <section id="disputes">
        <h2 className="mb-[.75em] text-[1.4em] font-medium">
          5. Dispute Resolution
        </h2>
        <p>
          If a refund dispute cannot be resolved by agreement, you may seek
          mediation via the Korea Consumer Agency or your local consumer
          counseling center.
        </p>
      </section>
    </>
  );
}
