"use client";
import { useNav } from "@payloadcms/ui";
import React from "react";
import { useRPNav } from "@/payload/providers/Admins";
import { cn } from "@/lib/utils";

// import "./index.scss";

/**
 * @internal
 */
export const NavWrapper: React.FC<{
  baseClass?: string;
  children: React.ReactNode;
}> = (props) => {
  const { baseClass, children } = props;

  const { hydrated, navOpen, navRef, shouldAnimate } = useNav();

  const mode = useRPNav((r) => r.mode);
  return (
    <aside
      className={cn(
        [
          baseClass,
          navOpen && `${baseClass}--nav-open`,
          shouldAnimate && `${baseClass}--nav-animate`,
          hydrated && `${baseClass}--nav-hydrated`
        ]
          .filter(Boolean)
          .join(" "),
        mode === "editor" && "editor-mode"
      )}
      inert={!navOpen ? true : undefined}
    >
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  );
};
