"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Tap-to-reveal wrapper for the 48h order password on /day-n-night/my.
 *
 * The page is `noindex,nofollow` (set in page metadata) so the password
 * doesn't get crawled into search caches, but a casual screenshot of the
 * page still exposes it. The reveal-on-click affordance keeps the
 * password blurred by default — a deliberate friction step that survives
 * over-the-shoulder reads, screenshare presentations, and accidental
 * device handoff. Audit ref H3.
 *
 * Keyboard: the toggle is a real `<button>`, so Enter/Space activate it.
 * The hidden state uses CSS `filter: blur(8px)` plus `select: none` so
 * the value can't be copied while concealed.
 */
export function PasswordReveal({ password }: { password: string }) {
  const t = useTranslations("Event.Rsvp.my");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-3">
      <p
        className={`font-mono text-2xl tracking-[0.18em] text-off-white transition-[filter] duration-200 ${
          revealed ? "" : "select-none [filter:blur(8px)]"
        }`}
        aria-hidden={!revealed}
      >
        {password}
      </p>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-pressed={revealed}
        className="font-mono text-[10px] tracking-widest text-off-white/65 uppercase transition-colors hover:text-off-white"
      >
        {revealed ? t("passwordHide") : t("passwordReveal")}
      </button>
    </div>
  );
}
