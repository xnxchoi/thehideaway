import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import {
  parseStagedMediaChanges,
  readStagedPublicState,
  scanMediaDirectory,
  syncStagedMediaCatalog
} from "./media.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "hideaway-media-"));
  await mkdir(path.join(root, "public", "nested"), { recursive: true });
  await writeFile(path.join(root, "public", "selected.png"), "selected");
  await writeFile(path.join(root, "public", "nested", "local.jpg"), "local");
  return root;
}

const emptyCatalog = Object.freeze({
  schemaVersion: 1,
  assets: Object.freeze([])
});
const mediaScript = fileURLToPath(new URL("./media.mjs", import.meta.url));

describe("staged media workflow", () => {
  it("parses NUL-delimited add, modify, delete, and rename changes", () => {
    const changes = parseStagedMediaChanges(
      [
        "A",
        "public/a.png",
        "M",
        "public/b.jpg",
        "D",
        "public/c.mp4",
        "R100",
        "public/old.glb",
        "public/new.glb",
        ""
      ].join("\0")
    );

    expect(changes).toEqual([
      { kind: "add", path: "public/a.png" },
      { kind: "modify", path: "public/b.jpg" },
      { kind: "delete", path: "public/c.mp4" },
      {
        kind: "rename",
        path: "public/new.glb",
        previousPath: "public/old.glb"
      }
    ]);
  });

  it("catalogs only the media already selected in Git", async () => {
    const root = await fixture();

    const result = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: [{ kind: "add", path: "public/selected.png" }],
      trackedPaths: new Set(["public/selected.png"])
    });

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]).toMatchObject({
      path: "public/selected.png",
      bytes: 8,
      mimeType: "image/png",
      gitTracked: true
    });
    expect(result.assets[0]?.sha256).toBe(
      createHash("sha256").update("selected").digest("hex")
    );
    expect(
      result.assets.some((asset) => asset.path.includes("local.jpg"))
    ).toBe(false);
  });

  it("preserves identity across a staged rename", async () => {
    const root = await fixture();
    await writeFile(path.join(root, "public", "renamed.png"), "selected");
    const existing = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: [{ kind: "add", path: "public/selected.png" }],
      trackedPaths: new Set(["public/selected.png"])
    });
    const originalId = existing.assets[0]?.id;

    const result = await syncStagedMediaCatalog({
      root,
      catalog: existing,
      changes: [
        {
          kind: "rename",
          previousPath: "public/selected.png",
          path: "public/renamed.png"
        }
      ],
      trackedPaths: new Set(["public/renamed.png"])
    });

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]).toMatchObject({
      id: originalId,
      path: "public/renamed.png"
    });
  });

  it("removes a locally present file from the publishable catalog when Git stops tracking it", async () => {
    const root = await fixture();
    const existing = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: [{ kind: "add", path: "public/selected.png" }],
      trackedPaths: new Set(["public/selected.png"])
    });

    const result = await syncStagedMediaCatalog({
      root,
      catalog: existing,
      changes: [{ kind: "delete", path: "public/selected.png" }],
      trackedPaths: new Set()
    });

    expect(result.assets).toEqual([]);
  });

  it("explicitly scans every local public file without changing Git", async () => {
    const root = await fixture();

    const result = await scanMediaDirectory({
      root,
      catalog: emptyCatalog,
      trackedPaths: new Set(["public/selected.png"])
    });

    expect(
      result.assets.map((asset) => [asset.path, asset.gitTracked])
    ).toEqual([
      ["public/nested/local.jpg", false],
      ["public/selected.png", true]
    ]);
    await expect(
      readFile(path.join(root, "public", "selected.png"), "utf8")
    ).resolves.toBe("selected");
  });

  it("retains a tracked asset from its Git blob when it is absent locally", async () => {
    const root = await fixture();
    const trackedPath = "public/tracked-only.mp4";

    const result = await scanMediaDirectory({
      root,
      catalog: emptyCatalog,
      trackedPaths: new Set([trackedPath]),
      trackedFiles: new Map([[trackedPath, Buffer.from("from-git")]])
    });

    expect(
      result.assets.find((asset) => asset.path === trackedPath)
    ).toMatchObject({
      bytes: 8,
      gitTracked: true,
      mimeType: "video/mp4"
    });
  });

  it("scans tracked media from Git rather than an unstaged working edit", async () => {
    const root = await fixture();
    const trackedPath = "public/selected.png";
    await writeFile(path.join(root, trackedPath), "unstaged");
    const readTrackedFile = vi.fn(async () => Buffer.from("selected"));

    const result = await scanMediaDirectory({
      root,
      catalog: emptyCatalog,
      trackedPaths: new Set([trackedPath]),
      readTrackedFile
    });

    expect(readTrackedFile).toHaveBeenCalledWith(trackedPath);
    expect(
      result.assets.find((asset) => asset.path === trackedPath)?.sha256
    ).toBe(createHash("sha256").update("selected").digest("hex"));
  });

  it("uses the staged blob even when the working file changes afterward", async () => {
    const root = await fixture();
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    execFileSync("git", ["add", "--", "public/selected.png"], { cwd: root });
    await writeFile(path.join(root, "public", "selected.png"), "not-staged");

    const state = readStagedPublicState(root);
    const result = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: state.changes,
      trackedPaths: state.trackedPaths,
      stagedFiles: state.stagedFiles
    });

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0]?.sha256).toBe(
      createHash("sha256").update("selected").digest("hex")
    );
  });

  it("supports staged media blobs larger than the former 32 MiB buffer", async () => {
    const root = await fixture();
    const largePath = path.join(root, "public", "large.glb");
    const largeBytes = Buffer.alloc(33 * 1024 * 1024, 7);
    await writeFile(largePath, largeBytes);
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["add", "--", "public/large.glb"], { cwd: root });

    const state = readStagedPublicState(root);

    expect(state.stagedFiles.get("public/large.glb")?.byteLength).toBe(
      largeBytes.byteLength
    );
  });

  it("refuses to publish runtime user uploads even when force-staged", async () => {
    const root = await fixture();
    await mkdir(path.join(root, "public", "users", "account"), {
      recursive: true
    });
    await writeFile(
      path.join(root, "public", "users", "account", "upload.png"),
      "private"
    );
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync(
      "git",
      ["add", "-f", "--", "public/users/account/upload.png"],
      { cwd: root }
    );

    expect(() => readStagedPublicState(root)).toThrow("private-media-path");
  });

  it("rejects unsupported staged statuses and unsafe paths", () => {
    expect(() =>
      parseStagedMediaChanges(["U", "public/conflict.png", ""].join("\0"))
    ).toThrow("unsupported-media-status");
    expect(() =>
      parseStagedMediaChanges(["A", "../outside.png", ""].join("\0"))
    ).toThrow("unsafe-media-path");
    expect(() => parseStagedMediaChanges(["A", ""].join("\0"))).toThrow(
      "invalid-staged-media-output"
    );
    expect(() =>
      parseStagedMediaChanges(["R90", "public/old.png", ""].join("\0"))
    ).toThrow("invalid-staged-media-output");
    expect(
      parseStagedMediaChanges(
        ["C100", "public/copy.bin", "T", "public/type.bin", ""].join("\0")
      )
    ).toEqual([
      { kind: "add", path: "public/copy.bin" },
      { kind: "modify", path: "public/type.bin" }
    ]);
  });

  it("removes a catalog entry when a staged deletion is absent locally", async () => {
    const root = await fixture();
    const existing = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: [{ kind: "add", path: "public/selected.png" }],
      trackedPaths: new Set(["public/selected.png"])
    });
    await import("node:fs/promises").then(({ unlink }) =>
      unlink(path.join(root, "public", "selected.png"))
    );

    const result = await syncStagedMediaCatalog({
      root,
      catalog: existing,
      changes: [{ kind: "delete", path: "public/selected.png" }],
      trackedPaths: new Set()
    });

    expect(result.assets).toEqual([]);
  });

  it("uses a generic MIME type for explicitly selected future formats", async () => {
    const root = await fixture();
    await writeFile(path.join(root, "public", "future.asset"), "future");
    const result = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: [{ kind: "add", path: "public/future.asset" }],
      trackedPaths: new Set(["public/future.asset"])
    });
    expect(result.assets[0]?.mimeType).toBe("application/octet-stream");
  });

  it("fails closed on an unsupported catalog schema", async () => {
    await expect(
      syncStagedMediaCatalog({
        root: await fixture(),
        catalog: { schemaVersion: 2, assets: [] } as never,
        changes: [],
        trackedPaths: new Set()
      })
    ).rejects.toThrow("unsupported-media-catalog");
  });

  it("blocks a catalog-only attempt to publish a private upload", async () => {
    const root = await fixture();
    await mkdir(path.join(root, ".git-support"), { recursive: true });
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    await writeFile(
      path.join(root, ".git-support", "media.json"),
      JSON.stringify({ schemaVersion: 1, assets: [] })
    );
    execFileSync("git", ["add", "--", ".git-support/media.json"], {
      cwd: root
    });
    execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
    await writeFile(
      path.join(root, ".git-support", "media.json"),
      JSON.stringify({
        schemaVersion: 1,
        assets: [
          {
            id: "private",
            path: "public/users/account/upload.png",
            sha256: "private",
            bytes: 7,
            mimeType: "image/png",
            gitTracked: false
          }
        ]
      })
    );
    execFileSync("git", ["add", "--", ".git-support/media.json"], {
      cwd: root
    });

    expect(() =>
      execFileSync(process.execPath, [mediaScript, "sync-staged", "--stage"], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe"
      })
    ).toThrow();
  });

  it("fails audit when the publishable catalog contains an untracked record", async () => {
    const root = await fixture();
    await mkdir(path.join(root, ".git-support"), { recursive: true });
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["add", "--", "public/selected.png"], { cwd: root });
    const state = readStagedPublicState(root);
    const selectedCatalog = await syncStagedMediaCatalog({
      root,
      catalog: emptyCatalog,
      changes: state.changes,
      trackedPaths: state.trackedPaths,
      stagedFiles: state.stagedFiles
    });
    await writeFile(
      path.join(root, ".git-support", "media.json"),
      JSON.stringify({
        ...selectedCatalog,
        assets: [
          ...selectedCatalog.assets,
          {
            id: "extra",
            path: "public/nested/local.jpg",
            sha256: "extra",
            bytes: 5,
            mimeType: "image/jpeg",
            gitTracked: false
          }
        ]
      })
    );

    expect(() =>
      execFileSync(process.execPath, [mediaScript, "audit"], {
        cwd: root,
        encoding: "utf8",
        stdio: "pipe"
      })
    ).toThrow();
  });

  it("repairs catalog-only metadata tampering from authoritative Git blobs", async () => {
    const root = await fixture();
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    execFileSync("git", ["add", "--", "public/selected.png"], { cwd: root });
    execFileSync(process.execPath, [mediaScript, "sync-staged", "--stage"], {
      cwd: root,
      stdio: "pipe"
    });
    execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
    const catalogPath = path.join(root, ".git-support", "media.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    await writeFile(
      catalogPath,
      JSON.stringify({
        ...catalog,
        assets: catalog.assets.map((asset: { path: string }) => ({
          ...asset,
          sha256: "falsified",
          bytes: 1
        }))
      })
    );
    execFileSync("git", ["add", "--", ".git-support/media.json"], {
      cwd: root
    });

    expect(() =>
      execFileSync(process.execPath, [mediaScript, "audit"], {
        cwd: root,
        stdio: "pipe"
      })
    ).toThrow();
    execFileSync(process.execPath, [mediaScript, "sync-staged", "--stage"], {
      cwd: root,
      stdio: "pipe"
    });
    const repaired = JSON.parse(
      execFileSync("git", ["show", ":.git-support/media.json"], {
        cwd: root,
        encoding: "utf8"
      })
    );
    expect(repaired.assets[0]).toMatchObject({
      sha256: createHash("sha256").update("selected").digest("hex"),
      bytes: 8
    });
  });

  it("runs scan, staged sync, and audit without selecting local-only media", async () => {
    const root = await fixture();
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    execFileSync("git", ["add", "--", "public/selected.png"], { cwd: root });

    expect(
      execFileSync(process.execPath, [mediaScript, "scan"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain("Cataloged 2 local public files");
    await writeFile(
      path.join(root, ".git-support", "media.json"),
      JSON.stringify({
        schemaVersion: 1,
        assets: [
          {
            id: "local-only",
            path: "public/nested/local.jpg",
            sha256: "dirty-working-catalog",
            bytes: 5,
            mimeType: "image/jpeg",
            gitTracked: false
          }
        ]
      })
    );
    expect(
      execFileSync(process.execPath, [mediaScript, "sync-staged", "--stage"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain("Synchronized 1 staged media change");
    expect(
      execFileSync(process.execPath, [mediaScript, "audit"], {
        cwd: root,
        encoding: "utf8"
      })
    ).toContain("Media audit passed");

    const staged = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "-z"],
      { cwd: root, encoding: "utf8" }
    )
      .split("\0")
      .filter(Boolean);
    expect(staged).toContain("public/selected.png");
    expect(staged).toContain(".git-support/media.json");
    expect(staged).not.toContain("public/nested/local.jpg");
    const stagedCatalog = JSON.parse(
      execFileSync("git", ["show", ":.git-support/media.json"], {
        cwd: root,
        encoding: "utf8"
      })
    );
    expect(
      stagedCatalog.assets.map((asset: { path: string }) => asset.path)
    ).toEqual(["public/selected.png"]);
  });
});
