import { beforeEach, describe, expect, it, vi } from "vitest";

const findByID = vi.fn();
const update = vi.fn();
const auth = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@payload-config", () => ({ default: {} }));

vi.mock("next/cache", () => ({
  revalidatePath
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(() => ({ value: "payload-token" }))
  }))
}));

vi.mock("payload", () => ({
  getPayload: vi.fn(async () => ({
    findByID,
    update,
    auth
  }))
}));

vi.mock("@/lib/api/serverActionRateLimit", () => ({
  enforceServerActionRateLimit: vi.fn(async () => ({ ok: true }))
}));

function claimForm(password = "ORDERPASS"): FormData {
  const form = new FormData();
  form.set("ticketId", "ticket-1");
  form.set("password", password);
  return form;
}

describe("submitClaim", () => {
  beforeEach(() => {
    findByID.mockReset();
    update.mockReset().mockResolvedValue({});
    auth.mockReset().mockResolvedValue({
      user: { id: "recipient-user", email: "gift@example.com" }
    });
    revalidatePath.mockReset();
  });

  it("rejects a paid-password claim before the parent order is paid", async () => {
    findByID
      .mockResolvedValueOnce({
        id: "ticket-1",
        order: "order-1",
        claimed_at: null,
        claim_email: null
      })
      .mockResolvedValueOnce({
        id: "order-1",
        paid: false,
        password: "ORDERPASS",
        password_expires_at: new Date(Date.now() + 60_000).toISOString()
      });

    const { submitClaim } = await import("./action");

    await expect(submitClaim(undefined, claimForm())).resolves.toEqual({
      ok: false,
      error: "invalid"
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects email-restricted gifts when the signed-in viewer email differs", async () => {
    auth.mockResolvedValue({
      user: { id: "other-user", email: "other@example.com" }
    });
    findByID
      .mockResolvedValueOnce({
        id: "ticket-1",
        order: "order-1",
        claimed_at: null,
        claim_email: "gift@example.com"
      })
      .mockResolvedValueOnce({
        id: "order-1",
        paid: true,
        password: "ORDERPASS",
        password_expires_at: new Date(Date.now() + 60_000).toISOString()
      });

    const { submitClaim } = await import("./action");

    await expect(submitClaim(undefined, claimForm())).resolves.toEqual({
      ok: false,
      error: "emailMismatch"
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects anonymous claims so every claimed ticket remains manageable", async () => {
    auth.mockResolvedValue({ user: null });

    const { submitClaim } = await import("./action");

    await expect(submitClaim(undefined, claimForm())).resolves.toEqual({
      ok: false,
      error: "authRequired"
    });
    expect(findByID).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("claims a valid gift by clearing its token and binding it to the viewer", async () => {
    findByID
      .mockResolvedValueOnce({
        id: "ticket-1",
        order: "order-1",
        claimed_at: null,
        claim_token: "claim-token",
        claim_email: "gift@example.com"
      })
      .mockResolvedValueOnce({
        id: "order-1",
        paid: true,
        password: "ORDERPASS",
        password_expires_at: new Date(Date.now() + 60_000).toISOString()
      });

    const { submitClaim } = await import("./action");

    await expect(submitClaim(undefined, claimForm())).resolves.toEqual({
      ok: true
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "tickets",
        id: "ticket-1",
        data: expect.objectContaining({
          claim_token: null,
          user: "recipient-user"
        })
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/day-n-night/my", "layout");
  });
});
