"use client";

import { ReactNode, useEffect } from "react";

import { useHeaderTheme } from "@/providers/HeaderTheme";

const PageClient = (props: { children: ReactNode }) => {
  const { setHeaderTheme } = useHeaderTheme();

  useEffect(() => {
    setHeaderTheme("dark");
  }, [setHeaderTheme]);
  return <div className="py-24"> {props.children}</div>;
};

export default PageClient;
