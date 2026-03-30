"use client";
import { FloatMenuProvider } from "./FloatProvider";
import { HighlighterProvider } from "./HighlighterProvider";
import { SideBarProvider } from "./sideBarProvider";
import { type ReactNode } from "react";
import { CitationProvider } from "./CitationProvider";
import dynamic from "next/dynamic";
import { PrivateMemoizer } from "../PrivateHighlights";
const RangerProvider = dynamic(
  () =>
    import("@/components/UX/Highlightr/providers/RangerProvider").then(
      (r) => r.RangerProvider
    ),
  {
    ssr: false
  }
);
export const ContentProvider = ({ children }: { children: ReactNode }) => {
  return (
    <RangerProvider>
      <FloatMenuProvider>
        <HighlighterProvider>
          <CitationProvider>
            <PrivateMemoizer>
              <SideBarProvider>{children}</SideBarProvider>
            </PrivateMemoizer>
          </CitationProvider>
        </HighlighterProvider>
      </FloatMenuProvider>
    </RangerProvider>
  );
};
