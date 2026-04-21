"use client";

import React, { ReactNode, useEffect } from "react";

import { useHeaderTheme } from "@/providers/HeaderTheme";
import * as motion from "motion/react-m";

const PageClient = (props: { children: ReactNode }) => {
  const { setHeaderTheme } = useHeaderTheme();
  useEffect(() => {
    setHeaderTheme("light");
  }, [setHeaderTheme]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="min-h-screen"
    >
      {props.children}
    </motion.div>
  );
};

export default PageClient;
