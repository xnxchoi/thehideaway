import { timingSafeEqual } from "crypto";

/**
 * Constant-time string equality check. Use for comparing secrets, passwords,
 * tokens, and any short-known value where a `!==` byte-shortcut would leak
 * the prefix.
 *
 * Buffers are padded to the longer of the two lengths so `timingSafeEqual`
 * sees same-length buffers; the final length check rejects unequal-length
 * inputs without revealing where they diverge.
 */
export function safeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length, 1);
  const aBuf = Buffer.alloc(max);
  const bBuf = Buffer.alloc(max);
  aBuf.write(a);
  bBuf.write(b);
  return a.length === b.length && timingSafeEqual(aBuf, bBuf);
}
