import { describe, expect, it } from "vitest";

import {
  isLostLaunchMediaReceipt,
  lostLaunchMediaDigest,
  lostLaunchMediaFilename,
  lostLaunchMediaIdentity,
  lostLaunchStagedFilename
} from "./lostLaunchMedia";

describe("LOST launch media identity", () => {
  it("derives the exact Payload filename from author and content", () => {
    expect(
      lostLaunchMediaFilename(
        "admin-1",
        "public/assets/lostinseoul/products/de-seoul/de-seoul.webp",
        Buffer.from("launch image")
      )
    ).toMatch(/^admin-1_[a-f0-9]{2}_[a-f0-9]{2}_de-seoul\.webp$/);
  });

  it("changes identity when content changes", () => {
    const first = lostLaunchMediaFilename(
      "admin-1",
      "image.webp",
      Buffer.from("a")
    );
    const second = lostLaunchMediaFilename(
      "admin-1",
      "image.webp",
      Buffer.from("b")
    );

    expect(first).not.toBe(second);
  });

  it("keeps content identity stable when the selected admin changes", () => {
    const data = Buffer.from("same launch image");

    expect(lostLaunchMediaIdentity("image.webp", data)).toBe(
      lostLaunchMediaFilename("admin-2", "image.webp", data).replace(
        /^admin-2_/,
        ""
      )
    );
  });

  it("uses a full SHA-256 digest to verify reused bytes", () => {
    expect(lostLaunchMediaDigest(Buffer.from("launch image"))).toMatch(
      /^[a-f0-9]{64}$/
    );
    expect(lostLaunchMediaDigest(Buffer.from("launch image"))).not.toBe(
      lostLaunchMediaDigest(Buffer.from("different image"))
    );
  });

  it("persists the full source digest in the staged upload basename", () => {
    const data = Buffer.from("launch image");
    const digest = lostLaunchMediaDigest(data);

    expect(lostLaunchStagedFilename("products/image.webp", data)).toBe(
      `${digest}-image.webp`
    );
  });

  it("accepts only complete server media receipts", () => {
    const digest = "a".repeat(64);
    expect(
      isLostLaunchMediaReceipt({
        filename: "stored.webp",
        sourceDigest: digest,
        storedDigest: digest
      })
    ).toBe(true);
    expect(
      isLostLaunchMediaReceipt({
        filename: "stored.webp",
        sourceDigest: "short",
        storedDigest: digest
      })
    ).toBe(false);
  });
});
