"use client";
import tabMessages from "@/constants/tabMessages.json";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createStore, useStore } from "zustand";
import { randomNumber } from "./randomNumber";

type TabMessageStore = {
  title: string;
  screenSaverTitle: string;
};
type TabMessageActions = {
  setTitle: (title: string) => void;
  setScreenSaverTitle: (title: string) => void;
};
type TabMessengerType = TabMessageStore & TabMessageActions;
const createTabMessageStore = (initState: TabMessageStore) => {
  return createStore<TabMessengerType>((set) => ({
    ...initState,
    setTitle: (title) => set({ title }),
    setScreenSaverTitle: (title) => set({ screenSaverTitle: title })
  }));
};
type TabMessengerAPI = ReturnType<typeof createTabMessageStore>;
const TabMessageContext = createContext<TabMessengerAPI | undefined>(undefined);
const TabMessengerProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useRef<TabMessengerAPI>(undefined!);

  if (!store.current) {
    store.current = createTabMessageStore({
      title: document.title,
      screenSaverTitle: ""
    });
  }

  return (
    <TabMessageContext.Provider value={store.current}>
      {children}
    </TabMessageContext.Provider>
  );
};
export const useTabMessenger = <T,>(
  selector: (store: TabMessengerType) => T
): T => {
  const store = useContext(TabMessageContext);
  if (!store) {
    throw new Error(
      "useTabMessenger must be used within a TabMessengerProvider"
    );
  }
  return useStore(store, selector);
};
const InternalTabMessenger = ({ children }: { children: React.ReactNode }) => {
  const ogDocTitle = useRef(document.title);
  const FALLBACK_TITLE = "THE HIDEAWAY";
  const emojis = useMemo(() => tabMessages.icons, []);
  const messages = useMemo(() => tabMessages.messages, []);

  const screenSaverTitle = useRef(FALLBACK_TITLE);
  const pathName = usePathname();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    ogDocTitle.current = document.title;
  }, [pathName]);

  const visibleCallback = useCallback(() => {
    const isVisible = !document.hidden;
    setVisible(isVisible);
    document.title = isVisible ? ogDocTitle.current : screenSaverTitle.current;
  }, [setVisible]);

  useEffect(() => {
    document.addEventListener("visibilitychange", visibleCallback);
    return () => {
      document.removeEventListener("visibilitychange", visibleCallback);
    };
  }, [visibleCallback]);

  const delayerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screensaver = useCallback(() => {
    screenSaverTitle.current = `${emojis[randomNumber(0, emojis.length - 1)]}   ${
      messages[randomNumber(0, messages.length - 1)]
    }`;
  }, [emojis, messages]);
  useEffect(() => {
    delayerRef.current && clearInterval(delayerRef.current);
    delayerRef.current = visible ? null : setInterval(screensaver, 1000);
    return () => {
      delayerRef.current && clearInterval(delayerRef.current);
      delayerRef.current = null;
    };
  }, [screensaver, visible]);
  return <>{children}</>;
};
export const TabMessenger = ({ children }: { children: React.ReactNode }) => {
  return (
    <TabMessengerProvider>
      <InternalTabMessenger>{children}</InternalTabMessenger>
    </TabMessengerProvider>
  );
};
