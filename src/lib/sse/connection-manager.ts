import { getPayload } from "@/lib/payload";
import { type SyncedNotification } from "@/payload/collections/Notifications/hooks/types";
import { SSEMessage, TypedSSEWriter } from "./types";

export interface SSEConnection {
  id: string;
  userId: string;
  sessionId: string;
  writer: WritableStreamDefaultWriter | TypedSSEWriter;
  createdAt: Date;
  lastHeartbeat: Date;
  isActive: boolean;
}

export interface SSEWriter {
  write: (data: SSEMessage) => void;
  close: () => void;
}

export interface ConnectionManagerOptions {
  heartbeatInterval?: number;
  connectionTimeout?: number;
  maxConnectionsPerUser?: number;
  cleanupInterval?: number;
  sessionValidationBatchSize?: number;
}

class SSEConnectionManager {
  private connections = new Map<string, SSEConnection>();
  private userConnections = new Map<string, Set<string>>();
  private heartbeatInterval: number;
  private connectionTimeout: number;
  private maxConnectionsPerUser: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private sessionValidationBatchSize: number;

  constructor(options: ConnectionManagerOptions = {}) {
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30 seconds
    this.connectionTimeout = options.connectionTimeout || 90000; // 90 seconds
    this.maxConnectionsPerUser = options.maxConnectionsPerUser || 5; // Max 5 connections per user
    this.sessionValidationBatchSize = options.sessionValidationBatchSize || 100;

    // Start cleanup interval
    this.startCleanupInterval(options.cleanupInterval || 60000); // 1 minute
  }

  /**
   * Add a new SSE connection with session validation
   */
  async addConnection(
    connectionId: string,
    userId: string,
    sessionId: string,
    writer: WritableStreamDefaultWriter | TypedSSEWriter
  ): Promise<boolean> {
    try {
      // Validate session is still active
      const isValidSession = await this.validateSession(userId, sessionId);
      if (!isValidSession) {
        console.warn(`Invalid session for user ${userId}, connection rejected`);
        return false;
      }

      // Check connection limits per user
      const userConnectionIds = this.userConnections.get(userId) || new Set();
      if (userConnectionIds.size >= this.maxConnectionsPerUser) {
        // Remove oldest connection
        const oldestConnectionId = Array.from(userConnectionIds)[0];
        await this.removeConnection(
          oldestConnectionId,
          "connection_limit_exceeded"
        );
      }

      // Create connection object
      const connection: SSEConnection = {
        id: connectionId,
        userId,
        sessionId,
        writer,
        createdAt: new Date(),
        lastHeartbeat: new Date(),
        isActive: true
      };

      // Store connection
      this.connections.set(connectionId, connection);

      // Update user connections index
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);

      console.log(`SSE connection added: ${connectionId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to add SSE connection: ${error}`);
      return false;
    }
  }

  /**
   * Remove a connection and clean up
   */
  async removeConnection(connectionId: string, reason?: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Close the connection
      if (connection.isActive) {
        connection.writer.close();
        connection.isActive = false;
      }

      // Remove from connections map
      this.connections.delete(connectionId);

      // Remove from user connections index
      const userConnectionIds = this.userConnections.get(connection.userId);
      if (userConnectionIds) {
        userConnectionIds.delete(connectionId);
        if (userConnectionIds.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }

      console.log(
        `SSE connection removed: ${connectionId} (${reason || "manual"})`
      );
    } catch (error) {
      console.error(`Error removing connection ${connectionId}:`, error);
    }
  }

  /**
   * Update heartbeat for a connection
   */
  updateHeartbeat(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = new Date();
    }
  }

  /**
   * Broadcast notification to specific user
   */
  async broadcastToUser(
    userId: string,
    notification: SyncedNotification,
    action: "created" | "updated" | "deleted"
  ): Promise<void> {
    const userConnectionIds = this.userConnections.get(userId);
    if (!userConnectionIds || userConnectionIds.size === 0) {
      return;
    }

    const message: SSEMessage = {
      type: "notification_update",
      action,
      notification,
      timestamp: new Date().toISOString()
    };

    const deadConnections: string[] = [];

    for (const connectionId of userConnectionIds) {
      const connection = this.connections.get(connectionId);
      if (!connection || !connection.isActive) {
        deadConnections.push(connectionId);
        continue;
      }

      try {
        connection.writer.write(message);
      } catch (error) {
        console.error(
          `Error broadcasting to connection ${connectionId}:`,
          error
        );
        deadConnections.push(connectionId);
      }
    }

    // Clean up dead connections
    for (const connectionId of deadConnections) {
      await this.removeConnection(connectionId, "write_error");
    }
  }

  /**
   * Broadcast to all connected users
   */
  async broadcastToAll(data: SSEMessage): Promise<void> {
    const deadConnections: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (!connection.isActive) {
        deadConnections.push(connectionId);
        continue;
      }

      try {
        connection.writer.write(data);
      } catch (error) {
        console.error(
          `Error broadcasting to connection ${connectionId}:`,
          error
        );
        deadConnections.push(connectionId);
      }
    }

    // Clean up dead connections
    for (const connectionId of deadConnections) {
      await this.removeConnection(connectionId, "broadcast_error");
    }
  }

  /**
   * Remove all connections for a user (e.g., on sign out)
   */
  async removeUserConnections(userId: string, reason?: string): Promise<void> {
    const userConnectionIds = this.userConnections.get(userId);
    if (!userConnectionIds) return;

    const connectionIds = Array.from(userConnectionIds);
    for (const connectionId of connectionIds) {
      await this.removeConnection(connectionId, reason || "user_signout");
    }
  }

  /**
   * Validate session is still active
   */
  private async validateSession(
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    try {
      const payload = await getPayload();

      // Query the sessions collection to verify the session is still active
      const session = await payload.find({
        collection: "sessions",
        where: {
          and: [
            { id: { equals: sessionId } },
            { userId: { equals: userId } },
            { expiresAt: { greater_than: new Date().toISOString() } }
          ]
        },
        limit: 1
      });

      return session.docs.length > 0;
    } catch (error) {
      console.error(`Session validation error for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Start periodic cleanup of stale connections
   */
  private startCleanupInterval(interval: number): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStaleConnections();
    }, interval);
  }

  /**
   * Clean up stale connections (no heartbeat, expired sessions)
   */
  private async cleanupStaleConnections(): Promise<void> {
    const now = new Date();
    const staleConnections: string[] = [];
    const connectionsToValidate: SSEConnection[] = [];

    // First pass: Check heartbeat timeouts
    for (const [connectionId, connection] of this.connections) {
      const timeSinceHeartbeat =
        now.getTime() - connection.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > this.connectionTimeout) {
        staleConnections.push(connectionId);
      } else {
        connectionsToValidate.push(connection);
      }
    }

    // Second pass: Batch validate sessions to reduce database load
    const sessionValidationPromises: Promise<void>[] = [];

    for (
      let i = 0;
      i < connectionsToValidate.length;
      i += this.sessionValidationBatchSize
    ) {
      const batch = connectionsToValidate.slice(
        i,
        i + this.sessionValidationBatchSize
      );
      sessionValidationPromises.push(
        this.validateSessionBatch(batch, staleConnections)
      );
    }

    await Promise.all(sessionValidationPromises);

    // Remove stale connections
    for (const connectionId of staleConnections) {
      await this.removeConnection(connectionId, "stale_connection");
    }

    if (staleConnections.length > 0) {
      console.log(
        `Cleaned up ${staleConnections.length} stale SSE connections`
      );
    }
  }

  /**
   * Validate a batch of sessions to reduce database queries
   */
  private async validateSessionBatch(
    connections: SSEConnection[],
    staleConnections: string[]
  ): Promise<void> {
    try {
      const payload = await getPayload();

      // Extract unique session IDs from the batch
      const sessionIds = [...new Set(connections.map((c) => c.sessionId))];

      // Single query to validate all sessions in this batch
      const validSessions = await payload.find({
        collection: "sessions",
        where: {
          and: [
            { id: { in: sessionIds } },
            { expiresAt: { greater_than: new Date().toISOString() } }
          ]
        },
        limit: sessionIds.length
      });

      const validSessionIds = new Set(validSessions.docs.map((s) => s.id));

      // Mark connections with invalid sessions as stale
      for (const connection of connections) {
        if (!validSessionIds.has(connection.sessionId)) {
          staleConnections.push(connection.id);
        }
      }
    } catch (error) {
      console.error("Batch session validation error:", error);
      // On error, mark all connections in this batch as stale to be safe
      for (const connection of connections) {
        staleConnections.push(connection.id);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeUsers: number;
    connectionsPerUser: Record<string, number>;
  } {
    const connectionsPerUser: Record<string, number> = {};

    for (const [userId, connectionIds] of this.userConnections) {
      connectionsPerUser[userId] = connectionIds.size;
    }

    return {
      totalConnections: this.connections.size,
      activeUsers: this.userConnections.size,
      connectionsPerUser
    };
  }

  /**
   * Graceful shutdown - close all connections
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const connectionIds = Array.from(this.connections.keys());
    for (const connectionId of connectionIds) {
      await this.removeConnection(connectionId, "server_shutdown");
    }

    console.log("SSE Connection Manager shutdown complete");
  }
}

// Create singleton instance
export const sseConnectionManager = new SSEConnectionManager({
  heartbeatInterval: 30000,
  connectionTimeout: 90000,
  maxConnectionsPerUser: 5,
  cleanupInterval: 60000,
  sessionValidationBatchSize: 100
});

// Graceful shutdown on process termination
process.on("SIGTERM", async () => {
  await sseConnectionManager.shutdown();
});

process.on("SIGINT", async () => {
  await sseConnectionManager.shutdown();
});
