import { createHash, timingSafeEqual } from "crypto";
import type { PayloadRequest } from "payload";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function canManagePayloadJobs({
  req
}: {
  req: PayloadRequest;
}): boolean {
  if (req.user?.role === "admin") return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authorization = req.headers.get("authorization") ?? "";
  return timingSafeEqual(digest(authorization), digest(`Bearer ${cronSecret}`));
}

export function canAdministerPayloadJobs({
  req
}: {
  req: PayloadRequest;
}): boolean {
  return req.user?.role === "admin";
}

export const payloadJobsAccess = Object.freeze({
  run: canManagePayloadJobs,
  queue: canAdministerPayloadJobs,
  cancel: canAdministerPayloadJobs
});
