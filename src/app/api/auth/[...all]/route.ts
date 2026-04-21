import { toNextJsHandler } from "better-auth/next-js";
import { getPayload } from "@/lib/payload";
import type { NextRequest } from "next/server";

// force-dynamic prevents Next.js from evaluating this module at build time.
// getPayload() (and its DB connection) must not run until an actual request arrives.
export const dynamic = "force-dynamic";

// Singleton promise — built once on first request, reused for all subsequent ones.
// Using a promise (not a value) makes this safe under concurrent first requests.
let handlersPromise: Promise<ReturnType<typeof toNextJsHandler>> | null = null;

function getHandlers() {
  if (!handlersPromise) {
    handlersPromise = getPayload().then((payload) =>
      toNextJsHandler(payload.betterAuth)
    );
  }
  return handlersPromise;
}

export async function GET(req: NextRequest) {
  const { GET: handler } = await getHandlers();
  return handler(req);
}

export async function POST(req: NextRequest) {
  const { POST: handler } = await getHandlers();
  return handler(req);
}
