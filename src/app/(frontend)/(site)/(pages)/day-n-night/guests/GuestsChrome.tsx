"use client";

import { Link } from "@/components/core/Link/Link";
import { useFooterVisibility } from "@/components/Shells/Footer/footer-visibility";
import { useRPStore } from "@/providers/RP_Pro";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export function GuestsChrome() {
  const tGuests = useTranslations("Event.Guests");
  const tDn = useTranslations("Event.DayNNight");
  const setHeaderVisibility = useRPStore((r) => r.setHeaderVisibility);
  const setFXFrameVisibility = useRPStore((r) => r.setFXFrameVisibility);

  useFooterVisibility("hide");

  useEffect(() => {
    const header = document.getElementById("rp-header");
    setHeaderVisibility(false);
    setFXFrameVisibility(false);
    document.body.setAttribute("data-dn-immersive", "true");
    if (header) header.style.display = "none";

    return () => {
      setHeaderVisibility(true);
      setFXFrameVisibility(true);
      document.body.removeAttribute("data-dn-immersive");
      if (header) header.style.display = "";
    };
  }, [setFXFrameVisibility, setHeaderVisibility]);

  return (
    <nav
      aria-label={tGuests("navigation.label")}
      className="fixed top-5 right-5 left-5 z-[46] flex items-center justify-between gap-3 text-white md:top-8 md:right-8 md:left-8 xl:top-10 xl:right-12 xl:left-12"
    >
      <Link
        href="/day-n-night"
        className="group inline-flex items-center gap-[10px] rounded-full border border-white/20 bg-black/35 py-[7px] pr-[14px] pl-3 font-mono text-[10px] tracking-[0.18em] text-white/70 uppercase no-underline backdrop-blur-md transition-colors hover:border-white/45 hover:text-white"
      >
        <span
          aria-hidden
          className="-translate-y-px text-sm leading-none transition-transform group-hover:-translate-x-[3px]"
        >
          ←
        </span>
        <span>{tGuests("navigation.back")}</span>
      </Link>

      <span className="pointer-events-none hidden rounded-full border border-white/15 bg-black/25 px-4 py-[7px] font-mono text-[10px] tracking-[0.22em] text-white/55 uppercase backdrop-blur-md md:inline-flex">
        {tGuests("title")}
      </span>

      <Link
        href="/tickets/day-n-night"
        className="group inline-flex items-center gap-[10px] rounded-full border border-white/75 bg-white px-[14px] py-[7px] font-mono text-[10px] tracking-[0.18em] text-black uppercase no-underline backdrop-blur-md transition-transform hover:-translate-y-px"
      >
        <span>{tDn("rsvpCta.register")}</span>
        <span
          aria-hidden
          className="-translate-y-px text-sm leading-none transition-transform group-hover:translate-x-[3px]"
        >
          →
        </span>
      </Link>
    </nav>
  );
}
