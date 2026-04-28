import Link from "next/link";
import type { GateResult } from "./gatePost";

export type PaywallProps = {
  gate: GateResult;
  postTitle: string;
  teaser?: string;
};

const tierCopy: Record<
  "member" | "patron" | "author" | "editor" | "admin",
  { label: string; cta: string; pitch: string }
> = {
  member: {
    label: "Member",
    cta: "Become a Member",
    pitch:
      "All Member-locked essays, highlight & memo, ₩9,000/mo or ₩90,000/yr."
  },
  patron: {
    label: "Patron",
    cta: "Become a Patron",
    pitch:
      "Everything Member, plus drops, events, and the quarterly print. ₩29,000/mo."
  },
  author: {
    label: "Author",
    cta: "Become a Member",
    pitch: "Author access is granted to active Members with editor approval."
  },
  editor: {
    label: "Editor",
    cta: "Contact us",
    pitch: "Editor access is staff-only."
  },
  admin: {
    label: "Admin",
    cta: "Contact us",
    pitch: "Admin access is staff-only."
  }
};

export function Paywall({ gate, postTitle, teaser }: PaywallProps) {
  const requiredKey =
    gate.requiredRole &&
    gate.requiredRole !== "guest" &&
    gate.requiredRole !== "user"
      ? gate.requiredRole
      : "member";
  const copy = tierCopy[requiredKey as keyof typeof tierCopy];
  const needsAuth = gate.reason === "auth-required";

  return (
    <aside
      role="region"
      aria-label="Paywall"
      style={{
        maxWidth: 640,
        margin: "60px auto",
        padding: "44px 36px 40px",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background:
          "linear-gradient(180deg, oklch(0.18 0.008 240) 0%, oklch(0.13 0.008 240) 100%)",
        color: "oklch(0.94 0.005 80)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "oklch(0.7 0.005 240)",
          marginBottom: 14
        }}
      >
        {copy.label} · locked
      </p>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 300,
          letterSpacing: "-0.02em",
          margin: "0 0 12px",
          lineHeight: 1.2
        }}
      >
        {postTitle}
      </h2>
      {teaser ? (
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "oklch(0.7 0.005 240)",
            margin: "0 0 24px"
          }}
        >
          {teaser}
        </p>
      ) : null}
      <p
        style={{
          fontSize: 13,
          color: "oklch(0.7 0.005 240)",
          marginBottom: 24
        }}
      >
        {copy.pitch}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {needsAuth ? (
          <Link
            href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
            style={ctaStyle}
            prefetch={false}
          >
            Sign in
          </Link>
        ) : null}
        <Link href="/plans" style={ctaStyle} prefetch={false}>
          {needsAuth ? "View plans" : copy.cta}
        </Link>
      </div>
    </aside>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 22px",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 6,
  background: "transparent",
  color: "oklch(0.94 0.005 80)",
  fontFamily: "var(--font-mono, ui-monospace, monospace)",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  textDecoration: "none"
};
