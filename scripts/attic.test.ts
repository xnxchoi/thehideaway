import { chmod, lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyKey,
  filesUnder,
  initialize,
  parseSnapArgs,
  readTree,
  resolveSnapshotFiles,
  selectionMark,
  toggleSelection,
  visibleRows,
  writeSnapshot
} from "./attic-lib.mjs";

async function tempAttic() {
  const root = join(
    tmpdir(),
    `attic-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  await mkdir(root, { recursive: true });
  return root;
}

describe("attic init", () => {
  it("creates a missing attic", async () => {
    const root = join(await tempAttic(), "missing");
    const created = await initialize(root);
    expect(created.created).toBe(true);
    expect(created.already).toBe(false);
    const again = await initialize(root);
    expect(again.already).toBe(true);
    expect(again.lockedFiles).toBe(0);
  });

  it("locks existing files and leaves directories writable", async () => {
    const root = await tempAttic();
    await mkdir(join(root, "notes"));
    await writeFile(join(root, "notes", "a.txt"), "keep");
    const first = await initialize(root);
    expect(first.already).toBe(false);
    expect(first.lockedFiles).toBe(1);
    const file = await lstat(join(root, "notes", "a.txt"));
    const dir = await lstat(join(root, "notes"));
    expect(file.mode & 0o222).toBe(0);
    expect(dir.mode & 0o200).not.toBe(0);
    expect((await initialize(root)).already).toBe(true);
  });

  it("locks a file that was made writable after init", async () => {
    const root = await tempAttic();
    await writeFile(join(root, "a.txt"), "keep");
    await initialize(root);
    await chmod(join(root, "a.txt"), 0o644);
    const again = await initialize(root);
    expect(again.already).toBe(false);
    expect(again.lockedFiles).toBe(1);
    expect((await initialize(root)).already).toBe(true);
  });
});

describe("attic snapshot", () => {
  it("toggles a file with space or enter, and a folder selects its files", () => {
    const tree = [
      {
        rel: "notes",
        name: "notes",
        dir: true,
        children: [{ rel: "notes/a.txt", name: "a.txt", dir: false, children: [] }]
      },
      { rel: "package.json", name: "package.json", dir: false, children: [] }
    ];
    const rows = visibleRows(tree, new Set(["notes"]));
    let state = {
      rows,
      cursor: 1,
      expanded: new Set(["notes"]),
      selected: new Set<string>(),
      note: ""
    };
    state = applyKey(state, "space");
    expect([...state.selected]).toEqual(["notes/a.txt"]);
    state = { ...state, cursor: 2 };
    state = applyKey(state, "return");
    expect(state.selected.has("package.json")).toBe(true);
    expect(selectionMark(tree[0], state.selected)).toBe("x");
    state = { ...state, cursor: 0 };
    state = applyKey(state, "space");
    expect(state.selected.has("notes/a.txt")).toBe(false);
    expect(filesUnder(tree[0])).toEqual(["notes/a.txt"]);
    expect(
      toggleSelection(new Set(), tree[1]).has("package.json")
    ).toBe(true);
  });

  it("copies the chosen files read-only under .attic/snapshots", async () => {
    const root = await tempAttic();
    await mkdir(join(root, "notes"));
    await writeFile(join(root, "notes", "a.txt"), "keep");
    await writeFile(join(root, "skip.txt"), "no");
    const snapshot = await writeSnapshot(root, ["notes/a.txt"], {
      name: "before edit",
      now: new Date("2026-09-21T15:04:05.000Z")
    });
    expect(snapshot?.id).toMatch(/before-edit$/);
    const copy = await readFile(join(snapshot!.dest, "notes", "a.txt"), "utf8");
    expect(copy).toBe("keep");
    expect((await lstat(join(snapshot!.dest, "notes", "a.txt"))).mode & 0o222).toBe(0);
    expect((await lstat(join(snapshot!.dest, "manifest.json"))).mode & 0o222).toBe(0);
    await expect(lstat(join(snapshot!.dest, "skip.txt"))).rejects.toThrow();
  });

  it("accepts --all and refuses paths outside the attic", async () => {
    const root = await tempAttic();
    await writeFile(join(root, "a.txt"), "keep");
    expect(parseSnapArgs(["--all", "--name", "now"]).all).toBe(true);
    expect(await resolveSnapshotFiles(root, { all: true, paths: [] })).toEqual(["a.txt"]);
    await expect(
      resolveSnapshotFiles(root, { all: false, paths: ["../package.json"] })
    ).rejects.toThrow(/outside/);
  });
});
