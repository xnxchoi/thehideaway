"use client";
import { createContext, use, useMemo, type FC, type ReactNode } from "react";

type ContextType = {
  isCollapsed: boolean;
  isVisible: boolean;
  isWithinCollapsible: boolean;
  toggle: () => void;
};

const Context = createContext<ContextType>({
  isCollapsed: undefined!,
  isVisible: undefined!,
  isWithinCollapsible: undefined!,
  toggle: () => {}
});

export const CollapsibleProvider: FC<{
  children?: ReactNode;
  isCollapsed?: boolean;
  isWithinCollapsible?: boolean;
  //
  toggle: () => void;
}> = ({ children, isCollapsed = true, isWithinCollapsible = true, toggle }) => {
  const { isCollapsed: parentIsCollapsed, isVisible } = useCollapsible();

  const contextValue = useMemo((): ContextType => {
    return {
      isCollapsed,
      isVisible: isVisible && !parentIsCollapsed,
      isWithinCollapsible,
      toggle
    };
  }, [isCollapsed, isWithinCollapsible, toggle, parentIsCollapsed, isVisible]);

  return <Context value={contextValue}>{children}</Context>;
};

export const useCollapsible = (): ContextType => use(Context);
