"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from "react";
import { useNotificationSSE } from "@/hooks/useNotificationSSE";
import {
  NotificationContextState,
  ConnectionStatus,
  NotificationStatus
} from "@/lib/sse/types";
import { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import { crossTabSync, CrossTabMessage } from "@/lib/cross-tab-sync";

interface NotificationProviderProps {
  children: React.ReactNode;
  userId: string;
}

const NotificationContext = createContext<NotificationContextState | null>(
  null
);

export function EnhancedNotificationProvider({
  children,
  userId
}: NotificationProviderProps) {
  // State management
  const [notifications, setNotifications] = useState<
    Map<string, SyncedNotification>
  >(new Map());
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>("loading");
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string | null>(
    null
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Refs for stable references
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // SSE Connection
  const {
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
    isConnecting
  } = useNotificationSSE({
    enabled: !!userId,
    onNotificationUpdate: handleNotificationUpdate,
    onConnectionChange: handleConnectionChange,
    onError: handleSSEError
  });

  // Update connection status based on SSE state
  useEffect(() => {
    if (isConnecting) {
      setConnectionStatus("connecting");
    } else if (isConnected) {
      setConnectionStatus("connected");
      setNotificationStatus("up_to_date");
    } else if (reconnectAttempts > 0) {
      setConnectionStatus("reconnecting");
      setNotificationStatus("offline");
    } else {
      setConnectionStatus("disconnected");
      setNotificationStatus("offline");
    }
  }, [isConnected, isConnecting, reconnectAttempts]);

  // Handle SSE notification updates
  function handleNotificationUpdate(
    notification: SyncedNotification,
    action: "created" | "updated" | "deleted"
  ) {
    setNotifications((prev) => {
      const newMap = new Map(prev);

      switch (action) {
        case "created":
          newMap.set(notification.id, notification);
          setHasNewNotifications(true);
          setNotificationStatus("new_notifications");
          break;
        case "updated":
          if (newMap.has(notification.id)) {
            newMap.set(notification.id, {
              ...newMap.get(notification.id)!,
              ...notification
            });
          }
          break;
        case "deleted":
          newMap.delete(notification.id);
          break;
      }

      return newMap;
    });

    // Broadcast to other tabs
    crossTabSync.broadcast("notification_update", {
      notification,
      action,
      userId
    });
  }

  // Handle SSE connection changes
  function handleConnectionChange(connected: boolean) {
    console.log(`SSE connection ${connected ? "established" : "lost"}`);
  }

  // Handle SSE errors
  function handleSSEError(error: Error) {
    console.error("SSE Error:", error);
    setConnectionStatus("failed");
    setNotificationStatus("offline");
  }

  // Cross-tab synchronization
  useEffect(() => {
    const unsubscribeNotificationUpdate = crossTabSync.subscribe(
      "notification_update",
      (message: CrossTabMessage) => {
        const { notification, action } = message.payload;
        if (message.payload.userId === userIdRef.current) {
          handleNotificationUpdate(notification, action);
        }
      }
    );

    const unsubscribeRead = crossTabSync.subscribe(
      "notification_read",
      (message: CrossTabMessage) => {
        const { notificationId, userId: msgUserId } = message.payload;
        if (msgUserId === userIdRef.current) {
          setNotifications((prev) => {
            const newMap = new Map(prev);
            const notification = newMap.get(notificationId);
            if (notification) {
              newMap.set(notificationId, { ...notification, read: true });
            }
            return newMap;
          });
        }
      }
    );

    const unsubscribeDismissed = crossTabSync.subscribe(
      "notification_dismissed",
      (message: CrossTabMessage) => {
        const { notificationId, userId: msgUserId } = message.payload;
        if (msgUserId === userIdRef.current) {
          setNotifications((prev) => {
            const newMap = new Map(prev);
            const notification = newMap.get(notificationId);
            if (notification) {
              newMap.set(notificationId, { ...notification, dismissed: true });
            }
            return newMap;
          });
        }
      }
    );

    return () => {
      unsubscribeNotificationUpdate();
      unsubscribeRead();
      unsubscribeDismissed();
    };
  }, []);

  // Calculate unread count
  useEffect(() => {
    const unread = Array.from(notifications.values()).filter(
      (n) => !n.read && !n.dismissed
    ).length;
    setUnreadCount(unread);
  }, [notifications]);

  // API Actions
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            credentials: "include"
          }
        );

        if (response.ok) {
          setNotifications((prev) => {
            const newMap = new Map(prev);
            const notification = newMap.get(notificationId);
            if (notification) {
              newMap.set(notificationId, { ...notification, read: true });
            }
            return newMap;
          });

          // Broadcast to other tabs
          crossTabSync.broadcast("notification_read", {
            notificationId,
            userId
          });
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [userId]
  );

  const markAsDismissed = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(
          `/api/notifications/${notificationId}/dismiss`,
          {
            method: "PATCH",
            credentials: "include"
          }
        );

        if (response.ok) {
          setNotifications((prev) => {
            const newMap = new Map(prev);
            const notification = newMap.get(notificationId);
            if (notification) {
              newMap.set(notificationId, { ...notification, dismissed: true });
            }
            return newMap;
          });

          // Broadcast to other tabs
          crossTabSync.broadcast("notification_dismissed", {
            notificationId,
            userId
          });
        }
      } catch (error) {
        console.error("Failed to dismiss notification:", error);
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include"
      });

      if (response.ok) {
        setNotifications((prev) => {
          const newMap = new Map(prev);
          for (const [id, notification] of newMap) {
            if (!notification.read) {
              newMap.set(id, { ...notification, read: true });
            }
          }
          return newMap;
        });

        // Broadcast to other tabs
        crossTabSync.broadcast("notification_read", {
          notificationId: "all",
          userId
        });
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [userId]);

  const updateLastSeen = useCallback(() => {
    const now = new Date().toISOString();
    setLastSeenTimestamp(now);
    setHasNewNotifications(false);
    setNotificationStatus("up_to_date");

    // Store in localStorage for persistence
    localStorage.setItem(`notification_last_seen_${userId}`, now);
  }, [userId]);

  // Load last seen timestamp on mount
  useEffect(() => {
    const stored = localStorage.getItem(`notification_last_seen_${userId}`);
    if (stored) {
      setLastSeenTimestamp(stored);
    }
  }, [userId]);

  // Context value
  const contextValue: NotificationContextState = {
    // Connection status
    connectionStatus,
    isConnected,
    reconnectAttempts,

    // Notification status
    notificationStatus,
    hasNewNotifications,
    lastSeenTimestamp,

    // Notification data
    notifications,
    unreadCount,

    // Actions
    markAsRead,
    markAsDismissed,
    markAllAsRead,
    updateLastSeen,

    // Connection controls
    reconnect,
    disconnect
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextState {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within EnhancedNotificationProvider"
    );
  }
  return context;
}
