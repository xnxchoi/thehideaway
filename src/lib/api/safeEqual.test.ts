import { describe, expect, it } from "vitest";
import { safeEqual } from "./safeEqual";

describe("safeEqual", () => {
  it("returns true for identical strings", () => {
    expect(safeEqual("secret123", "secret123")).toBe(true);
  });

  it("returns false when strings differ", () => {
    expect(safeEqual("secret123", "secret124")).toBe(false);
  });

  it("returns false when lengths differ", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("abcd", "abc")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(safeEqual("", "")).toBe(true);
  });

  it("returns false for empty vs non-empty", () => {
    expect(safeEqual("", "x")).toBe(false);
    expect(safeEqual("x", "")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(safeEqual("Password", "password")).toBe(false);
    expect(safeEqual("ABC", "abc")).toBe(false);
  });

  it("handles unicode correctly", () => {
    expect(safeEqual("안녕하세요", "안녕하세요")).toBe(true);
    expect(safeEqual("안녕하세요", "안녕하세요!")).toBe(false);
  });

  it("returns false when one input is a prefix of the other", () => {
    expect(safeEqual("abc", "abcdef")).toBe(false);
    expect(safeEqual("abcdef", "abc")).toBe(false);
  });

  it("handles strings with whitespace", () => {
    expect(safeEqual("hello world", "hello world")).toBe(true);
    expect(safeEqual("hello world", "helloworld")).toBe(false);
  });

  it("handles special characters", () => {
    const tok = "t0k3n!@#$%^&*()";
    expect(safeEqual(tok, tok)).toBe(true);
    expect(safeEqual(tok, tok.slice(0, -1))).toBe(false);
  });
});
