import { ContentProvider } from "@/components/UX/Highlightr/providers";
import { ArticleProvider } from "@/components/UX/Highlightr/providers/ArticleProvider";
import { ReactNode } from "react";
import { LayoutClient } from "./layout.client";
import { ReadProvider } from "./ReaderProvider";

export default async function Layout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <ReadProvider>
      <ArticleProvider>
        <ContentProvider>
          <LayoutClient>
            <div className="flex h-full w-full flex-col items-center justify-center">
              {children}
            </div>
            <div
              className={
                "pointer-events-none fixed top-0 left-0 z-[255] h-[100lvh] w-full opacity-[0.04] transition-opacity duration-500"
              }
              style={{
                backgroundImage: `url(/assets/papier.png)`,
                backgroundPosition: "0% 0%",
                backgroundSize: "200px 200px",
                backgroundRepeat: "repeat"
              }}
            ></div>
          </LayoutClient>
        </ContentProvider>
      </ArticleProvider>
    </ReadProvider>
  );
}
