"use client";

import { Link } from "@/components/core/Link/Link";
import { useLocale } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";

const POLICY_VERSION = "2026-04-15";
const COOKIE_NAME = "__rp_consent";
const COOKIE_MAX_AGE_DAYS = 365;

interface ConsentRecord {
  v: string;
  terms: string;
  privacy: string;
  age: boolean;
  marketing: boolean;
  ts: string;
}

function writeConsentCookie(record: ConsentRecord) {
  const value = encodeURIComponent(JSON.stringify(record));
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

interface CopyBlock {
  title: string;
  intro: string;
  selectAll: string;
  age: { label: string; required: string };
  terms: { label: string; required: string; linkLabel: string };
  privacy: { label: string; required: string; linkLabel: string };
  marketing: { label: string; optional: string };
  required: string;
  optional: string;
  cta: string;
  ctaDisabled: string;
  edit: string;
  consented: string;
}

const COPY: Record<"en" | "ko", CopyBlock> = {
  en: {
    title: "Before you sign up",
    intro:
      "Korean privacy law requires us to collect each consent separately. Please review and check the boxes below.",
    selectAll: "Agree to all",
    age: {
      label: "I am 14 years of age or older.",
      required: "Required"
    },
    terms: {
      label: "I have read and agree to the Terms of Service.",
      required: "Required",
      linkLabel: "View Terms"
    },
    privacy: {
      label:
        "I consent to the collection and use of my personal information as described in the Privacy Policy.",
      required: "Required",
      linkLabel: "View Privacy Policy"
    },
    marketing: {
      label:
        "I agree to receive marketing emails and promotional communications.",
      optional: "Optional"
    },
    required: "Required",
    optional: "Optional",
    cta: "Continue",
    ctaDisabled: "Check the required items to continue",
    edit: "Edit consent",
    consented: "Consent recorded. You may now create your account."
  },
  ko: {
    title: "가입하기 전에",
    intro:
      "관련 법령에 따라 각 동의 항목을 개별적으로 받고 있습니다. 아래 내용을 확인하시고 동의 여부를 선택해 주세요.",
    selectAll: "전체 동의",
    age: {
      label: "만 14세 이상입니다.",
      required: "필수"
    },
    terms: {
      label: "이용약관을 읽고 이에 동의합니다.",
      required: "필수",
      linkLabel: "약관 보기"
    },
    privacy: {
      label: "개인정보 수집·이용에 동의합니다. (개인정보처리방침)",
      required: "필수",
      linkLabel: "처리방침 보기"
    },
    marketing: {
      label: "마케팅 정보 및 광고성 정보 수신에 동의합니다.",
      optional: "선택"
    },
    required: "필수",
    optional: "선택",
    cta: "계속",
    ctaDisabled: "필수 항목에 모두 동의해 주세요",
    edit: "동의 다시 하기",
    consented: "동의가 기록되었습니다. 계정을 만들 수 있습니다."
  }
};

interface CheckboxRowProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  badge: { text: string; tone: "required" | "optional" };
  link?: { href: string; label: string };
}

function CheckboxRow({
  id,
  checked,
  onChange,
  label,
  badge,
  link
}: CheckboxRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 py-2 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 border border-border/50 bg-transparent accent-foreground"
      />
      <span className="flex-1 leading-snug">
        <span
          className={`mr-2 font-sans text-[10px] tracking-widest uppercase ${
            badge.tone === "required"
              ? "text-foreground/70"
              : "text-foreground/40"
          }`}
        >
          [{badge.text}]
        </span>
        <span className="text-foreground/80">{label}</span>
        {link ? (
          <>
            {" · "}
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[10px] tracking-widest text-foreground/50 uppercase underline-offset-2 hover:underline"
            >
              {link.label}
            </Link>
          </>
        ) : null}
      </span>
    </label>
  );
}

interface ConsentGateProps {
  children: ReactNode;
}

export function ConsentGate({ children }: ConsentGateProps) {
  const locale = useLocale();
  const copy = COPY[locale === "ko" ? "ko" : "en"];

  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [committed, setCommitted] = useState(false);

  const allRequired = age && terms && privacy;
  const allChecked = age && terms && privacy && marketing;

  const setAll = useCallback((value: boolean) => {
    setAge(value);
    setTerms(value);
    setPrivacy(value);
    setMarketing(value);
  }, []);

  const onCommit = useCallback(() => {
    if (!allRequired) return;
    const now = new Date().toISOString();
    writeConsentCookie({
      v: POLICY_VERSION,
      terms: now,
      privacy: now,
      age,
      marketing,
      ts: now
    });
    setCommitted(true);
  }, [age, allRequired, marketing]);

  const summary = useMemo(() => {
    return [
      copy.age.label,
      copy.terms.label,
      copy.privacy.label,
      marketing ? copy.marketing.label : null
    ]
      .filter((item): item is string => Boolean(item))
      .join(" · ");
  }, [copy, marketing]);

  if (committed) {
    return (
      <div className="flex flex-col gap-6">
        <div className="border border-border/30 bg-card/40 p-4">
          <p className="font-sans text-[10px] tracking-widest text-foreground/50 uppercase">
            {copy.consented}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-foreground/60">
            {summary}
          </p>
          <button
            type="button"
            onClick={() => setCommitted(false)}
            className="mt-3 font-sans text-[10px] tracking-widest text-foreground/50 uppercase underline-offset-2 hover:underline"
          >
            {copy.edit}
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 border border-border/30 bg-card/40 p-5">
      <header>
        <h2 className="text-base font-light tracking-tight text-foreground">
          {copy.title}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-foreground/55">
          {copy.intro}
        </p>
      </header>

      <label className="flex cursor-pointer items-center gap-3 border-b border-border/20 pb-3 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => setAll(e.target.checked)}
          className="size-4 border border-border/50 bg-transparent accent-foreground"
        />
        <span>{copy.selectAll}</span>
      </label>

      <div className="flex flex-col gap-1">
        <CheckboxRow
          id="consent-age"
          checked={age}
          onChange={setAge}
          label={copy.age.label}
          badge={{ text: copy.age.required, tone: "required" }}
        />
        <CheckboxRow
          id="consent-terms"
          checked={terms}
          onChange={setTerms}
          label={copy.terms.label}
          badge={{ text: copy.terms.required, tone: "required" }}
          link={{ href: "/terms", label: copy.terms.linkLabel }}
        />
        <CheckboxRow
          id="consent-privacy"
          checked={privacy}
          onChange={setPrivacy}
          label={copy.privacy.label}
          badge={{ text: copy.privacy.required, tone: "required" }}
          link={{ href: "/privacy", label: copy.privacy.linkLabel }}
        />
        <CheckboxRow
          id="consent-marketing"
          checked={marketing}
          onChange={setMarketing}
          label={copy.marketing.label}
          badge={{ text: copy.marketing.optional, tone: "optional" }}
        />
      </div>

      <button
        type="button"
        onClick={onCommit}
        disabled={!allRequired}
        className="border border-border/40 px-5 py-2.5 font-sans text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
      >
        {allRequired ? copy.cta : copy.ctaDisabled}
      </button>
    </div>
  );
}
