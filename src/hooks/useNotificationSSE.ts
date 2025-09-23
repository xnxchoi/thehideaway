import { useEffect, useRef, useCallback, useState } from "react";
import { SyncedNotification } from "@/payload/collections/Notifications/hooks/types";

export interface SSENotificationEvent {
  type: "connected" | "heartbeat" | "notification_update" | "error";
  action?: "created" | "updated" | "deleted";
  notification?: SyncedNotification;
  timestamp: string;
  userId?: string;
  error?: string;
}

export interface UseNotificationSSEOptions {
  enabled?: boolean;
  onNotificationUpdate?: (
    notification: SyncedNotification,
    action: "created" | "updated" | "deleted"
  ) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useNotificationSSE({
  enabled = true,
  onNotificationUpdate,
  onConnectionChange,
  onError,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseNotificationSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnecting(false);
      setTimedOut(false);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    cleanup();

    setIsConnecting(true);
    try {
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/notifications/stream`,
        {
          withCredentials: true
        }
      );

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        console.log("SSE connection established");
        setIsConnected(true);
        setReconnectAttempts(0);
        onConnectionChange?.(true);
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data: SSENotificationEvent = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              console.log("SSE connected for user:", data.userId);
              break;

            case "heartbeat":
              // Keep connection alive - no action needed
              break;

            case "notification_update":
              if (data.notification && data.action) {
                onNotificationUpdate?.(data.notification, data.action);
              }
              break;

            case "error":
              console.error("SSE server error:", data.error);
              onError?.(new Error(data.error || "Unknown SSE error"));
              break;

            default:
              console.log("Unknown SSE event type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
          onError?.(error as Error);
        }
      };

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;

        console.error("SSE connection error:", error);
        setIsConnected(false);
        onConnectionChange?.(false);
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          setIsConnecting(true);
          setTimedOut(false);
          setReconnectAttempts((prev) => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log(
                `Attempting to reconnect SSE (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`
              );
              connect();
            }
          }, reconnectInterval);
        } else {
          console.error("Max SSE reconnection attempts reached");
          onError?.(
            new Error(
              "Failed to establish SSE connection after maximum attempts"
            )
          );
          setTimedOut(true);
          setIsConnecting(false);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("Error creating SSE connection:", error);
      onError?.(error as Error);
    }
  }, [
    enabled,
    onNotificationUpdate,
    onConnectionChange,
    onError,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectInterval,
    cleanup
  ]);

  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
    onConnectionChange?.(false);
  }, [cleanup, onConnectionChange]);

  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, connect, disconnect, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    reconnect,
    maxReconnectAttempts,
    isConnecting
  };
}
