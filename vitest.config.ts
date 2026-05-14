import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      "@payload-types": path.resolve(root, "src/payload-types.ts")
    }
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".attic/**",
      "reference/**",
      ".claude/worktrees/**",
      ".next/**"
    ],
    environment: "node"
  }
});
