"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuthenticate({
  enabled = true,
  authView = "sign-in"
}: {
  enabled?: boolean;
  authView?: "sign-in" | "sign-up";
} = {}) {
  const router = useRouter();
  const { data, isPending, error, refetch } = authClient.useSession();

  useEffect(() => {
    if (!enabled || isPending || data) return;

    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo =
      searchParams.get("redirectTo") ||
      window.location.pathname + window.location.search;

    router.replace(
      `/${authView}?redirectTo=${encodeURIComponent(redirectTo)}`
    );
  }, [enabled, isPending, data, router, authView]);

  return {
    data,
    user: data?.user,
    isPending,
    error,
    refetch
  };
}
