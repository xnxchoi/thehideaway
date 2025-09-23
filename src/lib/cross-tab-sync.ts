/**
 * Cross-tab synchronization using Broadcast Channel API
 * Ensures notification state is shared across all browser tabs
 */

export interface CrossTabMessage {
  type:
    | "notification_update"
    | "notification_read"
    | "notification_dismissed"
    | "store_sync";
  payload: any;
  timestamp: number;
  tabId: string;
}

export interface NotificationStateSync {
  type: "notification_read" | "notification_dismissed";
  notificationId: string;
  userId: string;
}

export interface StoreStateSync {
  type: "store_sync";
  notifications: Map<string, any>;
  lastFetched: number;
  count: number;
}

class CrossTabSyncManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private listeners = new Map<string, ((message: CrossTabMessage) => void)[]>();

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("notification_sync");
      this.channel.addEventListener("message", this.handleMessage.bind(this));
    }
  }

  private handleMessage(event: MessageEvent<CrossTabMessage>) {
    const message = event.data;

    // Don't process messages from the same tab
    if (message.tabId === this.tabId) return;

    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach((listener) => listener(message));
  }

  public subscribe(type: string, listener: (message: CrossTabMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  public broadcast(type: CrossTabMessage["type"], payload: any) {
    if (!this.channel) return;

    const message: CrossTabMessage = {
      type,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId
    };

    this.channel.postMessage(message);
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const crossTabSync = new CrossTabSyncManager();
