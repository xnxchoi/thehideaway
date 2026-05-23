import { getPayload as getPayloadAuth } from "@/lib/payload";

export interface ServerSessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  role?: string | null;
}

export interface ServerSession {
  user: ServerSessionUser;
}

/**
 * Resolve the current Better Auth session on the server.
 *
 * `payload.auth({ headers })` does NOT recognize Better Auth cookies in this
 * project — that path returns null even when a user is signed in. Always use
 * the Better Auth API, which is exposed via the BetterAuth-typed Payload
 * instance from `@/lib/payload`.
 *
 * Returns `null` if no session is present.
 */
export async function getServerSession(
  reqHeaders: Headers
): Promise<ServerSession | null> {
  const payload = await getPayloadAuth();
  const session = (await payload.betterAuth.api
    .getSession({ headers: reqHeaders })
    .catch(() => null)) as { user?: ServerSessionUser } | null;

  if (!session?.user?.id) return null;
  return { user: session.user };
}
