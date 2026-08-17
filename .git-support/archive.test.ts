import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import {
  applyArchiveRestore,
  planArchiveRestore,
  validateArchiveCatalog
} from "./archive.mjs";

const archiveScript = fileURLToPath(new URL("./archive.mjs", import.meta.url));

describe("archive workflow", () => {
  it("rejects unsafe or incomplete bundle paths", () => {
    expect(() =>
      validateArchiveCatalog({
        schemaVersion: 1,
        archiveRef: "archive/source",
        bundles: {
          unsafe: {
            root: "../outside",
            files: ["src/feature.ts"]
          }
        }
      })
    ).toThrow("unsafe-archive-path");
    expect(() =>
      validateArchiveCatalog({ schemaVersion: 2, bundles: {} })
    ).toThrow("invalid-archive-catalog");
    expect(() =>
      validateArchiveCatalog({
        schemaVersion: 1,
        archiveRef: "archive/source",
        bundles: { broken: { root: "bundles/broken" } }
      })
    ).toThrow("invalid-archive-bundle");
  });

  it("plans exact restores and reports collisions without writing", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hideaway-archive-"));
    const mountRoot = path.join(root, ".git-support", "archive-worktree");
    await mkdir(path.join(mountRoot, "bundles", "commerce", "src"), {
      recursive: true
    });
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(
      path.join(mountRoot, "bundles", "commerce", "src", "feature.ts"),
      "archived"
    );
    await writeFile(path.join(root, "src", "feature.ts"), "active");

    const plan = await planArchiveRestore({
      root,
      mountRoot,
      bundle: {
        root: "bundles/commerce",
        files: ["src/feature.ts"]
      }
    });

    expect(plan).toEqual([
      expect.objectContaining({
        path: "src/feature.ts",
        collision: true
      })
    ]);
    await expect(applyArchiveRestore(plan)).rejects.toThrow(
      "archive-restore-collision"
    );
  });

  it("restores a collision-free bundle to its original path", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hideaway-archive-"));
    const mountRoot = path.join(root, ".git-support", "archive-worktree");
    await mkdir(path.join(mountRoot, "bundles", "commerce", "src"), {
      recursive: true
    });
    await writeFile(
      path.join(mountRoot, "bundles", "commerce", "src", "feature.ts"),
      "archived"
    );

    const plan = await planArchiveRestore({
      root,
      mountRoot,
      bundle: {
        root: "bundles/commerce",
        files: ["src/feature.ts"]
      }
    });

    await applyArchiveRestore(plan);
    await expect(
      import("node:fs/promises").then(({ readFile }) =>
        readFile(path.join(root, "src", "feature.ts"), "utf8")
      )
    ).resolves.toBe("archived");
  });

  it("does not overwrite a destination created after the dry-run plan", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hideaway-archive-race-"));
    const mountRoot = path.join(root, ".git-support", "archive-worktree");
    await mkdir(path.join(mountRoot, "bundles", "sample", "src"), {
      recursive: true
    });
    await writeFile(
      path.join(mountRoot, "bundles", "sample", "src", "x.ts"),
      "archived"
    );
    const plan = await planArchiveRestore({
      root,
      mountRoot,
      bundle: { root: "bundles/sample", files: ["src/x.ts"] }
    });
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(path.join(root, "src", "x.ts"), "created-after-plan");

    await expect(applyArchiveRestore(plan)).rejects.toThrow(
      "archive-restore-collision"
    );
    await expect(
      readFile(path.join(root, "src", "x.ts"), "utf8")
    ).resolves.toBe("created-after-plan");
  });

  it("rejects a destination parent that escapes through a symlink", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hideaway-archive-link-"));
    const outside = await mkdtemp(path.join(tmpdir(), "hideaway-outside-"));
    const mountRoot = path.join(root, ".git-support", "archive-worktree");
    await mkdir(path.join(mountRoot, "bundles", "sample", "linked"), {
      recursive: true
    });
    await writeFile(
      path.join(mountRoot, "bundles", "sample", "linked", "x.ts"),
      "archived"
    );
    await symlink(outside, path.join(root, "linked"));

    await expect(
      planArchiveRestore({
        root,
        mountRoot,
        bundle: { root: "bundles/sample", files: ["linked/x.ts"] }
      })
    ).rejects.toThrow("unsafe-archive-destination");
    await expect(
      readFile(path.join(outside, "x.ts"), "utf8")
    ).rejects.toThrow();
  });

  it("supports list, inspect, dry-run, and explicit CLI restoration", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hideaway-archive-cli-"));
    await mkdir(path.join(root, ".git-support"), { recursive: true });
    await writeFile(
      path.join(root, ".git-support", "archive.json"),
      JSON.stringify({
        schemaVersion: 1,
        archiveRef: "archive/source",
        bundles: {
          sample: { root: "bundles/sample", files: ["src/x.ts"] }
        }
      })
    );
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    execFileSync("git", ["add", ".git-support/archive.json"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
    execFileSync("git", ["switch", "-q", "-c", "archive/source"], {
      cwd: root
    });
    await mkdir(path.join(root, "bundles", "sample", "src"), {
      recursive: true
    });
    await writeFile(
      path.join(root, "bundles", "sample", "src", "x.ts"),
      "restored"
    );
    execFileSync("git", ["add", "bundles/sample/src/x.ts"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "archive bundle"], { cwd: root });
    execFileSync("git", ["switch", "-q", "main"], { cwd: root });

    expect(
      execFileSync(process.execPath, [archiveScript, "list"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain("sample");
    expect(
      execFileSync(process.execPath, [archiveScript, "inspect", "sample"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain('"id": "sample"');
    expect(
      execFileSync(process.execPath, [archiveScript, "mount"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain("Mounted archive/source");
    expect(
      execFileSync(process.execPath, [archiveScript, "restore", "sample"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain("Dry run only");
    await expect(
      readFile(path.join(root, "src", "x.ts"), "utf8")
    ).rejects.toThrow();

    expect(
      execFileSync(
        process.execPath,
        [archiveScript, "restore", "sample", "--apply"],
        { cwd: root, encoding: "utf8" }
      )
    ).toContain("Restored 1 file");
    await expect(
      readFile(path.join(root, "src", "x.ts"), "utf8")
    ).resolves.toBe("restored");
  });

  it("rejects an ordinary directory pretending to be the archive worktree", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "hideaway-archive-fake-"));
    await mkdir(
      path.join(
        root,
        ".git-support",
        "archive-worktree",
        "bundles",
        "sample",
        "src"
      ),
      { recursive: true }
    );
    await writeFile(
      path.join(root, ".git-support", "archive.json"),
      JSON.stringify({
        schemaVersion: 1,
        archiveRef: "main",
        bundles: {
          sample: { root: "bundles/sample", files: ["src/x.ts"] }
        }
      })
    );
    await writeFile(
      path.join(
        root,
        ".git-support",
        "archive-worktree",
        "bundles",
        "sample",
        "src",
        "x.ts"
      ),
      "untrusted"
    );
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    execFileSync("git", ["add", ".git-support/archive.json"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });

    expect(() =>
      execFileSync(process.execPath, [archiveScript, "restore", "sample"], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe"
      })
    ).toThrow();
    await expect(
      readFile(path.join(root, "src", "x.ts"), "utf8")
    ).rejects.toThrow();
  });
});
