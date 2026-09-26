let lastPathname: string | null = null;

const isBrowser = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.document?.createElement === "function";

export const consumeHydrationSafeInitial = (pathname: string): boolean => {
  if (!isBrowser()) return true;
  return lastPathname === null || pathname === lastPathname;
};

export const commitPageTransitionPath = (pathname: string): void => {
  if (isBrowser()) lastPathname = pathname;
};

export const getCommittedPageTransitionPath = (): string | null => lastPathname;

export const __resetDocumentHydratedForTests = (): void => {
  lastPathname = null;
};
