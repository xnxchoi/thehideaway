import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail }))
  }
}));

import { sendAdminInviteWithEmailService } from "./better-auth-integration";

describe("configured admin invitation email", () => {
  beforeEach(() => {
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: "message-id" });
  });

  it("reports success only after the invitation email is sent", async () => {
    const payload = { logger: { info: vi.fn(), warn: vi.fn() } };
    const result = await sendAdminInviteWithEmailService({
      payload: payload as never,
      email: "invitee@example.com",
      url: "https://hideawayseoul.com/admin-ba?token=raw-token"
    });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "invitee@example.com",
        subject: "Your invitation to The Hideaway",
        text: expect.stringContaining(
          "https://hideawayseoul.com/admin-ba?token=raw-token"
        )
      })
    );
    expect(result).toEqual({ success: true });
  });

  it("propagates delivery failures instead of reporting success", async () => {
    sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));

    await expect(
      sendAdminInviteWithEmailService({
        payload: { logger: { info: vi.fn(), warn: vi.fn() } } as never,
        email: "invitee@example.com",
        url: "https://hideawayseoul.com/admin-ba?token=raw-token"
      })
    ).rejects.toThrow("SMTP unavailable");
  });
});
