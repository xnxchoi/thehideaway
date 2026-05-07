"use client";

/**
 * @dev-only — Renders nothing in production. Calls butlerLoginAction.
 */

import { errorToast } from "@/components/ui/sonner";
import { useTransitionRouter } from "next-transition-router";
import { useTransition } from "react";
import { butlerLoginAction } from "./butlerLogin.action";

interface DevButlerButtonProps {
  /** server-evaluated availability flag */
  enabled: boolean;
  /** server-evaluated reason when disabled (only for label rendering) */
  reason?: string | null;
}

export function DevButlerButton({ enabled, reason }: DevButlerButtonProps) {
  const router = useTransitionRouter();
  const [pending, start] = useTransition();

  const onClick = () => {
    start(async () => {
      const res = await butlerLoginAction();
      if (!res.ok) {
        errorToast(res.error ?? "Couldn't sign in as Butler.");
        return;
      }
      router.push("/me/settings/profile");
      router.refresh();
    });
  };

  return (
    <div className="z-[120] flex w-full max-w-[384px] flex-col items-stretch gap-2 self-center">
      <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] text-foreground/40 uppercase">
        <span className="h-px flex-1 bg-foreground/15" />
        <span>dev only</span>
        <span className="h-px flex-1 bg-foreground/15" />
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={!enabled || pending}
        className="border border-dashed border-foreground/30 bg-foreground/[0.02] px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground/75 uppercase transition-colors hover:border-foreground/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending
          ? "Summoning butler…"
          : enabled
            ? "Sign in as Butler"
            : (reason ?? "Butler unavailable")}
      </button>
      <p className="text-center font-mono text-[9px] tracking-wide text-foreground/30">
        Local development bypass. Never visible in production builds.
      </p>
    </div>
  );
}
