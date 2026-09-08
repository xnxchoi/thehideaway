"use client";

/**
 * @dev-only — Clickable panel for every public auth branch that is blocked
 * locally. Production builds must not mount this. Delete the lab folder and
 * the AuthShell import to remove it.
 */

import { useIsHydrated } from "@/lib/auth/useIsHydrated";
import { useEffect, useRef, useState, useTransition } from "react";
import { runAuthLabAction } from "./actions";
import {
  AUTH_LAB_CASES,
  AUTH_LAB_CLIENT_ACTIONS,
  type AuthLabAction
} from "./cases";
import type { AuthLabResult } from "./result";

const RESULT_KEY = "dev-auth-lab-result";

const CONSENT_COOKIE = "__rp_consent";
const CONSENT_VERSION = "2026-04-15";

function writeConsentCookie() {
  const now = new Date().toISOString();
  const value = encodeURIComponent(
    JSON.stringify({
      v: CONSENT_VERSION,
      terms: now,
      privacy: now,
      age: true,
      marketing: false,
      ts: now
    })
  );
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
}

function applyClientAction(action: AuthLabAction): AuthLabResult {
  if (action === "skipConsent") {
    writeConsentCookie();
    return {
      ok: true,
      href: "/sign-up",
      assign: true,
      note: "Consent cookie written. Sign-up form should skip the gate."
    };
  }
  if (action === "openInvalidReset") {
    return {
      ok: true,
      href: "/reset-password?token=lab-invalid",
      assign: true
    };
  }
  if (action === "openInvalidInvitation") {
    return {
      ok: true,
      href: "/accept-invitation/00000000-0000-0000-0000-000000000000",
      assign: true
    };
  }
  return { ok: false, error: "Not a client action." };
}

function persistResult(result: AuthLabResult) {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

function applyResult(result: AuthLabResult) {
  persistResult(result);
  if (result.assign && result.href) {
    window.location.assign(result.href);
  }
}

export function DevAuthLab() {
  const isHydrated = useIsHydrated();
  const [pending, start] = useTransition();
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState<AuthLabResult | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AuthLabResult;
      setResult(parsed);
      if ((parsed.secret || parsed.fill) && detailsRef.current) {
        detailsRef.current.open = true;
      }
    } catch {
      sessionStorage.removeItem(RESULT_KEY);
    }
  }, []);

  const run = (action: AuthLabAction | null, id: string) => {
    start(async () => {
      setActive(id);
      if (!action) {
        const next: AuthLabResult = {
          ok: true,
          href: "/sign-in",
          assign: true,
          note: "Submit any unknown email and password on the sign-in form."
        };
        setResult(next);
        applyResult(next);
        return;
      }
      if (AUTH_LAB_CLIENT_ACTIONS.has(action)) {
        const next = applyClientAction(action);
        setResult(next);
        applyResult(next);
        return;
      }
      const next = await runAuthLabAction(action);
      setResult(next);
      if (next.ok) applyResult(next);
    });
  };

  if (process.env.NODE_ENV === "production") return null;

  return (
    <details
      ref={detailsRef}
      className="z-[120] w-full self-center rounded-md border border-dashed border-foreground/30 bg-foreground/[0.02] px-3 py-2"
      data-auth-lab="true"
      data-auth-ready={isHydrated ? "true" : "false"}
    >
      <summary className="cursor-pointer font-sans text-[10px] tracking-[0.22em] text-foreground/55 uppercase">
        Auth lab
      </summary>
      <p className="mt-2 font-sans text-[10px] leading-relaxed text-foreground/45">
        Dev only. Prepares the blocked auth branches so you can exercise the
        real forms. Delete <code>src/lib/auth/dev/lab</code> to remove.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {AUTH_LAB_CASES.map((row) => (
          <button
            key={row.id}
            type="button"
            disabled={pending || !isHydrated}
            onClick={() => run(row.action, row.id)}
            className="border border-dashed border-foreground/25 px-2 py-2 text-left font-sans text-[11px] text-foreground/80 transition-colors hover:border-foreground/55 hover:text-foreground disabled:opacity-40"
          >
            <span className="block font-medium">
              {pending && active === row.id ? "Working…" : row.label}
            </span>
            {row.blocker ? (
              <span className="mt-0.5 block text-[10px] leading-snug text-foreground/40">
                {row.blocker}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !isHydrated}
          onClick={() => run("currentTotp", "currentTotp")}
          className="border border-dashed border-foreground/25 px-2 py-1 font-sans text-[10px] tracking-wide text-foreground/70 uppercase"
        >
          Current TOTP
        </button>
        <button
          type="button"
          disabled={pending || !isHydrated}
          onClick={() => run("revealLastOtp", "revealLastOtp")}
          className="border border-dashed border-foreground/25 px-2 py-1 font-sans text-[10px] tracking-wide text-foreground/70 uppercase"
        >
          Reveal last email OTP
        </button>
      </div>
      {result ? (
        <div className="mt-3 space-y-1 font-sans text-[11px] text-foreground/70">
          {result.ok ? null : (
            <p className="text-red-400">{result.error ?? "Failed."}</p>
          )}
          {result.note ? <p>{result.note}</p> : null}
          {result.href ? (
            <p>
              <a className="underline underline-offset-2" href={result.href}>
                {result.href}
              </a>
            </p>
          ) : null}
          {result.secret ? (
            <p>
              Code{" "}
              <code className="rounded bg-foreground/10 px-1 tracking-[0.2em]">
                {result.secret}
              </code>
            </p>
          ) : null}
          {result.fill
            ? Object.entries(result.fill).map(([key, value]) => (
                <p key={key}>
                  <span className="text-foreground/40">{key}</span>{" "}
                  <code className="break-all">{value}</code>
                </p>
              ))
            : null}
        </div>
      ) : null}
    </details>
  );
}
