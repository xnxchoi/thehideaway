#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/* scripts/sync-deploy-rules.ts
 *
 * Generates .dockerignore and .deployignore from deploy-manifest.json.
 *
 * Usage:
 *   pnpm sync:deploy-rules           - regenerate both files in place
 *   pnpm verify:deploy-rules         - exit 1 if on-disk files differ from
 *                                      what the manifest would generate (CI gate)
 *
 * The manifest is the single source of truth. .dockerignore and .deployignore
 * are committed to git so a fresh clone deploys without running the regen,
 * but any pattern edit must go via the manifest + this script. CI verifies.
 *
 * No app imports. No DB. Runs in well under a second.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// ── Schema ───────────────────────────────────────────────────────────────────

const TargetSchema = z.enum(["docker", "rsync"]);
type Target = z.infer<typeof TargetSchema>;

const RuleSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  exclude_from: z.array(TargetSchema).min(1),
  note: z.string().optional()
});

const SectionSchema = z.object({
  title: z.string().min(1),
  rules: z.array(RuleSchema).min(1)
});

const ManifestSchema = z.object({
  version: z.literal(1),
  comment: z.string(),
  generated_files: z.object({
    docker: z.string().min(1),
    rsync: z.string().min(1)
  }),
  sections: z.array(SectionSchema).min(1)
});
type Manifest = z.infer<typeof ManifestSchema>;

// ── Paths ────────────────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const manifestPath = resolve(projectRoot, "deploy-manifest.json");

// ── Manifest -> file body ────────────────────────────────────────────────────

interface RenderInput {
  readonly target: Target;
  readonly outputFile: string;
  readonly manifest: Manifest;
}

function render({ target, outputFile, manifest }: RenderInput): string {
  const lines: string[] = [
    `# ${outputFile} - GENERATED FROM deploy-manifest.json. DO NOT EDIT BY HAND.`,
    `# Edit deploy-manifest.json, then run \`pnpm sync:deploy-rules\`.`,
    `# CI runs \`pnpm verify:deploy-rules\` to catch drift.`,
    ""
  ];

  for (const section of manifest.sections) {
    const sectionRules = section.rules.filter((rule) =>
      rule.exclude_from.includes(target)
    );
    if (sectionRules.length === 0) continue;

    lines.push(
      `# ── ${section.title} ────────────────────────────────────────`
    );
    for (const rule of sectionRules) {
      if (rule.note !== undefined && rule.note.length > 0) {
        for (const wrapped of wrap(rule.note, 76)) {
          lines.push(`#   ${wrapped}`);
        }
      }
      lines.push(rule.pattern);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length > width) {
      out.push(current);
      current = word;
    } else {
      current = current + " " + word;
    }
  }
  if (current.length > 0) out.push(current);
  return out;
}

// ── Drift detection ──────────────────────────────────────────────────────────

interface CheckResult {
  readonly outputFile: string;
  readonly absolutePath: string;
  readonly expected: string;
  readonly actual: string | null;
  readonly inSync: boolean;
}

function checkFile(target: Target, manifest: Manifest): CheckResult {
  const outputFile = manifest.generated_files[target];
  const absolutePath = resolve(projectRoot, outputFile);
  const expected = render({ target, outputFile, manifest });
  let actual: string | null = null;
  try {
    actual = readFileSync(absolutePath, "utf8");
  } catch {
    actual = null;
  }
  return {
    outputFile,
    absolutePath,
    expected,
    actual,
    inSync: actual === expected
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

type Mode = "sync" | "verify";

function parseMode(argv: readonly string[]): Mode {
  const arg = argv[0];
  if (arg === "--verify" || arg === "verify") return "verify";
  if (arg === undefined || arg === "--sync" || arg === "sync") return "sync";
  console.error(`✗ Unknown argument: ${arg}`);
  console.error("  Usage: sync-deploy-rules.ts [sync|verify]");
  process.exit(2);
}

function loadManifest(): Manifest {
  const raw = readFileSync(manifestPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const result = ManifestSchema.safeParse(parsed);
  if (!result.success) {
    console.error("✗ deploy-manifest.json failed schema validation:");
    for (const issue of result.error.issues) {
      const path = issue.path.length === 0 ? "<root>" : issue.path.join(".");
      console.error(`  ${path}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

function main(): void {
  const mode = parseMode(process.argv.slice(2));
  const manifest = loadManifest();
  const targets: readonly Target[] = ["docker", "rsync"] as const;

  if (mode === "verify") {
    const results = targets.map((t) => checkFile(t, manifest));
    const drifted = results.filter((r) => !r.inSync);
    if (drifted.length === 0) {
      console.log(
        "✓ .dockerignore and .deployignore are in sync with deploy-manifest.json"
      );
      process.exit(0);
    }
    console.error(
      "✗ Drift detected between deploy-manifest.json and generated files:"
    );
    for (const r of drifted) {
      if (r.actual === null) {
        console.error(`  ${r.outputFile}: missing on disk`);
      } else {
        console.error(`  ${r.outputFile}: differs from manifest output`);
      }
    }
    console.error("");
    console.error("  Fix: run `pnpm sync:deploy-rules` and commit the result.");
    process.exit(1);
  }

  for (const target of targets) {
    const r = checkFile(target, manifest);
    if (r.inSync) {
      console.log(`  ${r.outputFile}: already in sync`);
      continue;
    }
    writeFileSync(r.absolutePath, r.expected, "utf8");
    console.log(`✓ ${r.outputFile}: regenerated`);
  }
}

main();
