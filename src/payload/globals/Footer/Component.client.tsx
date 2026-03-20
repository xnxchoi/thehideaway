"use client";

import { gsap } from "gsap";
import type { HTMLAttributes, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { ReferencedLink } from "@/components/UX/Link/referencedLink";
import { useInView } from "@/hooks/useInView";
import type { Footer, Media, Page } from "@payload-types";
import { useRPStore } from "@/providers/RP_Pro";
import { wait } from "@/utilities/wait";
import { cn } from "@/lib/utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import { useTheme } from "@/providers/Theme";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";

export type FooterType = string | "standard" | "linksOnly" | "hidden";
type SparseArray<T> = (T | undefined)[];

interface FooterProps extends HTMLAttributes<HTMLElement> {
  style?: HTMLAttributes<HTMLAttributes<HTMLElement>>["style"] & {
    "--desktop-overlay-opacity"?: number;
    "--mobile-overlay-opacity"?: number;
  };
  footerType: FooterType;
  navItems?: Array<{
    link: {
      type?: ("reference" | "custom") | null;
      newTab?: boolean | null;
      reference?: {
        relationTo: "pages";
        value: string | Page;
      } | null;
      url?: string | null;
      label: string;
    };
    id?: string | null;
  }>;
  videoLoop?: {
    desktop?: Media | null;
    mobile?: Media | null;
  };
  className?: string;
}

export const RP_Footer = (props: FooterProps) => {
  const setGlobalSettings = useRPStore((l) => l.setGlobalSettings);
  const U = {};
  const as: SparseArray<null | any> = [];
  as.fill(null).forEach((l, c) => {
    U[c + 1] = [];
  });
  const footerRef = useRef<HTMLElement>(null!);
  const footerSettings = useRPStore((l) => l.globalSettings.footer);
  const linkListRef = useRef(U);
  const { setElementToObserve, isInView } = useInView();
  const windowResize = useWindowResize({
    detectHeightChange: !0
  });
  const scrollTriggerRef: RefObject<null | ScrollTrigger> = useRef(null);
  const gsapCTX = useRef(gsap.context(() => {}));
  const { footerType, ...rest } = props;
  const [clickedLinkState, setClickedLinkState] = useState(!1);
  const theme = useTheme((r) => r.theme),
    pageTheme = useTheme((r) => r.pageTheme);

  const is404 = useVoyageur((l) => l.is404);
  useEffect(() => {
    if (
      (scrollTriggerRef.current && scrollTriggerRef.current.kill(),
      footerType === "hidden")
    )
      return;
    const fire = async () => {
      (await wait(50),
        footerRef.current &&
          footerSettings !== null &&
          gsapCTX.current &&
          gsapCTX.current.add(() => {
            scrollTriggerRef.current = new ScrollTrigger({
              trigger: footerRef.current,
              start: "top top",
              end: "bottom top"
            });
          }));
    };
    fire();
  }, [footerType, footerSettings]);
  useEffect(() => {
    if (footerType === "hidden") return;
    const scrltr = scrollTriggerRef.current;
    const gsapContext = gsapCTX.current;
    return () => {
      (gsapContext && gsapContext.revert(), scrltr == null || scrltr.kill());
    };
  }, [footerType]);
  const columnLinkRows = {
    0: footerSettings == null ? void 0 : footerSettings.column1Links,
    1: footerSettings == null ? void 0 : footerSettings.column2Links,
    2: footerSettings == null ? void 0 : footerSettings.column3Links
  };
  const handleLinkClick = () => {
    (setClickedLinkState(!0), setTimeout(() => {}, 100));
  };
  useEffect(() => {
    if (!footerSettings) return;
    footerSettings && setGlobalSettings({ footer: footerSettings });
  }, []);
  let footerSettingProps = {};
  if (
    footerSettings &&
    footerSettings.desktopOverlay &&
    footerSettings.mobileOverlay
  )
    footerSettingProps = {
      "--desktop-overlay-opacity": footerSettings.desktopOverlay! / 100,
      "--mobile-overlay-opacity": footerSettings.mobileOverlay! / 100
    };
  return footerType === "hidden" ? null : (
    <footer
      ref={footerRef}
      data-type={footerType}
      data-themed="background-color"
      style={{ ...footerSettingProps }}
      data-theme={theme}
      className={cn("rp-footer", footerType === null ? "" : footerType, {
        clickedLink: clickedLinkState
      })}
      onMouseEnter={() => {
        if (is404) return;
      }}
      onMouseLeave={() => {
        is404;
      }}
    >
      {footerType === "standard" && (
        <>
          <div className="overlay" />
        </>
      )}
      <div className="top-container">
        <h1 className="top-container-title">{footerSettings?.title}</h1>
      </div>
      <div className="bottom-columns">
        <div className="links-container">
          {
            // @ts-ignore
            [].fill(null).map((l, c) => (
              <ul className={cn(["list".concat(`${c + 1}`)])}>
                {columnLinkRows[c].map((l, d) => (
                  <li
                    className="listItem"
                    ref={(l) => {
                      linkListRef.current["".concat(`${c + 1}`)][d] = l;
                    }}
                  >
                    <ReferencedLink
                      className="footer-link"
                      {...l}
                      key={"footer-link" + d}
                    />
                  </li>
                ))}
              </ul>
            ))
          }
        </div>
        <div className="icons-container">
          <div className="icon">
            <div className="icon__inner">
              <div className="lottieLight" />
              <div className="lottieDark" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
