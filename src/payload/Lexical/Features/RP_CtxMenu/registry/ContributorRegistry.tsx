"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import type { ContextMenuContributor } from "../types";

/**
 * Registry for context-menu contributors. Contributors call
 * `useRegisterContextMenuContributor(contributor)` inside a React tree below
 * `<ContextMenuRegistryProvider>`. The registry holds contributors in a
 * stable map and exposes a snapshot array sorted by `order`.
 *
 * The registry re-renders (via a tick counter) whenever contributors mount or
 * unmount so the menu sees an up-to-date snapshot.
 */

interface RegistryApi {
  register: (contributor: ContextMenuContributor) => () => void;
  getContributors: () => readonly ContextMenuContributor[];
  /** Bumped whenever the registry mutates so consumers can re-read. */
  version: number;
}

const RegistryContext = createContext<RegistryApi | undefined>(undefined);

export function ContextMenuRegistryProvider({
  children
}: {
  children: ReactNode;
}) {
  const mapRef = useRef<Map<string, ContextMenuContributor>>(new Map());
  const [version, setVersion] = useState(0);

  const register = useCallback((contributor: ContextMenuContributor) => {
    mapRef.current.set(contributor.id, contributor);
    setVersion((v) => v + 1);
    return () => {
      mapRef.current.delete(contributor.id);
      setVersion((v) => v + 1);
    };
  }, []);

  const getContributors = useCallback(() => {
    const list = Array.from(mapRef.current.values());
    list.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    return list;
  }, []);

  const api = useMemo<RegistryApi>(
    () => ({ register, getContributors, version }),
    [register, getContributors, version]
  );

  return (
    <RegistryContext.Provider value={api}>{children}</RegistryContext.Provider>
  );
}

export function useContextMenuRegistry(): RegistryApi {
  const api = useContext(RegistryContext);
  if (!api) {
    throw new Error(
      "useContextMenuRegistry must be used within <ContextMenuRegistryProvider>"
    );
  }
  return api;
}

/**
 * Hook for features to register themselves as contributors. The `contributor`
 * argument should be memoized by the caller — on every change the registry
 * swaps the registration.
 */
export function useRegisterContextMenuContributor(
  contributor: ContextMenuContributor
) {
  const { register } = useContextMenuRegistry();
  useEffect(() => register(contributor), [register, contributor]);
}
