import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../../../../");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("dev auth lab isolation", () => {
  it("does not leak into production auth modules", () => {
    const files = [
      "src/components/auth/AuthCard.tsx",
      "src/components/auth/SignInForm.tsx",
      "src/components/auth/SignUpForm.tsx",
      "src/components/auth/ForgotPasswordForm.tsx",
      "src/components/auth/ResetPasswordForm.tsx",
      "src/components/auth/TwoFactorCard.tsx",
      "src/components/auth/PasskeyButton.tsx",
      "src/components/auth/ProviderButton.tsx",
      "src/lib/auth/options.ts",
      "src/lib/auth/client.ts",
      "src/lib/email/better-auth-integration.ts"
    ];
    for (const file of files) {
      expect(read(file), file).not.toMatch(/auth\/dev\/lab/);
    }
  });

  it("mounts from AuthShell only behind a production gate", () => {
    const src = read("src/components/auth/AuthShell.tsx");
    expect(src).toMatch(/auth\/dev\/lab\/DevAuthLabMount/);
    expect(src).not.toMatch(/auth\/dev\/lab\/DevAuthLab["']/);
    expect(src).toMatch(/NODE_ENV !== ["']production["']/);
    expect(src).toMatch(/<Suspense/);
  });

  it("loads the lab client-only so Instant UI prefetch never instantiates it", () => {
    const src = read("src/lib/auth/dev/lab/DevAuthLabMount.tsx");
    expect(src).toMatch(/["']use client["']/);
    expect(src).toMatch(/ssr:\s*false/);
    expect(src).toMatch(/import\(["']\.\/DevAuthLab["']\)/);
  });
});
