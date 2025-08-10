import {
	createNotificationStore,
	NotificationStore,
} from "@/stores/Notification/NotificationStore";
import {createContext, ReactNode, useContext, useEffect, useRef} from "react";
import {useStore} from "zustand";
import {useQuery} from "@tanstack/react-query";
import {StoreApi} from "zustand";
import {SyncedNotification} from "@collections/Notifications/hooks/types";
import {useRPSession} from "@/lib/auth/session/RP_SessionProvider";

type NotificationAPI = StoreApi<NotificationStore>;
const NotificationContext = createContext<NotificationAPI | undefined>(
	undefined,
);
export const NotificationProvider = ({children}: { children: ReactNode }) => {
	return (
		<NotificationInternal>
			<NotifyProxy>{children}</NotifyProxy>
		</NotificationInternal>
	);
};
const NotifyContext = createContext<{
	notifications: SyncedNotification[];
	count: number;
	lastFetched: number;
	isLoading: boolean;
}>({notifications: [], count: 0, lastFetched: 0, isLoading: false});
const NotifyProxy = ({children}: { children: ReactNode }) => {
	const lastFetched = useNore((s) => s.lastFetched);
	const updateNo = useNore((s) => s.updateNotification);
	const updateU = useNore((r) => r.updateUser);
	const user = useRPSession((r) => r);
	const notifications = useNore((s) => s.notifications);
	const count = useNore((r) => r.totalCount);
	const {isLoading, data, isLoadingError, isError} = useQuery({
		queryKey: ["NOTIFY", {user: user?.id || null}],

		queryFn: async ({queryKey}) => {
			const [_, k] = queryKey;
			const {user} = k as { user: string | null };
			if (!user) {
				return [];
			}

			const fetchString = lastFetched > 0 ? `?timestamp=${lastFetched}` : ``;
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/me/${fetchString}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				},
			);
			if (!response.ok) {
				console.error(response);
				throw new Error("Failed to fetch notifications");
			} else {
				const re = await response.json().
					then((r) => r.notifications as SyncedNotification[]);
				return re;
			}
		},
		enabled: !!user,
		staleTime: 2 * 60 * 1000,
	});
	useEffect(() => {
		data && updateNo(data);
	}, [data, updateNo]);
	useEffect(() => {
		user && updateU(user.id);
	}, [user, updateU]);
	return (
		<NotifyContext.Provider value={{
			lastFetched,
			notifications,
			count,
			isLoading,
		}}>
			{children}
		</NotifyContext.Provider>
	);
};
const NotificationInternal = ({children}: { children: ReactNode }) => {
	const notific = useRef<NotificationAPI>(undefined!);
	if (!notific.current) {
		notific.current = createNotificationStore();
	}
	return (
		<NotificationContext.Provider value={notific.current}>
			{children}
		</NotificationContext.Provider>
	);
};
const useNore = <T, >(selector: (store: NotificationStore) => T) => {
	const not = useContext(NotificationContext);
	if (!not)
		throw new Error(
			"useNotificationStore must be used within a NotificationProvider",
		);
	return useStore(not, selector);
};
export const useNotifications = () => {
	const not = useContext(NotifyContext);
	if (!not)
		throw new Error(
			"useNotificationStore must be used within a NotificationProvider",
		);
	return not;
};
