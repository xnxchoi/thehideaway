"use client";

import { authClient } from "@/lib/auth/client";
import { getSearchParam } from "@/lib/auth/search-param";
import { normalizeLocalReturnTo } from "@/lib/routes/auth";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";

export function useOnSuccessTransition({
  redirectTo: redirectToProp,
  navigate: navigateProp,
  refetchSession
}: {
  redirectTo?: string;
  navigate?: (href: string) => void;
  refetchSession?: () => Promise<unknown> | unknown;
} = {}) {
  const router = useRouter();
  const { refetch } = authClient.useSession();

  const getRedirectTo = useCallback(
    () =>
      normalizeLocalReturnTo(
        redirectToProp || getSearchParam("redirectTo"),
        "/me"
      ),
    [redirectToProp]
  );

  const [isPending, startTransition] = useTransition();
  const hasStartedNavigation = useRef(false);
  const navigate = navigateProp ?? ((href: string) => router.push(href));
  const refreshSession = refetchSession ?? refetch;

  const onSuccess = useCallback(async () => {
    await refreshSession?.();
    if (hasStartedNavigation.current) return;

    hasStartedNavigation.current = true;

    startTransition(() => {
      navigate(getRedirectTo());
    });
  }, [refreshSession, navigate, getRedirectTo]);

  return { onSuccess, isPending };
}
