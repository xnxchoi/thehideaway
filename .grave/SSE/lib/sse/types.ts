import { SyncedNotification } from "../../../../src/payload/collections/Notifications/hooks/types";

// SSE Message Types
export interface SSEBaseMessage {
  timestamp: string;
}

export interface SSEConnectedMessage extends SSEBaseMessage {
  type: "connected";
  userId: string;
  connectionId: string;
}

export interface SSEHeartbeatMessage extends SSEBaseMessage {
  type: "heartbeat";
}

export interface SSENotificationUpdateMessage extends SSEBaseMessage {
  type: "notification_update";
  action: "created" | "updated" | "deleted";
  notification: SyncedNotification;
}

export interface SSEErrorMessage extends SSEBaseMessage {
  type: "error";
  error: string;
}

export type SSEMessage =
  | SSEConnectedMessage
  | SSEHeartbeatMessage
  | SSENotificationUpdateMessage
  | SSEErrorMessage;

// Connection Status Types
export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

// Notification Status Types
export type NotificationStatus =
  | "loading"
  | "offline"
  | "new_notifications"
  | "up_to_date";

// Enhanced SSE Writer Interface
export interface TypedSSEWriter {
  write: (data: SSEMessage) => void;
  close: () => void;
}

// Context Provider State
export interface NotificationContextState {
  // Connection status
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  reconnectAttempts: number;

  // Notification status
  notificationStatus: NotificationStatus;
  hasNewNotifications: boolean;
  lastSeenTimestamp: string | null;

  // Notification data
  notifications: Map<string, SyncedNotification>;
  unreadCount: number;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAsDismissed: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateLastSeen: () => void;

  // Connection controls
  reconnect: () => void;
  disconnect: () => void;
}
