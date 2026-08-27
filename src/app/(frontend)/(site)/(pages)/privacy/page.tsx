import { DocsShell } from "@/components/core/Docs/DocsShell";
import { RPage } from "@/components/UX/Transition";
import { BUSINESS } from "@/constants/business";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PrivacyEn } from "./privacy.en";
import { PrivacyKo } from "./privacy.ko";
import { POLICY_LAST_UPDATED } from "../../../../../constants/policies";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy — The Hideaway",
  description:
    "How The Hideaway collects, uses, and protects your personal information."
};

const TOC_KO = [
  { id: "purposes", label: "처리목적" },
  { id: "items", label: "처리 항목" },
  { id: "retention", label: "보유기간" },
  { id: "third-parties", label: "제3자 제공" },
  { id: "entrustment", label: "처리 위탁" },
  { id: "rights", label: "정보주체의 권리" },
  { id: "destruction", label: "파기" },
  { id: "security", label: "안전성 확보조치" },
  { id: "cookies", label: "자동수집장치" },
  { id: "officer", label: "개인정보보호책임자" },
  { id: "remedies", label: "권익침해 구제" },
  { id: "changes", label: "변경" },
  { id: "business", label: "사업자 정보" }
];

const TOC_EN = [
  { id: "who-we-are", label: "Who We Are" },
  { id: "purposes", label: "Purposes of Processing" },
  { id: "items", label: "Information We Collect" },
  { id: "retention", label: "Retention" },
  { id: "third-parties", label: "Disclosure to Third Parties" },
  { id: "entrustment", label: "Processing Entrustment" },
  { id: "rights", label: "Your Rights" },
  { id: "destruction", label: "Destruction" },
  { id: "security", label: "Security Measures" },
  { id: "cookies", label: "Cookies" },
  { id: "officer", label: "Privacy Officer" },
  { id: "remedies", label: "Remedies" },
  { id: "changes", label: "Changes" },
  { id: "business", label: "Business Information" }
];

export default function PrivacyPage() {
  return (
    <RPage type="pages" slug={["privacy"]}>
      <Suspense>
        <PrivacyBody />
      </Suspense>
    </RPage>
  );
}

async function PrivacyBody() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return (
    <DocsShell
      eyebrow={isKo ? "법적 고지" : "Legal"}
      title={isKo ? "개인정보처리방침" : "Privacy Policy"}
      lastUpdatedLabel={isKo ? "최종 개정: " : "Last updated: "}
      lastUpdated={POLICY_LAST_UPDATED}
      toc={isKo ? TOC_KO : TOC_EN}
      tocLabel={isKo ? "목차" : "Contents"}
      relatedLabel={isKo ? "관련 문서" : "Related"}
      related={[
        { href: "/terms", label: isKo ? "이용약관" : "Terms of Service" },
        { href: "/refund", label: isKo ? "취소·환불 정책" : "Refund Policy" }
      ]}
    >
      {isKo ? (
        <PrivacyKo business={BUSINESS} />
      ) : (
        <PrivacyEn business={BUSINESS} />
      )}
    </DocsShell>
  );
}
