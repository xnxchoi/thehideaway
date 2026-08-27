import { DocsShell } from "@/components/core/Docs/DocsShell";
import { RPage } from "@/components/UX/Transition";
import { BUSINESS } from "@/constants/business";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { TermsEn } from "./terms.en";
import { TermsKo } from "./terms.ko";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Terms of Service — The Hideaway",
  description: "Terms and conditions for using The Hideaway platform."
};

export const TERMS_LAST_UPDATED = "2026-04-15";

const TOC_KO = [
  { id: "purpose", label: "목적" },
  { id: "definitions", label: "정의" },
  { id: "amendment", label: "약관의 게시·개정" },
  { id: "formation", label: "이용계약의 성립" },
  { id: "obligations", label: "회원의 의무" },
  { id: "content", label: "콘텐츠" },
  { id: "payment", label: "유료서비스·결제" },
  { id: "withdrawal", label: "청약철회·환불" },
  { id: "termination", label: "탈퇴·자격상실" },
  { id: "service", label: "서비스의 제공·변경" },
  { id: "liability", label: "면책·책임" },
  { id: "disputes", label: "분쟁해결" },
  { id: "business", label: "사업자 정보" }
];

const TOC_EN = [
  { id: "purpose", label: "Purpose" },
  { id: "definitions", label: "Definitions" },
  { id: "amendment", label: "Posting and Amendment" },
  { id: "formation", label: "Formation" },
  { id: "obligations", label: "Member Obligations" },
  { id: "content", label: "Content" },
  { id: "payment", label: "Paid Services and Payment" },
  { id: "withdrawal", label: "Withdrawal and Refunds" },
  { id: "termination", label: "Termination" },
  { id: "service", label: "Service Changes" },
  { id: "liability", label: "Disclaimer" },
  { id: "disputes", label: "Governing Law" },
  { id: "business", label: "Business Information" }
];

export default function TermsPage() {
  return (
    <RPage type="pages" slug={["terms"]}>
      <Suspense>
        <TermsBody />
      </Suspense>
    </RPage>
  );
}

async function TermsBody() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return (
    <DocsShell
      eyebrow={isKo ? "법적 고지" : "Legal"}
      title={isKo ? "이용약관" : "Terms of Service"}
      lastUpdatedLabel={isKo ? "최종 개정: " : "Last updated: "}
      lastUpdated={TERMS_LAST_UPDATED}
      toc={isKo ? TOC_KO : TOC_EN}
      tocLabel={isKo ? "목차" : "Contents"}
      relatedLabel={isKo ? "관련 문서" : "Related"}
      related={[
        {
          href: "/privacy",
          label: isKo ? "개인정보처리방침" : "Privacy Policy"
        },
        { href: "/refund", label: isKo ? "취소·환불 정책" : "Refund Policy" }
      ]}
    >
      {isKo ? <TermsKo business={BUSINESS} /> : <TermsEn business={BUSINESS} />}
    </DocsShell>
  );
}
