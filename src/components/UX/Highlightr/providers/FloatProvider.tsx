"use client";
import { useContext, createContext, useState } from "react";

type FloaterHightlight = {
  setOpen: (open: boolean) => void;
  open: boolean;
};
const FloaterContext = createContext<FloaterHightlight>({
  setOpen: (open: boolean) => {},
  open: false
});
export const FloatMenuProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <FloaterContext.Provider value={{ setOpen, open }}>
      {children}
    </FloaterContext.Provider>
  );
};
export const useFloater = <T,>(selector: (state: FloaterHightlight) => T) => {
  const ctx = useContext(FloaterContext);
  return selector(ctx);
};
