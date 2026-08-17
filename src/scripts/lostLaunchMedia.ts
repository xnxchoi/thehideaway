import { createHash } from "node:crypto";
import { basename } from "node:path";

export function lostLaunchMediaFilename(
  authorId: string,
  assetPath: string,
  data: Buffer
): string {
  return `${authorId}_${lostLaunchMediaIdentity(assetPath, data)}`;
}

export function lostLaunchMediaIdentity(
  assetPath: string,
  data: Buffer
): string {
  const hash = createHash("md5").update(data).digest("hex");
  return `${hash.slice(0, 2)}_${hash.slice(2, 4)}_${basename(assetPath)}`;
}

export function lostLaunchMediaDigest(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export function lostLaunchStagedFilename(
  assetPath: string,
  data: Buffer
): string {
  return `${lostLaunchMediaDigest(data)}-${basename(assetPath)}`;
}

export type LostLaunchMediaReceipt = {
  filename: string;
  sourceDigest: string;
  storedDigest: string;
};

export function isLostLaunchMediaReceipt(
  value: unknown
): value is LostLaunchMediaReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<LostLaunchMediaReceipt>;
  return (
    typeof receipt.filename === "string" &&
    /^[a-f0-9]{64}$/.test(receipt.sourceDigest ?? "") &&
    /^[a-f0-9]{64}$/.test(receipt.storedDigest ?? "")
  );
}
