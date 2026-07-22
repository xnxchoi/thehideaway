import { afterEach, describe, expect, it } from "vitest";
import type { PayloadRequest } from "payload";

import { canManagePayloadJobs, payloadJobsAccess } from "./access";

const originalCronSecret = process.env.CRON_SECRET;

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
});

function request(input?: { role?: string; authorization?: string }) {
  return {
    user: input?.role ? { id: "user-1", role: input.role } : null,
    headers: new Headers(
      input?.authorization ? { authorization: input.authorization } : undefined
    )
  } as unknown as PayloadRequest;
}

describe("Payload jobs access", () => {
  it("limits the machine bearer token to running scheduled work", () => {
    process.env.CRON_SECRET = "cron-secret";
    const req = request({ authorization: "Bearer cron-secret" });
    expect(payloadJobsAccess.run({ req })).toBe(true);
    expect(payloadJobsAccess.queue({ req })).toBe(false);
    expect(payloadJobsAccess.cancel({ req })).toBe(false);
  });

  it("allows admins", () => {
    delete process.env.CRON_SECRET;
    expect(canManagePayloadJobs({ req: request({ role: "admin" }) })).toBe(
      true
    );
  });

  it("rejects authenticated non-admin users", () => {
    process.env.CRON_SECRET = "cron-secret";
    expect(canManagePayloadJobs({ req: request({ role: "user" }) })).toBe(
      false
    );
  });

  it("allows an exact CRON_SECRET bearer token", () => {
    process.env.CRON_SECRET = "cron-secret";
    expect(
      canManagePayloadJobs({
        req: request({ authorization: "Bearer cron-secret" })
      })
    ).toBe(true);
  });

  it.each([
    undefined,
    "cron-secret",
    "Bearer cron-secret-extra",
    "Bearer wrong-secret"
  ])("rejects a missing or invalid bearer token: %s", (authorization) => {
    process.env.CRON_SECRET = "cron-secret";
    expect(canManagePayloadJobs({ req: request({ authorization }) })).toBe(
      false
    );
  });
});
