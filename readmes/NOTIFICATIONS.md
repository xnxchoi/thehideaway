# Notifications

User-facing notification system. Backed by the `notifications` Payload
collection; surfaced in `/me/inbox` (the `NotificationCenter`) and in
the header bell (the `NotificationButton`).

The transport for this phase is **polled fetch via React Query**,
chosen deliberately over Server-Sent Events for the reasons in
[§ "Why polling, not SSE"](#why-polling-not-sse) below. SSE is queued
as Phase B; the upgrade path is documented in [§ "Phase B —
SSE"](#phase-b--sse) and the public hook contract (`useNotifications`)
is designed so the swap is call-site-free.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Server                                                           │
│                                                                  │
│  Payload `notifications` collection                              │
│   ├── beforeValidate / beforeChange — status FSM (read/dismiss)  │
│   ├── afterRead — fallback image                                 │
│   └── endpoints                                                  │
│        ├── GET   /api/notifications/me                           │
│        ├── PATCH /api/notifications/:id/read                     │
│        ├── PATCH /api/notifications/:id/dismiss                  │
│        └── PATCH /api/notifications/read-all                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │  React Query
                              │   ├── refetchInterval: 30s (foreground)
                              │   ├── refetchOnWindowFocus: true
                              │   └── refetchIntervalInBackground: false
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Client                                                           │
│                                                                  │
│  NotificationProvider                                            │
│   ├── NotificationStoreContext (Zustand store; mirror of cache)  │
│   └── NotificationContext (public surface)                       │
│        │                                                         │
│        ▼                                                         │
│   useNotifications()                                             │
│        ├── notifications, count, lastFetched, isLoading          │
│        ├── setRead({ ids })       — useReadMutation              │
│        ├── setDismissed({ ids })  — useDismissMutation           │
│        └── setAllRead()           — useReadAllMutation           │
└──────────────────────────────────────────────────────────────────┘
```

Files:

| Path | Role |
| --- | --- |
| `src/payload/collections/Notifications/Notification.ts` | Collection definition + endpoints |
| `src/payload/collections/Notifications/endpoints/{read,dismiss,read-all}/*.ts` | PATCH handlers with ownership filters |
| `src/providers/Notifications/index.tsx` | Provider + `useNotifications` hook |
| `src/providers/Notifications/mutations.ts` | The three mutation hooks + optimistic cache surgery |
| `src/providers/Notifications/notificationFn.ts` | The list-fetch function |
| `src/stores/Notification/NotificationStore.ts` | Zustand store (mirror of cache) |
| `src/components/UX/Notifications/NotificationCenter.tsx` | Full inbox UI |
| `src/components/UX/Notifications/NotificationTable.tsx` | Tabular variant |
| `src/components/UX/NotificationButton/notificationButton.tsx` | Header bell |

## Public hook contract

```ts
const {
  notifications,   // SyncedNotification[]
  count,           // number — total in cache (read + unread + dismissed)
  lastFetched,     // number — performance.now() at last server hydrate
  isLoading,       // boolean — initial fetch OR readAll mutation in flight
  setRead,         // ({ ids }) => void — optimistic + PATCH /:id/read
  setDismissed,    // ({ ids }) => void — optimistic + PATCH /:id/dismiss
  setAllRead       // () => void — optimistic + PATCH /read-all
} = useNotifications();
```

This shape is the load-bearing contract. Phase B (SSE) replaces the
polling source but MUST preserve this surface exactly.

## Optimistic updates

All three mutations use the same pattern:

1. `onMutate` cancels in-flight queries for the user, snapshots every
   cached `["NOTIFY", { user }, ...]` entry, then mutates them in place
   with the desired post-action shape.
2. `onError` restores the snapshot.
3. `onSettled` invalidates so the next poll-tick (or immediate refetch)
   rebases against the server's truth.

The `setQueriesData` predicate matches on `queryKey[0] === "NOTIFY"` +
matching user, so optimistic updates flow to every list variant (each
filter / sort combination has its own query-string key).

## Why polling, not SSE

The decision is reversible by design; the rationale is documented for
the next reviewer:

| Factor | Polling at this scale | SSE at this scale |
| --- | --- | --- |
| Effort to ship | Half-day | Half-day (with `better-sse`) |
| Net latency | 30s | Sub-100ms |
| Operational risk | None | Low (nginx `proxy_buffering off`, connection lifecycle) |
| Infra cost @ <500 concurrent | ~17 req/s of cheap 304s | One persistent connection per user |
| Multi-instance story | Already works | Needs Redis pub/sub or sticky sessions |

Notifications are bursty-rare events. For the current scale (single
VPS, pre-launch, low concurrency), 30s latency is well within the
"unnoticed" threshold for this category of UX. Polling buys us 100% of
the perceived freshness at 0% of the streaming-connection failure
modes.

When the upgrade pays off:

- Concurrent active users sustained > 500, **or**
- User feedback identifies notification lag as a felt friction, **or**
- Notification cadence routinely exceeds 1/min/user (e.g., chatty
  social mechanics ship).

Until any of those signals fire, polling is the right answer.

## Phase B — SSE

Concrete migration when the time comes. ~½ day of focused work.

### Server

1. `pnpm add better-sse` — battle-tested SSE library
   ([npm](https://www.npmjs.com/package/better-sse), ~26.5k weekly
   downloads, MIT, zero deps). Provides `Session` + `Channel` with
   heartbeat, lastEventId resume, and AbortController-aware cleanup.

2. New route handler `src/app/api/notifications/stream/route.ts`:

   ```ts
   export const dynamic = "force-dynamic";
   export const runtime = "nodejs"; // long-lived; not edge

   export async function GET(req: NextRequest) {
     const user = await requireUser(req); // existing session helper
     if (!user) return new Response("Unauthorized", { status: 401 });

     const session = await createSession(req);
     getUserChannel(user.id).register(session);
     return session.response;
   }
   ```

3. Tiny module `src/lib/notifications/sse-channels.ts` (or similar):

   ```ts
   import { createChannel } from "better-sse";
   const channels = new Map<string, ReturnType<typeof createChannel>>();
   export const getUserChannel = (userId: string) => {
     let ch = channels.get(userId);
     if (!ch) {
       ch = createChannel();
       channels.set(userId, ch);
     }
     return ch;
   };
   ```

4. Bridge from Payload hooks to the channel — `afterChange` and
   `afterDelete` on the `notifications` collection:

   ```ts
   afterChange: [
     async ({ doc, operation }) => {
       const userId = typeof doc.recipient === "string"
         ? doc.recipient
         : doc.recipient.id;
       getUserChannel(userId).broadcast(
         { action: operation, notification: doc },
         "notification_update"
       );
     }
   ]
   ```

### Infrastructure

- nginx site config (`nginx/sites-available/hideawayseoul.com`): add
  to the `/api/notifications/stream` location block:

  ```nginx
  location /api/notifications/stream {
    proxy_pass http://upstream;
    proxy_buffering off;
    proxy_cache off;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }
  ```

  Without this, nginx buffers the stream and clients see nothing until
  the connection closes. This is the single nontrivial operational
  step.

### Client

1. New hook `src/hooks/useNotificationStream.ts` (~40 LOC):
   `EventSource` to `/api/notifications/stream`, single `useEffect`
   with `AbortController` cleanup, exponential backoff on error.

2. In `NotificationProvider`, replace the `refetchInterval` line with
   the new hook's effect. On `notification_update` events, call
   `queryClient.setQueryData` with the same predicate the mutations
   use today. **Do not change the public hook surface.**

3. Drop `refetchInterval`; keep `refetchOnWindowFocus: true` as a
   belt-and-braces refresh on tab return.

### Multi-instance trigger (further down the road)

If the VPS goes from 1 to N, `better-sse`'s in-process channels stop
working (each replica only knows about its own clients). The fix is a
Redis pub/sub adapter:

- `pnpm add ioredis`
- Replace `getUserChannel(userId).broadcast(...)` and the channel
  registration with a thin `Bus` interface (`publish(userId, event)` /
  `subscribe(userId, fn)`), backed by Redis. The route handler still
  uses `better-sse` for the wire format; only the fan-out changes.

This is a one-evening swap when the time comes. Keep the `Bus`
interface in mind when writing the in-memory version so the seam is
clean.

## Operational checklist

- [ ] **Foreground polling working:** open `/me/inbox`, wait 30s, see
      list rehydrate without refresh.
- [ ] **Background tab quiet:** open `/me/inbox`, switch to another
      tab, confirm network panel shows zero `/api/notifications/me`
      requests until the tab regains focus.
- [ ] **Optimistic dismiss:** click dismiss on an unread row, observe
      it transition to "dismissed" status before the network response
      lands; on a forced 500, it reverts.
- [ ] **Optimistic read-all:** click "mark all read" on a list with
      several unread rows; all flip instantly; revert on simulated
      failure.

## Why the previous SSE scaffold was removed

A prior iteration introduced `useNotificationSSE`, a `ConnectionStatus`
component, two `sse-integration.ts` stub files, and a long
`SSE_NOTIFICATIONS.md` describing a full real-time architecture — but
no server endpoint was ever built, the hook was imported nowhere, and
two of the integration files were 100% commented out. The provider
also had ~120 lines of commented-out mutation code, a no-op `setRead`,
and an optimistic-dismiss path that produced an identity map (visually
a no-op). All of that has been atticked under `.attic/` so the
recovery path is preserved without polluting the live tree.

If reviving any of it for Phase B, treat it as reference only — the
`better-sse`-based path described above is significantly cleaner than
the hand-rolled hook that was there.
