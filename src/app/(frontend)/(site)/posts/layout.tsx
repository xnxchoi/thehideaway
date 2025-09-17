import { ReactNode } from "react";
import { HighlighterProvider } from "@/components/UX/Highlightr/provider";

export default function Layout({ children }: { children: ReactNode }) {
  return <HighlighterProvider target={null}>{children}</HighlighterProvider>;
}
