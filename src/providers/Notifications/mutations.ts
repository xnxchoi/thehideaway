"use client";

/**
 * Notification mutation hooks.
 *
 * Three operations, each isolated so the provider stays a thin context-
 * stitching layer:
 *
 *   - useReadMutation       — PATCH /api/notifications/:id/read
 *   - useDismissMutation    — PATCH /api/notifications/:id/dismiss
 *   - useReadAllMutation    — PATCH /api/notifications/read-all
 *
 * All three:
 *   - Share the `["NOTIFY", { user }, queryString]` query key shape used
 *     by `useNotificationFn`.
 *   - Apply optimistic updates that ACTUALLY mutate the cached list (the
 *     previous implementation's optimistic blocks produced identity maps
 *     and were no-ops in practice).
 *   - Roll back on error via the snapshot returned from onMutate.
 *   - Run a final invalidate in onSettled so the next poll-tick or
 *     refocus rebases against the server.
 */

import type { Notification } from "@/payload-types";
import { convertToSyncedNotification } from "@/payload/collections/Notifications/hooks/convertToSyncedNotification";
import type { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";

type NotifyKey = readonly [string, { user: string }, ...unknown[]];

const buildKey = (user: string): NotifyKey =>
  ["NOTIFY", { user }] as const;

const matchesUserKey = (key: readonly unknown[], user: string) =>
  key[0] === "NOTIFY" &&
  typeof key[1] === "object" &&
  key[1] !== null &&
  (key[1] as { user?: string }).user === user;

/**
 * Apply `mutator` to every cached `["NOTIFY", { user }, ...]` entry.
 * The list ships under multiple query-string permutations (one per
 * filter combination), so we touch each rather than a single fixed key.
 */
const updateAllUserLists = (
  qc: QueryClient,
  user: string,
  mutator: (prev: SyncedNotification[]) => SyncedNotification[]
) => {
  qc.setQueriesData<SyncedNotification[]>(
    { predicate: ({ queryKey }) => matchesUserKey(queryKey, user) },
    (prev) => (prev ? mutator(prev) : prev)
  );
};

const snapshotAllUserLists = (
  qc: QueryClient,
  user: string
): Array<[readonly unknown[], SyncedNotification[] | undefined]> =>
  qc
    .getQueriesData<SyncedNotification[]>({
      predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
    })
    .map(([key, data]) => [key, data]);

const restoreSnapshot = (
  qc: QueryClient,
  snapshot: Array<[readonly unknown[], SyncedNotification[] | undefined]>
) => {
  snapshot.forEach(([key, data]) => {
    qc.setQueryData(key as NotifyKey, data);
  });
};

/* ── Read single ─────────────────────────────────────────────────── */

interface ReadVars {
  user: string;
  ids: string[];
}

export const useReadMutation = () =>
  useMutation({
    mutationKey: ["NOTIFY", "read"],
    mutationFn: async ({ ids }: ReadVars) => {
      const settled = await Promise.allSettled(
        ids.map(async (id) => {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/${id}/read`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include"
            }
          );
          if (!res.ok) throw new Error(`read ${id} failed (${res.status})`);
          const body = (await res.json()) as { notification: Notification };
          return body.notification;
        })
      );
      return settled
        .filter(
          (r): r is PromiseFulfilledResult<Notification> =>
            r.status === "fulfilled"
        )
        .map((r) => convertToSyncedNotification(r.value));
    },
    onMutate: async ({ user, ids }, context) => {
      await context.client.cancelQueries({
        predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
      });
      const snapshot = snapshotAllUserLists(context.client, user);
      const targets = new Set(ids);
      const nowIso = DateTime.now().toISO();
      updateAllUserLists(context.client, user, (prev) =>
        prev.map((n) =>
          targets.has(n.id) && !n.read
            ? { ...n, read: true, readAt: nowIso, status: "read" as const }
            : n
        )
      );
      return { snapshot };
    },
    onError: (_err, _vars, onMutateResult, context) => {
      if (onMutateResult?.snapshot) {
        restoreSnapshot(context.client, onMutateResult.snapshot);
      }
    },
    onSettled: (_data, _err, { user }, _onMutate, context) => {
      context.client.invalidateQueries({
        predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
      });
    }
  });

/* ── Dismiss ─────────────────────────────────────────────────────── */

interface DismissVars {
  user: string;
  ids: string[];
}

export const useDismissMutation = () =>
  useMutation({
    mutationKey: ["NOTIFY", "dismiss"],
    mutationFn: async ({ ids }: DismissVars) => {
      const settled = await Promise.allSettled(
        ids.map(async (id) => {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/${id}/dismiss`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include"
            }
          );
          if (!res.ok) throw new Error(`dismiss ${id} failed (${res.status})`);
          const body = (await res.json()) as { notification: Notification };
          return body.notification;
        })
      );
      return settled
        .filter(
          (r): r is PromiseFulfilledResult<Notification> =>
            r.status === "fulfilled"
        )
        .map((r) => convertToSyncedNotification(r.value));
    },
    onMutate: async ({ user, ids }, context) => {
      await context.client.cancelQueries({
        predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
      });
      const snapshot = snapshotAllUserLists(context.client, user);
      const targets = new Set(ids);
      const nowIso = DateTime.now().toISO();
      // Optimistic: flip dismissed + read in-place. We keep the rows in
      // the cache rather than splicing them — NotificationCenter filters
      // on `dismissed`/`status` to decide what to show, so removing here
      // would break the "Dismissed" tab.
      updateAllUserLists(context.client, user, (prev) =>
        prev.map((n) =>
          targets.has(n.id)
            ? {
                ...n,
                read: true,
                dismissed: true,
                readAt: n.readAt ?? nowIso,
                status: "dismissed" as const
              }
            : n
        )
      );
      return { snapshot };
    },
    onError: (_err, _vars, onMutateResult, context) => {
      if (onMutateResult?.snapshot) {
        restoreSnapshot(context.client, onMutateResult.snapshot);
      }
    },
    onSettled: (_data, _err, { user }, _onMutate, context) => {
      context.client.invalidateQueries({
        predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
      });
    }
  });

/* ── Read all ────────────────────────────────────────────────────── */

interface ReadAllVars {
  user: string;
}

export const useReadAllMutation = () =>
  useMutation({
    mutationKey: ["NOTIFY", "read-all"],
    mutationFn: async (_vars: ReadAllVars) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        }
      );
      if (!res.ok) throw new Error(`read-all failed (${res.status})`);
      const body = (await res.json()) as {
        updatedCount: number;
        docs: Notification[];
      };
      return body.docs.map((d) => convertToSyncedNotification(d));
    },
    onMutate: async ({ user }, context) => {
      await context.client.cancelQueries({
        predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
      });
      const snapshot = snapshotAllUserLists(context.client, user);
      const nowIso = DateTime.now().toISO();
      updateAllUserLists(context.client, user, (prev) =>
        prev.map((n) =>
          !n.read
            ? { ...n, read: true, readAt: nowIso, status: "read" as const }
            : n
        )
      );
      return { snapshot };
    },
    onError: (_err, _vars, onMutateResult, context) => {
      if (onMutateResult?.snapshot) {
        restoreSnapshot(context.client, onMutateResult.snapshot);
      }
    },
    onSettled: (_data, _err, { user }, _onMutate, context) => {
      context.client.invalidateQueries({
        predicate: ({ queryKey }) => matchesUserKey(queryKey, user)
      });
    }
  });

export { buildKey as buildNotifyKey };
