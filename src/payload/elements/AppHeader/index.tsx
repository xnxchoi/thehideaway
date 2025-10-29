"use client";
import { formatAdminURL } from "payload/shared";
import React, { useEffect, useRef, useState } from "react";

import {
  Account,
  NavToggler,
  RenderCustomComponent,
  useActions,
  useConfig,
  useNav,
  useTranslation
} from "@payloadcms/ui";

import { Link } from "@/components/UX/Link/Link";

import { Localizer } from "@payloadcms/ui/elements/Localizer";
import { LocalizerLabel } from "@payloadcms/ui/elements/Localizer/LocalizerLabel";

import { StepNav } from "@payloadcms/ui/elements/StepNav";
// import "./index.scss";

const baseClass = "app-header";

type Props = {
  CustomAvatar?: React.ReactNode;
  CustomIcon?: React.ReactNode;
};
export function AppHeader({ CustomAvatar, CustomIcon }: Props) {
  const { t } = useTranslation();

  const { Actions } = useActions();

  const {
    config: {
      admin: {
        routes: { account: accountRoute }
      },
      localization,
      routes: { admin: adminRoute }
    }
  } = useConfig();

  const { navOpen } = useNav();

  const customControlsRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkIsScrollable = () => {
      const el = customControlsRef.current;
      if (el) {
        const scrollable = el.scrollWidth > el.clientWidth;
        setIsScrollable(scrollable);
      }
    };

    checkIsScrollable();
    window.addEventListener("resize", checkIsScrollable);

    return () => {
      window.removeEventListener("resize", checkIsScrollable);
    };
  }, [Actions]);

  const ActionComponents = Actions ? Object.values(Actions) : [];

  return (
    <header
      className={[baseClass, navOpen && `${baseClass}--nav-open`]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__wrapper`}>
          <div className={"relative"}>
            <NavToggler
              className={
                "absolute top-0 left-0 flex h-[24px] w-[24px] items-center justify-center rounded-[4px] transition-[opacity,colors] duration-200 ease-out-power3 select-none"
              }
              tabIndex={-1}
            >
              <svg
                aria-hidden={true}
                role="graphics-symbol"
                viewBox={"0 0 20 20"}
                style={{
                  width: 22,
                  height: 22,
                  display: "block",
                  fill: "oklch(var(--faded-fg)/1)",
                  flexShrink: 0
                }} data-themed="fill"
              >
                <path d="M2.275 5c0-.345.28-.625.625-.625h14.2a.625.625 0 1 1 0 1.25H2.9A.625.625 0 0 1 2.275 5m0 5c0-.345.28-.625.625-.625h14.2a.625.625 0 1 1 0 1.25H2.9A.625.625 0 0 1 2.275 10m.625 4.375a.625.625 0 1 0 0 1.25h14.2a.625.625 0 1 0 0-1.25z"></path>{" "}
              </svg>
            </NavToggler>
          </div>
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__step-nav-wrapper`}></div>
            <div className={`${baseClass}__actions-wrapper`}>
              <div className={`${baseClass}__actions`} ref={customControlsRef}>
                {ActionComponents.map((Action, i) => (
                  <div
                    className={
                      isScrollable && i === ActionComponents.length - 1
                        ? `${baseClass}__last-action`
                        : ""
                    }
                    key={i}
                  >
                    {Action}
                  </div>
                ))}
              </div>
              {isScrollable && (
                <div className={`${baseClass}__gradient-placeholder`} />
              )}
            </div>
            {localization && (
              <LocalizerLabel
                ariaLabel="invisible"
                className={`${baseClass}__localizer-spacing`}
                data-themed="color, border-color, background-color, outline-color,box-shadow"
              />
            )}
            <Link
              aria-label={t("authentication:account")}
              className={`${baseClass}__account`}
              href={formatAdminURL({ adminRoute, path: accountRoute })}
              prefetch={false}
              tabIndex={0} data-themed="color, border-color, background-color, outline-color,box-shadow"
            >
              <RenderCustomComponent
                CustomComponent={CustomAvatar}
                Fallback={<Account />}
              />
            </Link>
          </div>
        </div>
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  );
}
