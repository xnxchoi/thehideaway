"use client";
import { createContext, FC, ReactNode, use } from "react";
const Context = createContext(false);

export const TabsProvider: FC<{
  children?: ReactNode;
  withinTab?: boolean;
}> = ({ children, withinTab = true }) => {
  return <Context value={withinTab}>{children}</Context>;
};

export const useTabs = (): boolean => use(Context);
