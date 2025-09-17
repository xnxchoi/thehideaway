import { ReadProvider } from "./ReaderProvider";
import { ReactNode } from "react";
import { SideBarProvider } from "@/components/UX/Highlightr/sideBarProvider";
import { LayoutClient } from "@/app/(frontend)/(site)/posts/[slug]/layout.client";

export default async function Layout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <ReadProvider>
      <LayoutClient>
        <SideBarProvider>
          {children}
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
        </SideBarProvider>
      </LayoutClient>
    </ReadProvider>
  );
}
