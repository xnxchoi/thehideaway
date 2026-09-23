import { cp, lstat, mkdir, readdir, writeFile, chmod } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

export const MARKER = ".initialized";
export const SNAPSHOTS = "snapshots";

export function isFileReadonly(mode) {
  return (mode & 0o222) === 0;
}

export function isDirectoryWritable(mode) {
  return (mode & 0o200) !== 0;
}

function skipRoot(name) {
  return name === MARKER || name === SNAPSHOTS;
}

async function lockFile(path) {
  const info = await lstat(path);
  if (!info.isFile() || isFileReadonly(info.mode)) return false;
  await chmod(path, info.mode & ~0o222);
  return true;
}

async function ensureDirectoryWritable(path) {
  const info = await lstat(path);
  if (!info.isDirectory() || isDirectoryWritable(info.mode)) return false;
  await chmod(path, info.mode | 0o200);
  return true;
}

async function walk(root, visitor, rel = "", skipReserved = false) {
  const entries = await readdir(join(root, rel), { withFileTypes: true });
  for (const entry of entries) {
    if (skipReserved && !rel && skipRoot(entry.name)) continue;
    if (entry.isSymbolicLink()) continue;
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    const path = join(root, child);
    if (entry.isDirectory()) {
      await visitor({ path, rel: child, directory: true });
      await walk(root, visitor, child, skipReserved);
    } else if (entry.isFile()) {
      await visitor({ path, rel: child, directory: false });
    }
  }
}

export async function initialize(root) {
  let created = false;
  try {
    const info = await lstat(root);
    if (!info.isDirectory()) {
      throw new Error("attic: path exists and is not a directory");
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await mkdir(root, { recursive: true });
    created = true;
  }

  let lockedFiles = 0;
  let fixedDirectories = 0;
  await walk(root, async (entry) => {
    if (entry.directory) {
      if (await ensureDirectoryWritable(entry.path)) fixedDirectories += 1;
    } else if (await lockFile(entry.path)) lockedFiles += 1;
  });

  const marker = join(root, MARKER);
  let markerExisted = true;
  try {
    await lstat(marker);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    markerExisted = false;
    await writeFile(
      marker,
      `initialized ${new Date().toISOString()}\nfiles=readonly\n`
    );
    await lockFile(marker);
  }

  return {
    created,
    lockedFiles,
    fixedDirectories,
    already: !created && markerExisted && lockedFiles === 0 && fixedDirectories === 0
  };
}

export async function readTree(root) {
  async function readDir(rel) {
    const entries = await readdir(join(root, rel), { withFileTypes: true });
    const nodes = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      if (!rel && skipRoot(entry.name)) continue;
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        nodes.push({
          rel: child,
          name: entry.name,
          dir: true,
          children: await readDir(child)
        });
      } else if (entry.isFile()) {
        nodes.push({ rel: child, name: entry.name, dir: false, children: [] });
      }
    }
    return nodes;
  }
  try {
    return await readDir("");
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export function filesUnder(node) {
  if (!node.dir) return [node.rel];
  return node.children.flatMap(filesUnder);
}

export function visibleRows(nodes, expanded, depth = 0) {
  const rows = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.dir && expanded.has(node.rel)) {
      rows.push(...visibleRows(node.children, expanded, depth + 1));
    }
  }
  return rows;
}

export function selectionMark(node, selected) {
  const files = filesUnder(node);
  if (files.length === 0) return " ";
  const count = files.filter((file) => selected.has(file)).length;
  if (count === 0) return " ";
  if (count === files.length) return "x";
  return "-";
}

export function toggleSelection(selected, node) {
  const next = new Set(selected);
  const files = filesUnder(node);
  const allOn = files.length > 0 && files.every((file) => next.has(file));
  for (const file of files) {
    if (allOn) next.delete(file);
    else next.add(file);
  }
  return next;
}

function moveCursor(state, delta) {
  if (state.rows.length === 0) return state;
  const cursor = (state.cursor + delta + state.rows.length) % state.rows.length;
  return { ...state, cursor, note: "" };
}

export function applyKey(state, key) {
  const name = typeof key === "string" ? key : key.name;
  const ctrl = typeof key === "object" && key.ctrl;
  if (name === "q" || (ctrl && name === "c")) return { ...state, action: "quit" };
  if (name === "s") return { ...state, action: "save" };
  if (name === "up" || name === "k") return moveCursor(state, -1);
  if (name === "down" || name === "j") return moveCursor(state, 1);
  if (name === "right" || name === "l") {
    const row = state.rows[state.cursor];
    if (!row?.node.dir) return state;
    const expanded = new Set(state.expanded);
    expanded.add(row.node.rel);
    return { ...state, expanded, note: "" };
  }
  if (name === "left" || name === "h") {
    const row = state.rows[state.cursor];
    if (!row?.node.dir) return state;
    const expanded = new Set(state.expanded);
    expanded.delete(row.node.rel);
    return { ...state, expanded, note: "" };
  }
  if (name === "space" || name === "return") {
    const row = state.rows[state.cursor];
    if (!row) return state;
    return {
      ...state,
      selected: toggleSelection(state.selected, row.node),
      note: ""
    };
  }
  if (name === "a") {
    const files = state.rows.flatMap((row) =>
      row.depth === 0 ? filesUnder(row.node) : []
    );
    const allOn = files.length > 0 && files.every((file) => state.selected.has(file));
    const selected = new Set(state.selected);
    for (const file of files) {
      if (allOn) selected.delete(file);
      else selected.add(file);
    }
    return { ...state, selected, note: "" };
  }
  return state;
}

export function snapshotId(date, name) {
  const pad = (value) => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const clean = (name ?? "")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return clean ? `${stamp}-${clean}` : stamp;
}

export function parseSnapArgs(argv) {
  const result = { all: false, name: null, paths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (arg === "--all") result.all = true;
    else if (arg === "--name") result.name = argv[++index] ?? "";
    else if (arg.startsWith("--name=")) result.name = arg.slice("--name=".length);
    else if (arg.startsWith("-")) throw new Error(`attic: unknown option ${arg}`);
    else result.paths.push(arg.replace(/^\.attic\//, "").replace(/^\.\//, ""));
  }
  return result;
}

async function filesIn(root, rel = "") {
  const found = [];
  await walk(
    root,
    (entry) => {
      if (!entry.directory) found.push(entry.rel);
    },
    rel,
    rel === ""
  );
  return found;
}

function atticRelative(root, requested) {
  const rel = requested.replace(/\\/g, "/").replace(/^\.attic\//, "").replace(/^\.\//, "").replace(/\/$/, "");
  if (!rel || rel.split("/").includes("..")) {
    throw new Error(`attic: path is outside the attic: ${requested}`);
  }
  const path = resolve(root, rel);
  const fromRoot = relative(resolve(root), path);
  if (fromRoot.startsWith("..") || fromRoot === "") {
    throw new Error(`attic: path is outside the attic: ${requested}`);
  }
  return { rel, path };
}

export async function resolveSnapshotFiles(root, { all, paths }) {
  if (all) return filesIn(root);
  const found = [];
  for (const requested of paths) {
    const { rel, path } = atticRelative(root, requested);
    if (rel === MARKER || rel === SNAPSHOTS || rel.startsWith(`${SNAPSHOTS}/`)) continue;
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error(`attic: refusing symlink: ${requested}`);
    if (info.isDirectory()) found.push(...(await filesIn(root, rel)));
    else if (info.isFile()) found.push(rel);
    else throw new Error(`attic: not a file: ${requested}`);
  }
  return [...new Set(found)];
}

export async function writeSnapshot(root, relativeFiles, options = {}) {
  const files = [...new Set(relativeFiles)].sort();
  if (files.length === 0) return null;
  const date = options.now ?? new Date();
  let id = snapshotId(date, options.name);
  let dest = join(root, SNAPSHOTS, id);
  for (let suffix = 2; ; suffix += 1) {
    try {
      await lstat(dest);
      id = `${snapshotId(date, options.name)}-${suffix}`;
      dest = join(root, SNAPSHOTS, id);
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
  await mkdir(dest, { recursive: true });
  for (const rel of files) {
    const from = join(root, rel);
    const info = await lstat(from);
    if (!info.isFile()) throw new Error(`attic: not a file: ${rel}`);
    const to = join(dest, rel);
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to);
    await lockFile(to);
  }
  const manifest = {
    id,
    created: date.toISOString(),
    name: options.name ?? null,
    files
  };
  const manifestPath = join(dest, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await lockFile(manifestPath);
  return { id, dest, files };
}


