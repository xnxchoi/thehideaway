import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(resolve(import.meta.dirname, "page.tsx"), "utf8");

describe("essay slug Instant UI contract", () => {
  it("exports a synchronous page so params and draft cookies do not block the shell", () => {
    expect(src).toMatch(/export default function Post\(/);
    expect(src).not.toMatch(/export default async function Post\(/);
  });

  it("wraps the param-dependent post body in server Suspense", () => {
    expect(src).toMatch(/<Suspense[\s\S]*params/);
  });

  it("caches metadata without draftMode or queryPostBySlug", () => {
    expect(src).toMatch(/"use cache"/);
    expect(src).toMatch(/cacheTag\("posts-sitemap"\)/);
    expect(src).not.toMatch(/draftMode\s*\(/);
    const meta = src.slice(
      src.indexOf("export async function generateMetadata")
    );
    expect(meta).not.toMatch(/queryPostBySlug\s*\(/);
  });
});
