"use client";

import { useDeviceInfo } from "@/providers/RP_Pro";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DialogRoot,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useLenis } from "lenis/react";
import { toast } from "sonner";

import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { usePathname } from "next/navigation";
import { useShallow } from "zustand/shallow";

type EscapePlan = {
  href: string | null;
};

const IOS_DIRECT_ESCAPE_APPS = new Set([
  "Threads",
  "Twitter",
  "Telegram",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "TikTok",
  "Facebook Messenger",
  "Google Search App"
]);

const ANDROID_DIRECT_ESCAPE_APPS = new Set([
  "Threads",
  "Twitter",
  "Telegram",
  "Facebook",
  "Instagram",
  "Facebook Messenger"
]);

export function EscapeInAppBrowser() {
  const browser = useDeviceInfo((r) => r.browser);
  const pathname = usePathname();
  if (!browser.inApp) return null;
  return <InAppBrowserEscapeDialog browserName={browser.name} pathname={pathname} />;
}

function InAppBrowserEscapeDialog({
  browserName,
  pathname
}: {
  browserName: string;
  pathname: string;
}) {
  const t = useTranslations("Event.InAppBrowserEscape");
  const name = useRPSession(useShallow((l) => l.name));
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const lenis = useLenis();
  const fallbackUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}${pathname}`;
  const [targetURL, setTargetURL] = useState<string>(() =>
    typeof window === "undefined" ? fallbackUrl : window.location.href
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTargetURL(window.location.href);
  }, [fallbackUrl, pathname]);

  useEffect(() => {
    lenis?.[open ? "stop" : "start"]();
  }, [lenis, open]);

  const os = useDeviceInfo((r) => r.os);
  const browserLabel =
    browserName && browserName !== "Unknown"
      ? browserName
      : t("labels.currentAppFallback");
  const escapePlan = useMemo(
    () => resolveEscapePlan(targetURL, browserName, os.isIOS, os.isAndroid),
    [browserName, os.isAndroid, os.isIOS, targetURL]
  );

  const flashCopied = useCallback(() => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(targetURL);
      flashCopied();
      toast(t("toast.title"), {
        description: t("toast.description")
      });
    } catch {
      // Restrictive in-app browsers can block clipboard; the URL remains visible.
    }
  }, [flashCopied, t, targetURL]);

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-1rem)] overflow-hidden border border-white/10 bg-[linear-gradient(145deg,rgba(12,12,12,0.98),rgba(28,28,28,0.92))] p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)] outline-white/10! sm:max-w-[38rem]">
        <div className="relative overflow-hidden rounded-[inherit]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.12),transparent_32%)]"
          />
          <div className="relative grid gap-6 p-5 sm:gap-7 sm:p-7">
            <DialogHeader className="gap-4 text-left">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55">
                    {t("eyebrow")}
                  </span>
                  <DialogTitle className="max-w-[12ch] font-serif text-3xl leading-[0.98] tracking-[-0.03em] text-white sm:text-[2.8rem]">
                    {t("title")}
                  </DialogTitle>
                </div>
                <span className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-sans text-[10px] tracking-[0.18em] text-white/68 uppercase">
                  {browserLabel}
                </span>
              </div>
              <DialogDescription className="max-w-[34rem] text-sm leading-6 text-white/72 sm:text-[15px]">
                {t("description", {
                  name: name || t("labels.guest"),
                  app: browserLabel
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              {escapePlan.href ? (
                <a
                  href={escapePlan.href}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center justify-between rounded-[1.25rem] border border-white/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] px-5 py-4 text-left no-underline transition-[transform,border-color,background-color] duration-200 hover:-translate-y-px hover:border-white/26"
                >
                  <span className="grid gap-1">
                    <span className="font-sans text-[11px] tracking-[0.22em] text-white/58 uppercase">
                      {t("actions.primaryKicker")}
                    </span>
                    <span className="font-serif text-lg leading-none text-white">
                      {t("actions.primary")}
                    </span>
                  </span>
                  <ExternalLink className="size-4 text-white/70" />
                </a>
              ) : (
                <div className="flex min-h-14 items-center rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-5 py-4">
                  <p className="text-sm leading-6 text-white/62">
                    {t("actions.primaryUnavailable")}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-14 items-center justify-between rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(234,179,8,0.18),rgba(255,255,255,0.06))] px-5 py-4 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-px hover:border-white/22"
              >
                <span className="grid gap-1">
                  <span className="font-sans text-[11px] tracking-[0.22em] text-white/58 uppercase">
                    {t("actions.secondaryKicker")}
                  </span>
                  <span className="font-serif text-lg leading-none text-white">
                    {copied ? t("actions.copied") : t("actions.copy")}
                  </span>
                </span>
                {copied ? (
                  <Check className="size-4 text-white/78" />
                ) : (
                  <Copy className="size-4 text-white/70" />
                )}
              </button>
            </div>

            <div className="grid gap-3 rounded-[1.4rem] border border-white/10 bg-black/25 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1">
                  <p className="font-sans text-[11px] tracking-[0.24em] text-white/58 uppercase">
                    {t("manual.kicker")}
                  </p>
                  <p className="text-sm leading-6 text-white/68">
                    {t("manual.body")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 font-sans text-[10px] tracking-[0.18em] text-white uppercase transition-[transform,border-color] duration-200 hover:-translate-y-px hover:border-white/24"
                >
                  {copied ? t("actions.copiedShort") : t("actions.copyShort")}
                </button>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-black/35 px-4 py-3 font-mono text-[11px] leading-5 break-all text-white/82 sm:text-xs">
                {targetURL}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="font-sans text-[11px] tracking-[0.22em] text-white/55 uppercase">
                  {t("tips.fallbackLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  {t("tips.fallbackBody")}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="font-sans text-[11px] tracking-[0.22em] text-white/55 uppercase">
                  {t("tips.deviceLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  {os.isIOS
                    ? t("tips.ios")
                    : os.isAndroid
                      ? t("tips.android")
                      : t("tips.generic")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

function resolveEscapePlan(
  targetURL: string,
  browserName: string,
  isIOS: boolean,
  isAndroid: boolean
): EscapePlan {
  if (isAndroid) {
    return { href: buildAndroidEscapeUrl(targetURL, browserName) };
  }

  if (isIOS) {
    return { href: buildIOSEscapeUrl(targetURL, browserName) };
  }

  return { href: null };
}

function buildIOSEscapeUrl(targetURL: string, browserName: string) {
  try {
    if (browserName === "KakaoTalk") {
      return `kakaotalk://web/openExternal?url=${encodeURIComponent(withHttps(targetURL))}`;
    }

    if (browserName === "Line") {
      return appendQueryParam(targetURL, "openExternalBrowser", "1");
    }

    if (IOS_DIRECT_ESCAPE_APPS.has(browserName)) {
      return `x-safari-${withHttps(targetURL)}`;
    }

    return null;
  } catch {
    return null;
  }
}

function buildAndroidEscapeUrl(targetURL: string, browserName: string) {
  try {
    if (browserName === "KakaoTalk") {
      return `kakaotalk://web/openExternal?url=${encodeURIComponent(targetURL)}`;
    }

    if (browserName === "Line") {
      return appendQueryParam(targetURL, "openExternalBrowser", "1");
    }

    if (ANDROID_DIRECT_ESCAPE_APPS.has(browserName)) {
      return `intent://${targetURL.replace(/https?:\/\//i, "")}#Intent;scheme=https;end`;
    }

    return null;
  } catch {
    return null;
  }
}

function withHttps(url: string) {
  if (url.startsWith("http://")) {
    throw new Error("iOS external browser escape requires https.");
  }

  return url.startsWith("https://") ? url : `https://${url}`;
}

function appendQueryParam(url: string, key: string, value: string) {
  const next = new URL(url);
  next.searchParams.set(key, value);
  return next.toString();
}
