import { describe, expect, it } from "vitest";

import {
  clearPrivateQuoteIdempotencyKey,
  isPrivateQuoteSuccessBody,
  privateQuoteIdempotencyKey
} from "./private-quote-idempotency";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  };
}

describe("private quote idempotency key", () => {
  it("accepts only the durable quote success envelope", () => {
    expect(
      isPrivateQuoteSuccessBody({
        ok: true,
        order: { id: "order-1", order_ref: "lis_quote_1" }
      })
    ).toBe(true);
    expect(isPrivateQuoteSuccessBody({ ok: true })).toBe(false);
    expect(
      isPrivateQuoteSuccessBody({
        ok: true,
        order: { id: "", order_ref: "lis_quote_1" }
      })
    ).toBe(false);
  });

  it("reuses one key for a response-loss retry of the same request", async () => {
    const storage = memoryStorage();
    const command = JSON.stringify({ productId: "product-1", quantity: 1 });

    const first = await privateQuoteIdempotencyKey(command, storage);
    const retry = await privateQuoteIdempotencyKey(command, storage);

    expect(retry).toBe(first);
  });

  it("uses a new key when the validated request changes", async () => {
    const storage = memoryStorage();
    const first = await privateQuoteIdempotencyKey(
      JSON.stringify({ productId: "product-1", quantity: 1 }),
      storage
    );
    const changed = await privateQuoteIdempotencyKey(
      JSON.stringify({ productId: "product-1", quantity: 2 }),
      storage
    );

    expect(changed).not.toBe(first);
    await expect(
      privateQuoteIdempotencyKey(
        JSON.stringify({ productId: "product-1", quantity: 1 }),
        storage
      )
    ).resolves.toBe(first);
  });

  it("replaces malformed session data", async () => {
    const storage = memoryStorage();
    storage.setItem("lostinseoul.private-quote.command", "not-json");

    await expect(privateQuoteIdempotencyKey("{}", storage)).resolves.toMatch(
      /^[A-Za-z0-9_-]{16,128}$/
    );
  });

  it("clears the key after confirmed success", async () => {
    const storage = memoryStorage();
    const command = "{}";
    const first = await privateQuoteIdempotencyKey(command, storage);

    await clearPrivateQuoteIdempotencyKey(command, first, storage);
    const next = await privateQuoteIdempotencyKey(command, storage);

    expect(next).not.toBe(first);
  });

  it("clears only the completed request when commands overlap", async () => {
    const storage = memoryStorage();
    const commandA = JSON.stringify({ productId: "product-a", quantity: 1 });
    const commandB = JSON.stringify({ productId: "product-b", quantity: 1 });
    const keyA = await privateQuoteIdempotencyKey(commandA, storage);
    const keyB = await privateQuoteIdempotencyKey(commandB, storage);

    await clearPrivateQuoteIdempotencyKey(commandA, keyA, storage);

    await expect(privateQuoteIdempotencyKey(commandB, storage)).resolves.toBe(
      keyB
    );
    await expect(
      privateQuoteIdempotencyKey(commandA, storage)
    ).resolves.not.toBe(keyA);
  });

  it("falls back to memory when browser storage is unavailable", async () => {
    const storage = {
      getItem: () => {
        throw new Error("storage-unavailable");
      },
      setItem: () => {
        throw new Error("storage-unavailable");
      },
      removeItem: () => {
        throw new Error("storage-unavailable");
      }
    };
    const command = JSON.stringify({ productId: "storage-test", quantity: 1 });
    const first = await privateQuoteIdempotencyKey(command, storage);

    await expect(privateQuoteIdempotencyKey(command, storage)).resolves.toBe(
      first
    );
    await expect(
      clearPrivateQuoteIdempotencyKey(command, first, storage)
    ).resolves.toBeUndefined();
  });

  it("falls back when reading the sessionStorage property throws", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "sessionStorage"
    );
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new Error("storage-getter-unavailable");
      }
    });
    const command = JSON.stringify({ productId: "getter-test", quantity: 1 });

    try {
      const first = await privateQuoteIdempotencyKey(command);
      await expect(privateQuoteIdempotencyKey(command)).resolves.toBe(first);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "sessionStorage", descriptor);
      } else {
        Reflect.deleteProperty(globalThis, "sessionStorage");
      }
    }
  });

  it("does not revive a cleared key after persistent removal fails", async () => {
    const working = memoryStorage();
    const command = JSON.stringify({ productId: "remove-test", quantity: 1 });
    const first = await privateQuoteIdempotencyKey(command, working);
    const failing = {
      getItem: working.getItem,
      setItem: () => {
        throw new Error("storage-write-unavailable");
      },
      removeItem: () => {
        throw new Error("storage-write-unavailable");
      }
    };

    await clearPrivateQuoteIdempotencyKey(command, first, failing);
    const next = await privateQuoteIdempotencyKey(command, failing);

    expect(next).not.toBe(first);
  });
});
