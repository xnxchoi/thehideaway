"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

type RadioMode = "station" | "showcase";

type RadioModeState = {
  mode: RadioMode;
  setMode: (mode: RadioMode) => void;
};

const RadioModeContext = createContext<RadioModeState | null>(null);

export function RadioModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeInternal] = useState<RadioMode>(() => {
    if (typeof window !== "undefined" && window.location.hash === "#showcase") {
      return "showcase";
    }
    return "station";
  });

  const setMode = useCallback((next: RadioMode) => {
    setModeInternal(next);
    const hash = next === "showcase" ? "#showcase" : "";
    window.history.pushState(null, "", `/radio${hash}`);
  }, []);

  // Sync with browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      setModeInternal(
        window.location.hash === "#showcase" ? "showcase" : "station"
      );
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <RadioModeContext.Provider value={{ mode, setMode }}>
      {children}
    </RadioModeContext.Provider>
  );
}

export function useRadioMode() {
  const ctx = useContext(RadioModeContext);
  if (!ctx) throw new Error("useRadioMode must be used inside RadioModeProvider");
  return ctx;
}
