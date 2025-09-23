# Server-Sent Events (SSE) Real-Time Notifications

This document describes the implementation of a Server-Sent Events (SSE) based real-time notification system that replaces the previous polling mechanism with efficient real-time updates.

## Overview

The SSE implementation provides real-time notification updates to clients without the need for constant HTTP polling. When a user logs in, a persistent connection is established with the server that listens for notification events. Whenever notifications are created, updated, or deleted for a specific user, the server pushes these updates directly to the client.

## Architecture

### Components

1. **SSE API Endpoint** (`/src/app/api/notifications/stream/route.ts`)
   - Handles SSE connections
   - Manages active connections per user
   - Broadcasts updates to specific users
   - Implements heartbeat mechanism

2. **SSE Client Hook** (`/src/hooks/useNotificationSSE.ts`)
   - Manages EventSource connection
   - Handles reconnection logic
   - Processes incoming SSE events
   - Provides connection status

3. **Updated Notification Store** (`/src/stores/Notification/NotificationStore.ts`)
   - Added SSE-specific actions
   - Handles real-time updates
   - Manages notification state changes

4. **Enhanced Notification Provider** (`/src/providers/Notifications/index.tsx`)
   - Integrates SSE connection
   - Fallback to HTTP polling when SSE unavailable
   - Optimized query behavior based on connection status

5. **PayloadCMS Hooks** (`/src/payload/collections/Notifications/hooks/sse-hooks.ts`)
   - Triggers SSE broadcasts on notification changes
   - Handles create, update, and delete operations

## Features

### Real-Time Updates

- **Create**: New notifications appear instantly
- **Update**: Status changes (read/unread) sync immediately
- **Delete**: Removed notifications disappear from all connected clients

### Connection Management

- **Auto-reconnection**: Automatic reconnection with exponential backoff
- **Heartbeat**: Keeps connections alive with periodic pings
- **Graceful degradation**: Falls back to HTTP polling if SSE fails

### Performance Optimizations

- **Reduced polling**: HTTP requests only when SSE unavailable
- **Efficient updates**: Only changed notifications are transmitted
- **Connection pooling**: One connection per authenticated user

## Usage

### Basic Integration

The SSE system is automatically integrated when you use the existing notification provider:

```tsx
import {
  NotificationProvider,
  useNotifications
} from "@/providers/Notifications";

function App() {
  return (
    <NotificationProvider>
      <YourComponent />
    </NotificationProvider>
  );
}

function YourComponent() {
  const { notifications, count, isSSEConnected } = useNotifications();

  return (
    <div>
      <p>Notifications: {count}</p>
      <p>Real-time: {isSSEConnected ? "Connected" : "Disconnected"}</p>
      {notifications.map((notification) => (
        <div key={notification.id}>{notification.title}</div>
      ))}
    </div>
  );
}
```

### Connection Status Indicator

Use the `ConnectionStatus` component to show connection status:

```tsx
import { ConnectionStatus } from "@/components/UX/Notifications/ConnectionStatus";

function NotificationPanel() {
  return (
    <div>
      <ConnectionStatus showText={true} showReconnectButton={true} />
      {/* Your notification UI */}
    </div>
  );
}
```

### Custom SSE Hook

For advanced use cases, use the SSE hook directly:

```tsx
import { useNotificationSSE } from "@/hooks/useNotificationSSE";

function CustomComponent() {
  const { isConnected, reconnect } = useNotificationSSE({
    enabled: true,
    onNotificationUpdate: (notification, action) => {
      console.log("Notification update:", { notification, action });
    },
    onConnectionChange: (connected) => {
      console.log("Connection status:", connected);
    },
    onError: (error) => {
      console.error("SSE error:", error);
    }
  });

  return (
    <div>
      <p>Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```

## Configuration

### Environment Variables

No additional environment variables are required. The system uses the existing `NEXT_PUBLIC_SERVER_URL`.

### SSE Hook Options

```typescript
interface UseNotificationSSEOptions {
  enabled?: boolean; // Enable/disable SSE connection
  onNotificationUpdate?: Function; // Callback for notification updates
  onConnectionChange?: Function; // Callback for connection status changes
  onError?: Function; // Error callback
  reconnectInterval?: number; // Reconnection delay (default: 5000ms)
  maxReconnectAttempts?: number; // Max reconnection attempts (default: 5)
}
```

## Event Types

The SSE endpoint sends the following event types:

### Connected Event

```json
{
  "type": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "user-id"
}
```

### Heartbeat Event

```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Notification Update Event

```json
{
  "type": "notification_update",
  "action": "created|updated|deleted",
  "notification": {
    /* SyncedNotification object */
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Event

```json
{
  "type": "error",
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security

- **Authentication**: SSE endpoint requires valid user session
- **Authorization**: Users only receive their own notifications
- **Connection limits**: One connection per user (new connections replace old ones)

## Monitoring

### Client-Side Logging

- Connection establishment/termination
- Reconnection attempts
- Event processing
- Error handling

### Server-Side Logging

- Active connection count
- Broadcast events
- Connection errors
- Hook execution

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check authentication status
   - Verify `NEXT_PUBLIC_SERVER_URL` configuration
   - Check browser console for errors

2. **No Real-Time Updates**
   - Verify PayloadCMS hooks are properly configured
   - Check server logs for broadcast events
   - Ensure notification recipient matches connected user

3. **Frequent Reconnections**
   - Check network stability
   - Verify server is not terminating connections
   - Review heartbeat interval settings

### Debug Mode

Enable debug logging by setting console log level:

```typescript
// In your component
useEffect(() => {
  console.log("SSE Debug mode enabled");
}, []);
```

## Performance Considerations

- **Memory Usage**: Each connection maintains minimal state
- **Network Traffic**: Significantly reduced compared to polling
- **Server Load**: Lower CPU usage, persistent connections
- **Scalability**: Horizontal scaling requires session affinity or Redis pub/sub

## Migration from Polling

The implementation maintains backward compatibility:

1. **Automatic fallback**: HTTP polling when SSE unavailable
2. **Same API**: No changes to existing notification usage
3. **Gradual rollout**: Can be enabled/disabled per user or feature flag

## Future Enhancements

- **Redis pub/sub**: For multi-server deployments
- **WebSocket fallback**: For environments that don't support SSE
- **Notification batching**: Group multiple updates
- **Selective subscriptions**: Subscribe to specific notification types
- **Push notifications**: Integration with browser push API

## Testing

### Unit Tests

```bash
# Test SSE hook
npm test -- useNotificationSSE.test.ts

# Test notification store
npm test -- NotificationStore.test.ts
```

### Integration Tests

```bash
# Test SSE endpoint
npm test -- notifications-stream.test.ts

# Test PayloadCMS hooks
npm test -- sse-hooks.test.ts
```

### Manual Testing

1. Open multiple browser tabs with the same user
2. Create/update notifications in PayloadCMS admin
3. Verify real-time updates across all tabs
4. Test connection recovery by temporarily disabling network
