import { NextRequest, NextResponse } from "next/server";
import { NotFound } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const operationNames = [
    "createInventoryReceipt",
    "openInventoryReceipt",
    "receiveInventoryReceipt",
    "closeInventoryReceipt",
    "cancelInventoryReceipt",
    "releaseInventoryLot",
    "adjustInventory",
    "createInventoryCycleCount",
    "submitInventoryCycleCount",
    "applyInventoryCycleCount",
    "rejectInventoryCycleCount",
    "cancelInventoryCycleCount"
  ] as const;
  const operations = Object.fromEntries(
    operationNames.map((name) => [name, vi.fn()])
  ) as Record<(typeof operationNames)[number], ReturnType<typeof vi.fn>>;

  return {
    createLocalReq: vi.fn(),
    getPayload: vi.fn(),
    getServerSession: vi.fn(),
    isSameOrigin: vi.fn(),
    loggerError: vi.fn(),
    nextHeaders: vi.fn(),
    operations,
    rateLimitOr429: vi.fn()
  };
});

vi.mock("next/headers", () => ({ headers: mocks.nextHeaders }));
vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  return {
    ...actual,
    createLocalReq: mocks.createLocalReq,
    getPayload: mocks.getPayload
  };
});
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("@/lib/auth/getServerSession", () => ({
  getServerSession: mocks.getServerSession
}));
vi.mock("@/lib/api/isSameOrigin", () => ({
  isSameOrigin: mocks.isSameOrigin
}));
vi.mock("@/lib/api/rateLimit", () => ({
  rateLimitOr429: mocks.rateLimitOr429
}));
vi.mock("@/lib/lost-commerce/inventory-operations", () => mocks.operations);

const ENTITY_IDS = Object.freeze({
  admin: "00000000-0000-7000-8000-000000000001",
  editor: "00000000-0000-7000-8000-000000000002",
  location1: "00000000-0000-7000-8000-000000000003",
  location2: "00000000-0000-7000-8000-000000000004",
  sku: "00000000-0000-7000-8000-000000000005",
  receipt: "00000000-0000-7000-8000-000000000006",
  receiptLine: "00000000-0000-7000-8000-000000000007",
  lot: "00000000-0000-7000-8000-000000000008",
  count: "00000000-0000-7000-8000-000000000009"
});

const payload = {
  findByID: vi.fn(),
  logger: { error: mocks.loggerError }
};

function request(
  body: unknown,
  idempotencyKey: string | null = "inventory-command-0001"
): NextRequest {
  const headers = new Headers({
    "content-type": "application/json",
    origin: "https://lostinseoul.com"
  });
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);
  return new NextRequest(
    "https://lostinseoul.com/api/lost/inventory/commands",
    { method: "POST", headers, body: JSON.stringify(body) }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.nextHeaders.mockResolvedValue(new Headers({ cookie: "session=test" }));
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.getServerSession.mockResolvedValue({
    user: { id: ENTITY_IDS.admin, role: "admin" }
  });
  mocks.getPayload.mockResolvedValue(payload);
  payload.findByID.mockResolvedValue({
    id: ENTITY_IDS.admin,
    role: "admin"
  });
  mocks.createLocalReq.mockImplementation(async ({ req, user }) => ({
    payload,
    context: {},
    headers: req.headers,
    user
  }));
  mocks.rateLimitOr429.mockResolvedValue(null);
  for (const operation of Object.values(mocks.operations)) {
    operation.mockResolvedValue({
      kind: "succeeded",
      resourceId: "resource-1",
      status: "applied"
    });
  }
});

describe("POST /api/lost/inventory/commands", () => {
  it("rejects cross-origin requests before authentication or inventory access", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "bad-origin" });
    expect(mocks.getServerSession).not.toHaveBeenCalled();
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("requires an authenticated Better Auth session", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      error: "unauthorized"
    });
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("requires the admin role", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: { id: ENTITY_IDS.editor, role: "editor" }
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "forbidden" });
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("rechecks the current Payload user role before creating a local request", async () => {
    payload.findByID.mockResolvedValue({
      id: ENTITY_IDS.admin,
      role: "editor"
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "forbidden" });
    expect(mocks.createLocalReq).not.toHaveBeenCalled();
    expect(mocks.operations.openInventoryReceipt).not.toHaveBeenCalled();
  });

  it("applies the established authenticated mutation rate limit", async () => {
    mocks.rateLimitOr429.mockResolvedValue(
      NextResponse.json({ error: "Too many requests" }, { status: 429 })
    );
    const req = request({
      action: "receipt.open",
      input: { receiptId: ENTITY_IDS.receipt }
    });
    const { POST } = await import("./route");

    const response = await POST(req);

    expect(response.status).toBe(429);
    expect(mocks.rateLimitOr429).toHaveBeenCalledWith(
      req,
      "mutation",
      ENTITY_IDS.admin
    );
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it.each([
    [
      {
        action: "receipt.create",
        input: { locationId: ENTITY_IDS.location1, lines: [] }
      }
    ],
    [
      {
        action: "receipt.receive",
        input: { receiptId: ENTITY_IDS.receipt, quantity: 1 }
      }
    ],
    [{ action: "lot.release", input: { lotId: ENTITY_IDS.lot, quantity: 0 } }],
    [
      {
        action: "inventory.adjust",
        input: {
          skuId: ENTITY_IDS.sku,
          kind: "transfer",
          quantity: 1,
          from: { locationId: ENTITY_IDS.location1, disposition: "available" }
        }
      }
    ],
    [
      {
        action: "cycle-count.create",
        input: {
          locationId: ENTITY_IDS.location1,
          lines: [
            {
              skuId: ENTITY_IDS.sku,
              disposition: "unknown",
              countedQuantity: 1
            }
          ]
        }
      }
    ],
    [
      {
        action: "receipt.create",
        input: {
          locationId: ENTITY_IDS.location1,
          lines: Array.from({ length: 51 }, () => ({ skuId: ENTITY_IDS.sku }))
        }
      }
    ],
    [
      {
        action: "cycle-count.create",
        input: {
          locationId: ENTITY_IDS.location1,
          lines: Array.from({ length: 51 }, () => ({
            skuId: ENTITY_IDS.sku,
            disposition: "available",
            countedQuantity: 0
          }))
        }
      }
    ],
    [
      {
        action: "receipt.open",
        input: { receiptId: "not-a-uuid" }
      }
    ],
    [
      {
        action: "inventory.adjust",
        input: {
          skuId: ENTITY_IDS.sku,
          kind: "transfer",
          quantity: 1,
          from: {
            locationId: ENTITY_IDS.location1,
            disposition: "available"
          },
          to: {
            locationId: ENTITY_IDS.location1,
            disposition: "available"
          },
          reasonCode: "stock-transfer"
        }
      }
    ],
    [
      {
        action: "inventory.adjust",
        input: {
          skuId: ENTITY_IDS.sku,
          kind: "transfer",
          quantity: 1,
          from: {
            locationId: ENTITY_IDS.location1,
            disposition: "quarantine"
          },
          to: {
            locationId: ENTITY_IDS.location1,
            disposition: "available"
          },
          reasonCode: "release"
        }
      }
    ],
    [{ action: "unknown", input: {} }]
  ])("rejects invalid command data before loading Payload", async (body) => {
    const { POST } = await import("./route");

    const response = await POST(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "bad-request"
    });
    expect(mocks.getPayload).not.toHaveBeenCalled();
    expect(
      Object.values(mocks.operations).every(
        (operation) => operation.mock.calls.length === 0
      )
    ).toBe(true);
  });

  it("rejects malformed JSON before loading Payload", async () => {
    const req = new NextRequest(
      "https://lostinseoul.com/api/lost/inventory/commands",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "inventory-command-0001",
          origin: "https://lostinseoul.com"
        },
        body: "{"
      }
    );
    const { POST } = await import("./route");

    const response = await POST(req);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "bad-request"
    });
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies before JSON parsing or Payload access", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.create",
        input: {
          locationId: ENTITY_IDS.location1,
          supplierName: "x".repeat(300_000),
          lines: [{ skuId: ENTITY_IDS.sku }]
        }
      })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      ok: false,
      error: "request-too-large"
    });
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it("aligns optional operational text with the service 200-character limit", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.create",
        input: {
          locationId: ENTITY_IDS.location1,
          supplierName: "x".repeat(201),
          lines: [{ skuId: ENTITY_IDS.sku }]
        }
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "bad-request"
    });
    expect(mocks.getPayload).not.toHaveBeenCalled();
  });

  it.each([null, "short", "inventory command with spaces"])(
    "requires a valid idempotency key before loading Payload",
    async (idempotencyKey) => {
      const { POST } = await import("./route");

      const response = await POST(
        request(
          { action: "receipt.open", input: { receiptId: ENTITY_IDS.receipt } },
          idempotencyKey
        )
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ ok: false });
      expect(mocks.getPayload).not.toHaveBeenCalled();
    }
  );

  const commandCases = [
    {
      action: "receipt.create",
      input: {
        locationId: ENTITY_IDS.location1,
        supplierName: "Supplier",
        externalReference: "delivery-1",
        lines: Array.from({ length: 50 }, () => ({
          skuId: ENTITY_IDS.sku,
          expectedQuantity: 4
        }))
      },
      operation: "createInventoryReceipt",
      status: "draft"
    },
    {
      action: "receipt.open",
      input: { receiptId: ENTITY_IDS.receipt },
      operation: "openInventoryReceipt",
      status: "open"
    },
    {
      action: "receipt.receive",
      input: {
        receiptId: ENTITY_IDS.receipt,
        receiptLineId: ENTITY_IDS.receiptLine,
        quantity: 2,
        externalLotCode: "lot-code-1"
      },
      operation: "receiveInventoryReceipt",
      status: "quarantine"
    },
    {
      action: "receipt.close",
      input: { receiptId: ENTITY_IDS.receipt },
      operation: "closeInventoryReceipt",
      status: "closed"
    },
    {
      action: "receipt.cancel",
      input: { receiptId: ENTITY_IDS.receipt },
      operation: "cancelInventoryReceipt",
      status: "cancelled"
    },
    {
      action: "lot.release",
      input: { lotId: ENTITY_IDS.lot, quantity: 2 },
      operation: "releaseInventoryLot",
      status: "partially-released"
    },
    {
      action: "inventory.adjust",
      input: {
        skuId: ENTITY_IDS.sku,
        kind: "outbound",
        quantity: 1,
        from: {
          locationId: ENTITY_IDS.location1,
          disposition: "returned_pending_release"
        },
        reasonCode: "returned-writeoff",
        sourceRef: "inspection-1"
      },
      operation: "adjustInventory",
      status: "applied"
    },
    ...(
      [
        ["quarantine", "damaged", "move-to-damaged"],
        ["available", "inspection_pending", "move-to-inspection"]
      ] as const
    ).map(([fromDisposition, toDisposition, reasonCode]) => ({
      action: "inventory.adjust" as const,
      input: {
        skuId: ENTITY_IDS.sku,
        kind: "transfer" as const,
        quantity: 1,
        from: {
          locationId: ENTITY_IDS.location1,
          disposition: fromDisposition
        },
        to: { locationId: ENTITY_IDS.location1, disposition: toDisposition },
        reasonCode
      },
      operation: "adjustInventory" as const,
      status: "applied"
    })),
    {
      action: "cycle-count.create",
      input: {
        locationId: ENTITY_IDS.location1,
        lines: Array.from({ length: 50 }, () => ({
          skuId: ENTITY_IDS.sku,
          disposition: "available",
          countedQuantity: 3
        }))
      },
      operation: "createInventoryCycleCount",
      status: "draft"
    },
    {
      action: "cycle-count.submit",
      input: { countId: ENTITY_IDS.count },
      operation: "submitInventoryCycleCount",
      status: "submitted"
    },
    {
      action: "cycle-count.apply",
      input: { countId: ENTITY_IDS.count },
      operation: "applyInventoryCycleCount",
      status: "applied"
    },
    {
      action: "cycle-count.reject",
      input: { countId: ENTITY_IDS.count },
      operation: "rejectInventoryCycleCount",
      status: "rejected"
    },
    {
      action: "cycle-count.cancel",
      input: { countId: ENTITY_IDS.count },
      operation: "cancelInventoryCycleCount",
      status: "cancelled"
    }
  ] as const;

  it.each(commandCases)(
    "invokes $action with an authenticated Payload request",
    async ({ action, input, operation, status }) => {
      mocks.operations[operation].mockResolvedValue({
        kind: "succeeded",
        resourceId: "resource-1",
        status
      });
      const { POST } = await import("./route");

      const response = await POST(request({ action, input }));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        ok: true,
        data: { resourceId: "resource-1", status }
      });
      expect(mocks.operations[operation]).toHaveBeenCalledWith({
        payload,
        req: expect.objectContaining({
          payload,
          context: {},
          user: { id: ENTITY_IDS.admin, role: "admin" }
        }),
        commandKey: expect.stringMatching(/^[a-f0-9]{64}$/),
        input
      });
      expect(mocks.createLocalReq).toHaveBeenCalledWith(
        {
          req: { headers: expect.any(Headers) },
          user: { id: ENTITY_IDS.admin, role: "admin" }
        },
        payload
      );
    }
  );

  it("returns a replay with the stored safe result and replay header", async () => {
    mocks.operations.openInventoryReceipt.mockResolvedValue({
      kind: "replay",
      businessKey: "inventory:open:key",
      response: { resourceId: ENTITY_IDS.receipt, status: "open" }
    });
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Idempotent-Replay")).toBe("true");
    expect(await response.json()).toEqual({
      ok: true,
      data: { resourceId: ENTITY_IDS.receipt, status: "open" }
    });
  });

  it("derives the same scoped command key for a retry", async () => {
    const { POST } = await import("./route");
    const body = {
      action: "receipt.open",
      input: { receiptId: ENTITY_IDS.receipt }
    };

    await POST(request(body));
    await POST(request(body));

    const firstKey =
      mocks.operations.openInventoryReceipt.mock.calls[0]?.[0]?.commandKey;
    const secondKey =
      mocks.operations.openInventoryReceipt.mock.calls[1]?.[0]?.commandKey;
    expect(firstKey).toMatch(/^[a-f0-9]{64}$/);
    expect(secondKey).toBe(firstKey);
  });

  it.each([
    ["conflict", "idempotency-key-conflict"],
    ["in_progress", "idempotency-in-progress"]
  ] as const)(
    "returns a conflict for %s durable commands",
    async (kind, error) => {
      mocks.operations.openInventoryReceipt.mockResolvedValue(
        kind === "conflict"
          ? { kind }
          : { kind, businessKey: "inventory:open:key", retryAfterMs: 2_000 }
      );
      const { POST } = await import("./route");

      const response = await POST(
        request({
          action: "receipt.open",
          input: { receiptId: ENTITY_IDS.receipt }
        })
      );

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({ ok: false, error });
      if (kind === "in_progress") {
        expect(response.headers.get("Retry-After")).toBe("2");
      }
    }
  );

  it("returns a state conflict for an invalid lifecycle transition", async () => {
    mocks.operations.closeInventoryReceipt.mockRejectedValue(
      new Error("inventory-receipt-close-invalid-status")
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.close",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-receipt-close-invalid-status"
    });
  });

  it.each([
    ["insufficient-inventory-balance", 409],
    ["inventory-sku-inactive", 409],
    ["inventory-location-inactive", 409],
    ["inventory-sku-not-found", 404],
    ["inventory-location-not-found", 404],
    ["inventory-transfer-endpoints-match", 400],
    ["inventory-lot-release-workflow-required", 400]
  ] as const)("maps expected operation error %s", async (error, status) => {
    mocks.operations.adjustInventory.mockRejectedValue(new Error(error));
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "inventory.adjust",
        input: {
          skuId: ENTITY_IDS.sku,
          kind: "transfer",
          quantity: 1,
          from: { locationId: ENTITY_IDS.location1, disposition: "available" },
          to: { locationId: ENTITY_IDS.location2, disposition: "available" },
          reasonCode: "stock-transfer"
        }
      })
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ ok: false, error });
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });

  it("rejects cancellation after receipt evidence exists", async () => {
    mocks.operations.cancelInventoryReceipt.mockRejectedValue(
      new Error("inventory-receipt-cancel-has-receipts")
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.cancel",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-receipt-cancel-has-receipts"
    });
  });

  it("maps Payload missing-resource errors to a safe 404 response", async () => {
    mocks.operations.openInventoryReceipt.mockRejectedValue(new NotFound());
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-operation-record-not-found"
    });
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });

  it("does not expose transaction failure details", async () => {
    mocks.operations.openInventoryReceipt.mockRejectedValue(
      new Error("password=secret inventory-operation-transaction-failed")
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-command-failed"
    });
    expect(mocks.loggerError).toHaveBeenCalledWith({
      code: "lost-inventory-command-failed",
      context: "POST /api/lost/inventory/commands",
      action: "receipt.open"
    });
    expect(JSON.stringify(mocks.loggerError.mock.calls)).not.toContain(
      "password=secret"
    );
  });

  it("reports an unavailable inventory transaction without internal details", async () => {
    mocks.operations.openInventoryReceipt.mockRejectedValue(
      new Error("inventory-operation-transaction-failed")
    );
    const { POST } = await import("./route");

    const response = await POST(
      request({
        action: "receipt.open",
        input: { receiptId: ENTITY_IDS.receipt }
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "inventory-command-unavailable"
    });
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });
});
