import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn(async () => ({}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail }))
  }
}));

describe("TicketMailer", () => {
  beforeEach(() => {
    sendMail.mockClear();
    vi.resetModules();
    vi.stubEnv("BREVO_SMTP_USER", "test-user");
    vi.stubEnv("BREVO_SMTP_PASS", "test-pass");
    vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "https://hideaway.test");
  });

  it("renders Day n Night purchase receipts with the event-owned my tickets URL", async () => {
    const { TicketMailer } = await import("./ticket-mailer");
    const mailer = new TicketMailer();

    await mailer.sendPurchaseReceipt({
      ticketId: "ticket-1",
      eventName: "Day n Night",
      recipientEmail: "buyer@example.com",
      quantity: 2,
      totalAmount: 130000,
      managementUrl: "https://hideaway.test/day-n-night/my"
    });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0]?.[0] as {
      html: string;
      text: string;
    };
    expect(sent.html).toContain("https://hideaway.test/day-n-night/my");
    expect(sent.text).toContain("https://hideaway.test/day-n-night/my");
    expect(sent.html).not.toContain("https://hideaway.test/tickets/my");
    expect(sent.text).not.toContain("https://hideaway.test/tickets/my");
  });
});
