"use client";

import { useQuery } from "@tanstack/react-query";
import { Locked } from "@/components/UX/Locked/Locked";
import RichText from "../RichText";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { Shaped } from "@/components/core/s";
import { useShallow } from "zustand/shallow";

export default function LockedGate({
  id,
  collection = "posts"
}: {
  id: string;
  collection?: "posts" | "surf";
}) {
  const user = useRPSession(useShallow((r) => r.id as null | string));
  const {
    isError,
    isSuccess,
    isPending,
    isLoading,
    data: gatedContent
  } = useQuery({
    queryKey: ["gated", collection, id, user],
    queryFn: ({ signal }) => fetchGated(collection, id, signal),
    refetchOnWindowFocus: false
  });

  if (isPending) return <Locked />;
  if (isError) return <Locked />;
  if (isSuccess && gatedContent) {
    return <RichText data={gatedContent.content} enableGutter={false} />;
  }
  return <Locked />;
}

async function fetchGated<T extends "posts" | "surf">(
  collection: T,
  id: string,
  signal?: AbortSignal
): Promise<Shaped<T>> {
  const res = await fetch(`/api/gated/${collection}/${id}`, {
    method: "get",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal
  });
  if (!res.ok) throw new Error(`Failed to fetch gated content: ${res.status}`);
  const r = (await res.json()) as {
    data: Shaped<T>;
    collection: string;
  };
  if (r?.data) return r.data;
  throw new Error("Failed to fetch gated content");
}
