import type { PayloadHandler } from "payload";

import { replayCommerceProviderEvent } from "@/lib/lost-commerce/provider-event-replay";

export const replayProviderEventHandler: PayloadHandler = async (request) => {
  if (!request.user) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (request.user.role !== "admin") {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const eventId = String(request.routeParams?.id ?? "");
  if (!eventId) {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  try {
    const result = await replayCommerceProviderEvent({
      payload: request.payload,
      eventId
    });
    const retryable =
      result.kind === "completed" && result.status === "retryable";
    const busy = result.kind === "busy";
    return Response.json(
      { ok: !busy && !retryable, result },
      { status: retryable ? 503 : busy ? 409 : 200 }
    );
  } catch {
    return Response.json(
      { ok: false, error: "provider-event-replay-unavailable" },
      { status: 503 }
    );
  }
};
