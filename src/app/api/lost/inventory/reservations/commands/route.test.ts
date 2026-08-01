import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createLocalReq: vi.fn(),
  getPayload: vi.fn(),
  getServerSession: vi.fn(),
  isSameOrigin: vi.fn(),
  nextHeaders: vi.fn(),
  rateLimitOr429: vi.fn(),
  runCommand: vi.fn()
}));

vi.mock("next/headers", () => ({ headers: mocks.nextHeaders }));
vi.mock("payload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("payload")>()),
  createLocalReq: mocks.createLocalReq,
  getPayload: mocks.getPayload
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.getServerSession
}));
vi.mock("@/lib/api/isSameOrigin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: mocks.rateLimitOr429
}));
vi.mock(
  "@/lib/lost-commerce/inventory-reservation-operator-operations",
  () => ({
    runInventoryReservationOperatorCommand: mocks.runCommand
  })
);

const userId = "00000000-0000-7000-8000-000000000001";
const payload = { findByID: vi.fn(), logger: { error: vi.fn() } };
const validBody = {
  action: "release",
  orderId: "order-1",
  expectedStateHash: "a".repeat(64),
  reasonCode: "order-canceled",
  evidenceReference: "support:case-1"
};

function request(
  options: {
    action?: string;
    body?: Record<string, unknown>;
    rawBody?: string;
    idempotencyKey?: string | null;
    extraHeaders?: Record<string, string>;
  } = {}
) {
  const body = options.body ?? {
    ...validBody,
    action: options.action ?? validBody.action
  };
  const headers = new Headers({
    "content-type": "application/json",
    origin: "https://lostinseoul.com",
    ...options.extraHeaders
  });
  if (options.idempotencyKey !== null) {
    headers.set(
      "idempotency-key",
      options.idempotencyKey ?? "reservation-operator-command-0001"
    );
  }
  return new NextRequest(
    "https://lostinseoul.com/api/lost/inventory/reservations/commands",
    {
      method: "POST",
      headers,
      body: options.rawBody ?? JSON.stringify(body)
    }
  );
}

function expectPreExecutionRejectionLog(input: {
  action: string;
  errorCode: string;
}) {
  expect(payload.logger.error).toHaveBeenCalledWith({
    code: "lost-inventory-reservation-command-rejected",
    actorId: userId,
    action: input.action,
    commandKeyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    errorCode: input.errorCode
  });
  expect(mocks.runCommand).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.nextHeaders.mockResolvedValue(new Headers({ cookie: "session=test" }));
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.getServerSession.mockResolvedValue({
    user: { id: userId, role: "admin" }
  });
  mocks.getPayload.mockResolvedValue(payload);
  payload.findByID.mockResolvedValue({ id: userId, role: "admin" });
  mocks.createLocalReq.mockResolvedValue({
    payload,
    context: {},
    user: { id: userId, role: "admin" }
  });
  mocks.rateLimitOr429.mockResolvedValue(null);
  mocks.runCommand.mockResolvedValue({
    kind: "succeeded",
    resourceId: "order-1",
    status: "released",
    affectedCount: 1,
    stateHash: "b".repeat(64)
  });
});

describe("POST inventory reservation operator commands", () => {
  it("rechecks the persisted admin and delegates a guarded command", async () => {
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: { status: "released", affectedCount: 1 }
    });
    expect(mocks.runCommand).toHaveBeenCalledOnce();
  });

  it("rejects cross-origin requests before authentication", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.getServerSession).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      error: "unauthorized"
    });
    expect(mocks.rateLimitOr429).not.toHaveBeenCalled();
  });

  it("rejects a non-admin session", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { id: userId, role: "editor" }
    });
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-command-rejected",
      actorId: userId,
      action: "unknown",
      commandKeyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      errorCode: "session-admin-required"
    });
  });

  it("rejects an admin whose persisted role was downgraded", async () => {
    payload.findByID.mockResolvedValue({ id: userId, role: "editor" });
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(mocks.runCommand).not.toHaveBeenCalled();
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-command-rejected",
      actorId: userId,
      action: "release",
      commandKeyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      errorCode: "persisted-admin-required"
    });
  });

  it("returns the mutation rate-limit response before reading the command", async () => {
    const limited = Response.json(
      { ok: false, error: "rate-limited" },
      { status: 429 }
    );
    mocks.rateLimitOr429.mockResolvedValue(limited);
    const { POST } = await import("./route");
    const response = await POST(request({ rawBody: "not-json" }));

    expect(response).toBe(limited);
    expect(mocks.rateLimitOr429).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "mutation",
      userId
    );
    expectPreExecutionRejectionLog({
      action: "unknown",
      errorCode: "rate-limited"
    });
  });

  it("logs malformed JSON with fixed PII-safe context", async () => {
    const privateValue = "private.customer@example.com";
    const { POST } = await import("./route");
    const response = await POST(
      request({ rawBody: `{"email":"${privateValue}"` })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "bad-request" });
    expectPreExecutionRejectionLog({
      action: "unknown",
      errorCode: "malformed-json"
    });
    expect(JSON.stringify(payload.logger.error.mock.calls)).not.toContain(
      privateValue
    );
  });

  it("rejects a body whose declared length exceeds the limit", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      request({ extraHeaders: { "content-length": String(16 * 1024 + 1) } })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      ok: false,
      error: "request-too-large"
    });
    expectPreExecutionRejectionLog({
      action: "unknown",
      errorCode: "request-too-large"
    });
  });

  it("rejects an actual body that exceeds the limit", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      request({ rawBody: "x".repeat(16 * 1024 + 1) })
    );

    expect(response.status).toBe(413);
    expectPreExecutionRejectionLog({
      action: "unknown",
      errorCode: "request-too-large"
    });
  });

  it.each([
    [null, "commerce-command-key-required"],
    ["too-short", "invalid-commerce-command-key"],
    ["invalid key with spaces", "invalid-commerce-command-key"]
  ])("rejects an invalid idempotency key", async (idempotencyKey, error) => {
    const { POST } = await import("./route");
    const response = await POST(request({ idempotencyKey }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error });
    expectPreExecutionRejectionLog({
      action: "release",
      errorCode: "invalid-command-key"
    });
  });

  it.each([
    { ...validBody, extra: "not-allowed" },
    { ...validBody, expectedStateHash: "A".repeat(64) },
    { ...validBody, reasonCode: "invalid reason" },
    { ...validBody, reasonCode: "r".repeat(101) },
    { ...validBody, evidenceReference: "e".repeat(201) },
    { ...validBody, orderId: "" }
  ])("rejects command schema violations", async (body) => {
    const { POST } = await import("./route");
    const response = await POST(request({ body }));

    expect(response.status).toBe(400);
    expectPreExecutionRejectionLog({
      action: "release",
      errorCode: "invalid-command"
    });
  });

  it.each(["consume", "force-status"])("rejects unsafe %s", async (action) => {
    const { POST } = await import("./route");
    const response = await POST(request({ action }));

    expect(response.status).toBe(400);
    expectPreExecutionRejectionLog({
      action: "unknown",
      errorCode: "invalid-command"
    });
  });

  it.each(["release", "expire", "reconcile"])(
    "accepts the %s order command",
    async (action) => {
      const { POST } = await import("./route");
      const response = await POST(request({ action }));

      expect(response.status).toBe(200);
      expect(mocks.runCommand).toHaveBeenCalledWith(
        expect.objectContaining({ action, orderId: "order-1" }),
        expect.objectContaining({ payload })
      );
    }
  );

  it.each([1, 100])(
    "accepts run_expiry with batch size %i",
    async (batchSize) => {
      const body = {
        action: "run_expiry",
        expectedStateHash: "a".repeat(64),
        reasonCode: "scheduled-check",
        evidenceReference: "ops:expiry-1",
        batchSize
      };
      const { POST } = await import("./route");
      const response = await POST(request({ body }));

      expect(response.status).toBe(200);
      expect(mocks.runCommand).toHaveBeenCalledWith(
        body,
        expect.objectContaining({ payload })
      );
    }
  );

  it.each([0, 101, 1.5])(
    "rejects run_expiry batch size %s",
    async (batchSize) => {
      const { POST } = await import("./route");
      const response = await POST(
        request({
          body: {
            action: "run_expiry",
            expectedStateHash: "a".repeat(64),
            reasonCode: "scheduled-check",
            evidenceReference: "ops:expiry-1",
            batchSize
          }
        })
      );

      expect(response.status).toBe(400);
      expectPreExecutionRejectionLog({
        action: "run_expiry",
        errorCode: "invalid-command"
      });
    }
  );

  it("marks a command replay in the response headers", async () => {
    mocks.runCommand.mockResolvedValue({
      kind: "replay",
      resourceId: "order-1",
      status: "released",
      affectedCount: 1,
      stateHash: "b".repeat(64)
    });
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replay")).toBe("true");
  });

  it("maps an idempotency-key conflict to 409", async () => {
    mocks.runCommand.mockResolvedValue({ kind: "conflict" });
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "idempotency-key-conflict"
    });
  });

  it.each([
    [1, "1"],
    [1501, "2"]
  ])(
    "maps an in-progress command with a rounded Retry-After header",
    async (retryAfterMs, retryAfter) => {
      mocks.runCommand.mockResolvedValue({
        kind: "in_progress",
        retryAfterMs
      });
      const { POST } = await import("./route");
      const response = await POST(request());

      expect(response.status).toBe(409);
      expect(response.headers.get("retry-after")).toBe(retryAfter);
      expect(await response.json()).toEqual({
        ok: false,
        error: "idempotency-in-progress"
      });
    }
  );

  it.each([
    ["inventory-reservation-operator-order-not-found", 404],
    ["inventory-reservation-operator-state-conflict", 409],
    ["inventory-reservation-release-forbidden", 409],
    ["inventory-reservation-release-no-effect", 409],
    ["inventory-reservation-not-expired", 409],
    ["inventory-reservation-balance-changed", 409],
    ["inventory-reservation-operator-mutations-disabled", 503],
    ["commerce-command-transaction-failed", 503],
    ["commerce-command-rollback-failed", 503]
  ])("maps known operation error %s to %i", async (message, status) => {
    mocks.runCommand.mockRejectedValue(new Error(message));
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(status);
    const body = await response.json();
    expect(body.ok).toBe(false);
    if (
      status === 503 &&
      message !== "inventory-reservation-operator-mutations-disabled"
    ) {
      expect(body.error).toBe("inventory-reservation-operator-unavailable");
    } else {
      expect(body.error).toBe(message);
    }
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-command-rejected",
      actorId: userId,
      action: "release",
      commandKeyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      errorCode: expect.stringMatching(/^inventory-reservation-/)
    });
  });

  it("sanitizes unexpected failures and logs only fixed context", async () => {
    mocks.runCommand.mockRejectedValue(
      new Error("database failed with customer@example.com")
    );
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-reservation-operator-failed"
    });
    expect(payload.logger.error).toHaveBeenCalledWith({
      code: "lost-inventory-reservation-command-failed",
      actorId: userId,
      action: "release",
      commandKeyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      errorCode: "unexpected-error"
    });
  });

  it("does not expose a wrapped error that contains a known code", async () => {
    mocks.runCommand.mockRejectedValue(
      new Error(
        "inventory-reservation-operator-state-conflict: buyer@example.invalid"
      )
    );
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-reservation-operator-failed"
    });
  });
});
