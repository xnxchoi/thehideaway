"use client";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { Notification } from "@/payload-types";
import { convertToSyncedNotification } from "@/payload/collections/Notifications/hooks/convertToSyncedNotification";
import { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import {
  createNotificationStore,
  NotificationStore
} from "@/stores/Notification/NotificationStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { StoreApi, useStore } from "zustand";
import { useNotificationFn } from "./notificationFn";

type NotificationAPI = StoreApi<NotificationStore>;
const NotificationContext = createContext<NotificationAPI | undefined>(
  undefined
);

export const NotificationProvider = ({
  children,
  user
}: {
  children: ReactNode;
  user: string;
}) => {
  return (
    <NotificationInternal user={user || ""}>
      <NotifyProxy>{children}</NotifyProxy>
    </NotificationInternal>
  );
};

const NotifyContext = createContext<{
  notifications: SyncedNotification[];
  count: number;
  lastFetched: number;
  isLoading: boolean;
  setRead: ({ ids }: { ids: string[] }) => void;
  setDismissed: ({ ids }: { ids: string[] }) => void;
  setAllRead: () => void;

  // isSSEConnected: boolean;
}>({
  notifications: [],
  count: 0,
  lastFetched: 0,
  isLoading: false,
  setRead: () => {},
  setDismissed: () => {},
  setAllRead: () => {}
});

const NotifyProxy = ({ children }: { children: ReactNode }) => {
  const lastFetched = useNore((s) => s.lastFetched);
  const updateNo = useNore((s) => s.setNotifications);
  // const handleSSEUpdate = useNore((s) => s.handleSSEUpdate);
  const updateU = useNore((r) => r.updateUser);
  const user = useRPSession((r) => r.id);
  const notifications = useNore((s) => s.notifications);
  const count = useNore((r) => r.count);

  const qc = useQueryClient();
  // Initial fetch and fallback for when SSE is not connected
  const [isLoading, setIsLoading] = useState(false);
  const { fn, queryString } = useNotificationFn({});
  const {
    isLoading: isLoadingNotifications,
    data,
    isLoadingError,
    isPending: isPendingNotifications,
    isError: isErrorNotifications
  } = useQuery({
    placeholderData: Array.from(notifications.values()),
    queryKey: ["NOTIFY", { user: user }, queryString],
    queryFn: fn,
    enabled: !!user,
    // Increase stale time since we have real-time updates via SSE
    staleTime: 90 * 1000, // 5 minutes if SSE connected, 90 seconds otherwise
    // Reduce refetch interval when SSE is connected

    networkMode: "online",
    gcTime: 60 * 1000
  });
  useEffect(() => {
    if (data) {
      updateNo(data);
    }
  }, [data, updateNo]);

  // const { mutateAsync: mutateNotification } = useMutation({
  //   scope: { id: "NOTIFY" + user },
  //   mutationFn: async ({
  //     params,
  //     user,
  //     now
  //   }: {
  //     params: {
  //       doc: Partial<SyncedNotification> & Pick<SyncedNotification, "id">;
  //       action?: "read" | "dismiss";
  //     }[];
  //     now: number;
  //     user: string;
  //   }) => {
  //     const responses = await Promise.allSettled(
  //       params
  //         .filter((o) => !!o.doc?.id)
  //         .map(async (p) =>
  //           fetch(
  //             `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/${p.doc.id}${p.action ? `/${p.action}` : ""}`,
  //             {
  //               method: "PATCH",
  //               headers: {
  //                 "Content-Type": "application/json"
  //               },
  //               credentials: "include",
  //               body: JSON.stringify(p.action ? { id: p.doc.id } : { ...p.doc })
  //             }
  //           )
  //             .then(async (response) => {
  //               if (!response.ok) {
  //                 throw new Error("Failed to update notification", {
  //                   cause: {
  //                     doc: p.doc,
  //                     action: p.action
  //                   }
  //                 });
  //               }
  //               return (await response.json()) as {
  //                 doc: Notification;
  //                 message: string;
  //               };
  //             })
  //             .then((r) => {
  //               return { ...r, action: p.action };
  //             })
  //             .catch((e) => {
  //               console.error(e);
  //               return {
  //                 doc: p.doc,
  //                 action: p.action,
  //                 error: e
  //               };
  //             })
  //         )
  //     );
  //     const docs = responses
  //       .filter((r) => r.status === "fulfilled")
  //       .map((r) => r.value.doc as Notification);
  //     if (docs.length === 0) {
  //       throw new Error("Failed to update notification", {
  //         cause: {
  //           docs: responses,
  //           params
  //         }
  //       });
  //     }
  //     return {
  //       docs: docs.map((r) => convertToSyncedNotification(r)),
  //       user,
  //       timestamp: now
  //     };
  //   },
  //   onMutate: async (variables, context) => {
  //     const { user, params, now } = variables;
  //     const nowD = DateTime.fromMillis(now);
  //     const nowISO = nowD.toISO()!;

  //     await context.client.cancelQueries({
  //       queryKey: ["NOTIFY", { user: user }]
  //     });
  //     const previousNotifications =
  //       context.client.getQueryData(["NOTIFY", { user: variables.user }]) ||
  //       ([] as SyncedNotification[]);
  //     const docs = [...(previousNotifications as SyncedNotification[])];
  //     params.forEach((p) => {
  //       const r = docs.find((r) => r.id === p.doc.id);
  //       if (r) {
  //         switch (p.action) {
  //           case "read":
  //             r.read = true;
  //             if (!r.readAt) {
  //               r.readAt = nowISO;
  //               r.updatedAt = nowISO;
  //             }
  //             break;
  //           case "dismiss":
  //             r.read = true;
  //             r.dismissed = true;
  //             r.readAt = r.readAt || nowISO;
  //             r.updatedAt = nowISO;
  //             break;
  //         }
  //       }
  //     });
  //     context.client.setQueryData(
  //       ["NOTIFY", { user: variables.user }],
  //       [
  //         ...docs.map((r) =>
  //           DateTime.fromISO(r.updatedAt) <= nowD && (!r.dismissed || !r.read)
  //             ? {
  //                 ...r
  //               }
  //             : r
  //         )
  //       ]
  //     );
  //     return { previousNotifications };
  //   },
  //   onSuccess: (res) => {
  //     const { docs, user } = res;
  //     // Only update locally if SSE is not connected (to avoid double updates)
  //     // if (!isSSEConnected) {
  //     updateNo(docs);

  //     qc.invalidateQueries({
  //       queryKey: ["NOTIFY", { user: user }]
  //     });
  //     // }
  //   }
  // });

  const { mutate: dismiss } = useMutation({
    scope: { id: "NOTIFY" + user },
    mutationFn: async ({ user, ids }: { user: string; ids: string[] }) => {
      const response = await Promise.allSettled(
        ids.map(async (id) => {
          const fv = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/${id}/dismiss`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              },
              credentials: "include"
            }
          );
          if (!fv.ok) {
            throw new Error("Failed to dismiss notification");
          }
          return (await fv.json()) as {
            success: true;
            notification: Notification;
          };
        })
      );
      const re = response
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value.notification);

      return { docs: re.map((r) => convertToSyncedNotification(r)), user };
    },
    onMutate: async (variables, context) => {
      const { user, ids } = variables;
      await context.client.cancelQueries({
        queryKey: ["NOTIFY", { user: user }]
      });
      const previousNotifications =
        (context.client.getQueryData(["NOTIFY", { user: user }]) as
          | SyncedNotification[]
          | undefined) || ([] as SyncedNotification[]);
      const nowD = DateTime.now();
      context.client.setQueryData(
        ["NOTIFY", { user: user }],
        [
          ...previousNotifications.map((r) =>
            DateTime.fromISO(r.updatedAt) <= nowD && (!r.dismissed || !r.read)
              ? {
                  ...r
                }
              : r
          )
        ]
      );
      return { previousNotifications };
    },
    onSettled: (res, error, variables, onMutateResult, context) => {
      const { user } = variables;
      context.client.invalidateQueries({
        queryKey: ["NOTIFY", { user: user }]
      });
    },

    onError: (err, variables, onMutateResult, context) => {
      const { user } = variables;
      context.client.setQueryData(
        ["NOTIFY", { user: user }],
        onMutateResult?.previousNotifications
      );
    }
  });
  const {
    mutateAsync: readAllMutate,
    isError: isErrorReadAll,
    isPending: isPendingReadAll
  } = useMutation({
    scope: { id: "NOTIFY" + user },
    mutationFn: async ({ user, now }: { user: string; now: number }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        }
      );
      if (!response.ok) {
        throw new Error("Failed to read all notifications");
      }
      const re = await response.json().then(
        (r) =>
          r as {
            message: string;
            docs: Notification[];
            updatedCount: number;
          }
      );
      return { docs: re.docs.map((r) => convertToSyncedNotification(r)), user };
    },
    onMutate: async (variables: { user: string; now: number }, context) => {
      const { user, now } = variables;

      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await context.client.cancelQueries({
        queryKey: ["NOTIFY", { user: user }]
      });

      // Snapshot the previous value
      const docs = context.client.getQueryData(["NOTIFY", { user: user }]);
      const previousNotifications = [...(docs as SyncedNotification[])];
      const nowD = DateTime.fromMillis(now);
      const nowISO = nowD.toISO();
      // Optimistically update to the new value
      context.client.setQueryData(
        ["NOTIFY", { user: user }],
        [
          ...previousNotifications.map((r) =>
            DateTime.fromISO(r.updatedAt) <= nowD && (!r.dismissed || !r.read)
              ? {
                  ...r,
                  read: true,
                  readAt: nowISO,
                  status: r.status === "unread" ? "read" : r.status
                }
              : r
          )
        ]
      );

      // Return a result with the snapshotted value
      return { previousNotifications };
    },
    // onSuccess: (res, variables, onMutateResult, context) => {
    //   const { docs, user, timestamp } = res;
    //   updateNotification(docs.map((d) => convertToSyncedNotification(d)));
    //   setChanged((s) => s.filter((s) => s.timestamp < timestamp));
    //   qc.invalidateQueries({
    //     queryKey: ["NOTIFY", { user: user }]
    //   });
    // },
    onSettled: (res, error, variables, onMutateResult, context) => {
      const { user } = variables;
      context.client.invalidateQueries({
        queryKey: ["NOTIFY", { user: user }]
      });
    },

    onError: (err, variables, onMutateResult, context) => {
      const { user } = variables;
      context.client.setQueryData(
        ["NOTIFY", { user: user }],
        onMutateResult?.previousNotifications
      );
    }
  });

  const updateAllRead = useCallback(
    ({ user }: { user: string }) => {
      readAllMutate({ user, now: Date.now() });
    },
    [readAllMutate]
  );
  useEffect(() => {
    user && updateU(user);
  }, [user, updateU]);

  const setRead = useCallback(({ ids }: { ids: string[] }) => {}, []);
  const setDismissed = useCallback(
    ({ ids }: { ids: string[] }) => {
      dismiss({ user, ids });
    },
    [dismiss, user]
  );
  const setAllRead = useCallback(() => {
    updateAllRead({ user });
  }, [updateAllRead, user]);

  return (
    <NotifyContext.Provider
      value={{
        lastFetched,
        notifications: Array.from(notifications.values()),
        count,
        isLoading: isLoading || isLoadingNotifications || isPendingReadAll,
        setRead,
        setDismissed,
        setAllRead
        // isSSEConnected
      }}
    >
      {children}
    </NotifyContext.Provider>
  );
};

const NotificationInternal = ({
  user,
  children
}: {
  user: string;
  children: ReactNode;
}) => {
  const notific = useRef<NotificationAPI>(undefined!);
  if (!notific.current) {
    notific.current = createNotificationStore({ user });
  }
  return (
    <NotificationContext.Provider value={notific.current}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNore = <T,>(selector: (store: NotificationStore) => T) => {
  const not = useContext(NotificationContext);
  if (!not)
    throw new Error(
      "useNotificationStore must be used within a NotificationProvider"
    );
  return useStore(not, selector);
};

export const useNotifications = () => {
  const not = useContext(NotifyContext);
  if (!not)
    throw new Error(
      "useNotificationStore must be used within a NotificationProvider"
    );
  return not;
};
