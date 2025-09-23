"use client";

import { ReactNode, useEffect } from "react";

import { useHeaderTheme } from "@/providers/HeaderTheme";
import * as m from "motion/react-m";

const PageClient = (props: { children: ReactNode; title: string }) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme();
  useEffect(() => {
    setHeaderTheme("dark");
  }, [setHeaderTheme]);

  return <m.article className="pt-16 pb-24">{props.children}</m.article>;
};

export default PageClient;
