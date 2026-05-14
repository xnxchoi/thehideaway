# Secure SSE Connection Management

This document explains the secure Server-Sent Events (SSE) connection management system that replaces the previous unsafe global Map approach with a comprehensive solution that validates sessions, handles multiple connections per user, and integrates with better-auth lifecycle events.

## Problem with Previous Implementation

The original SSE implementation had several security and reliability issues:

1. **Memory Leaks**: Global `Map<string, WritableStreamDefaultWriter>()` accumulated stale connections
2. **No Session Validation**: Connections weren't validated against active sessions
3. **Single Connection Limit**: Only one connection per user (problematic for multiple tabs/devices)
4. **No Auth Integration**: No cleanup when users sign out or sessions expire
5. **Server Restart Issues**: All connections lost on server restart with no recovery mechanism

## New Secure Architecture

### 1. SSE Connection Manager (`/src/lib/sse/connection-manager.ts`)

A centralized connection manager that provides:

- **Session Validation**: Validates each connection against active better-auth sessions
- **Multiple Connections**: Supports up to 5 connections per user (configurable)
- **Automatic Cleanup**: Removes stale connections based on heartbeat and session expiration
- **Connection Limits**: Prevents resource exhaustion by limiting connections per user
- **Graceful Shutdown**: Properly closes all connections on server shutdown

```typescript
interface SSEConnection {
  id: string; // Unique connection identifier
  userId: string; // User ID from better-auth
  sessionId: string; // Session ID for validation
  writer: SSEWriter; // Connection writer interface
  createdAt: Date; // Connection creation time
  lastHeartbeat: Date; // Last heartbeat received
  isActive: boolean; // Connection status
}
```

### 2. Better-Auth Integration (`/src/lib/auth/hooks/sse-integration.ts`)

Hooks that integrate with better-auth lifecycle events:

- **onSignOut**: Removes all user connections when signing out
- **onSessionExpired**: Removes connections for expired sessions
- **onUserDeleted**: Removes connections when user is deleted/banned

### 3. PayloadCMS Hooks

Integration hooks for PayloadCMS collections:

- **User Hooks** (`/src/payload/collections/Users/hooks/sse-integration.ts`): Handle user banning/deletion
- **Session Hooks** (`/src/payload/collections/Sessions/hooks/sse-integration.ts`): Handle session lifecycle

### 4. Updated SSE Endpoint (`/src/app/api/notifications/stream/route.ts`)

The SSE endpoint now:

- Validates user session before creating connection
- Generates unique connection IDs using nanoid
- Uses the connection manager for all operations
- Properly handles connection cleanup

## Security Features

### Session Validation

Every SSE connection is validated against active better-auth sessions:

```typescript
private async validateSession(userId: string, sessionId: string): Promise<boolean> {
  const session = await payload.find({
    collection: 'sessions',
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
}
```

### Connection Limits

Prevents resource exhaustion by limiting connections per user:

```typescript
// Check connection limits per user
const userConnectionIds = this.userConnections.get(userId) || new Set();
if (userConnectionIds.size >= this.maxConnectionsPerUser) {
  // Remove oldest connection
  const oldestConnectionId = Array.from(userConnectionIds)[0];
  await this.removeConnection(oldestConnectionId, "connection_limit_exceeded");
}
```

### Automatic Cleanup

Regular cleanup of stale connections:

```typescript
private async cleanupStaleConnections(): Promise<void> {
  const now = new Date();
  const staleConnections: string[] = [];

  for (const [connectionId, connection] of this.connections) {
    // Check heartbeat timeout
    const timeSinceHeartbeat = now.getTime() - connection.lastHeartbeat.getTime();
    if (timeSinceHeartbeat > this.connectionTimeout) {
      staleConnections.push(connectionId);
      continue;
    }

    // Validate session is still active
    const isValidSession = await this.validateSession(connection.userId, connection.sessionId);
    if (!isValidSession) {
      staleConnections.push(connectionId);
    }
  }

  // Remove stale connections
  for (const connectionId of staleConnections) {
    await this.removeConnection(connectionId, 'stale_connection');
  }
}
```

## Configuration

### Connection Manager Options

```typescript
interface ConnectionManagerOptions {
  heartbeatInterval?: number; // Default: 30000ms (30 seconds)
  connectionTimeout?: number; // Default: 90000ms (90 seconds)
  maxConnectionsPerUser?: number; // Default: 5 connections
  cleanupInterval?: number; // Default: 60000ms (1 minute)
}
```

### Environment Variables

No additional environment variables required. Uses existing:

- `NEXT_PUBLIC_SERVER_URL`: For SSE endpoint URL
- Better-auth configuration from `betterAuthOptions`

## Integration Steps

### 1. Add Connection Manager Hooks to PayloadCMS Collections

Update your PayloadCMS collection configurations to include the SSE hooks:

```typescript
// In your users collection configuration
import {
  afterUserChange,
  afterUserDelete
} from "@/payload/collections/Users/hooks/sse-integration";

export const Users: CollectionConfig = {
  // ... other config
  hooks: {
    afterChange: [afterUserChange],
    afterDelete: [afterUserDelete]
  }
};

// In your sessions collection configuration
import {
  afterSessionChange,
  afterSessionDelete
} from "@/payload/collections/Sessions/hooks/sse-integration";

export const Sessions: CollectionConfig = {
  // ... other config
  hooks: {
    afterChange: [afterSessionChange],
    afterDelete: [afterSessionDelete]
  }
};
```

### 2. Update Better-Auth Configuration (Optional)

For more advanced integration, you can add hooks to your better-auth configuration:

```typescript
// In your better-auth options
import { onSignOut } from "@/lib/auth/hooks/sse-integration";

export const betterAuthOptions = {
  // ... other options
  hooks: {
    after: [
      {
        matcher: (ctx) => ctx.path === "/sign-out",
        handler: async (ctx) => {
          if (ctx.user?.id) {
            await onSignOut(ctx.user.id);
          }
        }
      }
    ]
  }
};
```

## Monitoring and Debugging

### Connection Statistics

Get real-time connection statistics:

```typescript
import { sseConnectionManager } from "@/lib/sse/connection-manager";

const stats = sseConnectionManager.getStats();
console.log({
  totalConnections: stats.totalConnections,
  activeUsers: stats.activeUsers,
  connectionsPerUser: stats.connectionsPerUser
});
```

### Debug Logging

The system includes comprehensive logging:

- Connection establishment/termination
- Session validation failures
- Cleanup operations
- Error handling

### Health Check Endpoint (Optional)

Create a health check endpoint to monitor SSE connections:

```typescript
// /src/app/api/sse/health/route.ts
import { sseConnectionManager } from "@/lib/sse/connection-manager";

export async function GET() {
  const stats = sseConnectionManager.getStats();
  return Response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    connections: stats
  });
}
```

## Benefits of New Implementation

1. **Security**: Session validation prevents unauthorized connections
2. **Reliability**: Automatic cleanup prevents memory leaks
3. **Scalability**: Connection limits prevent resource exhaustion
4. **Multi-device Support**: Multiple connections per user
5. **Integration**: Proper cleanup on auth events
6. **Monitoring**: Built-in statistics and logging
7. **Graceful Shutdown**: Proper cleanup on server restart

## Migration from Old Implementation

The new implementation is backward compatible:

1. **Same API**: No changes to client-side code required
2. **Automatic Migration**: Old global Map is replaced transparently
3. **Enhanced Security**: Additional validation without breaking changes
4. **Better Performance**: More efficient connection management

## Production Considerations

### Horizontal Scaling

For multi-server deployments, consider:

1. **Session Affinity**: Route users to the same server for SSE connections
2. **Redis Pub/Sub**: Share connection state across servers
3. **Load Balancer**: Configure sticky sessions for SSE endpoints

### Performance Monitoring

Monitor these metrics in production:

- Connection count per server
- Session validation latency
- Cleanup operation frequency
- Memory usage trends

### Error Handling

The system includes comprehensive error handling:

- Connection failures are logged and cleaned up
- Session validation errors don't crash the server
- Broadcast errors remove dead connections automatically

This secure SSE implementation provides a robust foundation for real-time notifications while maintaining security and reliability standards.
