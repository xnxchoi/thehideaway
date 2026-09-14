import type { Payload, PayloadRequest } from "payload";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  hashCommerceCommandInput
} from "@/lib/lost-commerce/commerce-commands";
import {
  claimOperatorCommand,
  completeOperatorCommand
} from "./operator-command-journal";
vi.mock("@/lib/lost-commerce/commerce-commands", () => ({
  claimCommerceCommand: vi.fn(),
  completeCommerceCommand: vi.fn(),
  hashCommerceCommandInput: vi.fn(() => "a".repeat(64))
}));
const payload = {} as Payload;
const req = {
  user: { id: "admin-1", collection: "users", role: "admin" },
  payload,
  transactionID: "tx"
} as unknown as PayloadRequest;
const input = {
  payload,
  req,
  commandKey: "operator-command-0001",
  operation: "mark_processing",
  resource: { type: "orders", id: "order-1" },
  reasonCode: "operator_update",
  auditSource: "operator",
  validatedInput: { status: "processing" }
};
beforeEach(() => vi.clearAllMocks());
describe("operator command journal", () => {
  it("derives the actor from the trusted request and binds the operation and target", async () => {
    vi.mocked(claimCommerceCommand).mockResolvedValue({ kind: "conflict" });
    await claimOperatorCommand(input);
    expect(claimCommerceCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        binding: {
          actorId: "admin-1",
          operation: "mark_processing",
          resource: input.resource,
          reasonCode: "operator_update",
          auditSource: "operator"
        },
        createBusinessKey: expect.any(Function)
      })
    );
  });
  it("rejects a non-admin before invoking the journal", async () => {
    await expect(
      claimOperatorCommand({
        ...input,
        req: { ...req, user: { ...req.user, role: "editor" } } as never
      })
    ).rejects.toThrow("operator-command-forbidden");
    expect(claimCommerceCommand).not.toHaveBeenCalled();
  });
  it("rejects replay payloads outside the safe response allowlist", async () => {
    vi.mocked(claimCommerceCommand).mockResolvedValue({
      kind: "replay",
      businessKey: "command-1",
      response: { orderId: "order-1", secret: "do-not-leak" }
    });
    await expect(claimOperatorCommand(input)).rejects.toThrow(
      "unsafe-operator-command-response"
    );
  });
  it("rejects nested address/secret completion before a journal write", async () => {
    await expect(
      completeOperatorCommand({
        ...input,
        requestHash: "a".repeat(64),
        leaseToken: "token",
        response: {
          orderId: "order-1",
          status: { address: "private" }
        } as never
      })
    ).rejects.toThrow("unsafe-operator-command-response");
    expect(completeCommerceCommand).not.toHaveBeenCalled();
  });
});
