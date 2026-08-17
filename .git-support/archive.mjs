#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  constants,
  copyFile,
  lstat,
  mkdir,
  readFile,
  realpath
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CATALOG = ".git-support/archive.json";
const DEFAULT_MOUNT = ".git-support/archive-worktree";

function safeRelative(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.posix.isAbsolute(value) ||
    value.replaceAll("\\", "/").split("/").includes("..") ||
    value.includes("\0")
  ) {
    throw new Error(`unsafe-archive-path:${value}`);
  }
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function safeArchiveRef(value) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) ||
    value.includes("..") ||
    value.includes("//") ||
    value.endsWith("/")
  ) {
    throw new Error("invalid-archive-ref");
  }
  return value;
}

export function validateArchiveCatalog(value) {
  if (
    !value ||
    value.schemaVersion !== 1 ||
    typeof value.archiveRef !== "string" ||
    !value.archiveRef.trim() ||
    !value.bundles ||
    typeof value.bundles !== "object"
  ) {
    throw new Error("invalid-archive-catalog");
  }
  const bundles = {};
  for (const [id, bundle] of Object.entries(value.bundles)) {
    if (!bundle || !Array.isArray(bundle.files)) {
      throw new Error(`invalid-archive-bundle:${id}`);
    }
    bundles[id] = Object.freeze({
      root: safeRelative(bundle.root),
      files: Object.freeze(bundle.files.map(safeRelative)),
      restoreTests: Object.freeze([...(bundle.restoreTests ?? [])])
    });
  }
  return Object.freeze({
    schemaVersion: 1,
    archiveRef: safeArchiveRef(value.archiveRef),
    bundles: Object.freeze(bundles)
  });
}

async function exists(value) {
  return lstat(value)
    .then(() => true)
    .catch((error) => {
      if (error?.code === "ENOENT") return false;
      throw error;
    });
}

async function assertInside(absolute, boundary, errorCode) {
  const resolvedBoundary = await realpath(boundary);
  const resolved = await realpath(absolute);
  if (
    resolved !== resolvedBoundary &&
    !resolved.startsWith(`${resolvedBoundary}${path.sep}`)
  ) {
    throw new Error(errorCode);
  }
}

async function assertDestinationPath(root, destination) {
  const resolvedRoot = await realpath(root);
  const lexicalRoot = path.resolve(root);
  const lexicalDestination = path.resolve(destination);
  if (!lexicalDestination.startsWith(`${lexicalRoot}${path.sep}`)) {
    throw new Error("unsafe-archive-destination");
  }

  let ancestor = path.dirname(lexicalDestination);
  while (!(await exists(ancestor))) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error("unsafe-archive-destination");
    ancestor = parent;
  }
  const resolvedAncestor = await realpath(ancestor);
  if (
    resolvedAncestor !== resolvedRoot &&
    !resolvedAncestor.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error("unsafe-archive-destination");
  }
}

export async function planArchiveRestore({ root, mountRoot, bundle }) {
  const destinationBoundary = path.resolve(root);
  const bundleRoot = path.resolve(mountRoot, safeRelative(bundle.root));
  await assertInside(bundleRoot, mountRoot, "unsafe-archive-source");
  const operations = [];
  for (const file of bundle.files.map(safeRelative)) {
    const source = path.resolve(bundleRoot, file);
    await assertInside(source, bundleRoot, "unsafe-archive-source");
    const destination = path.resolve(destinationBoundary, file);
    await assertDestinationPath(destinationBoundary, destination);
    operations.push(
      Object.freeze({
        path: file,
        source,
        sourceBoundary: bundleRoot,
        destination,
        destinationBoundary,
        collision: await exists(destination)
      })
    );
  }
  return Object.freeze(operations);
}

export async function applyArchiveRestore(plan) {
  if (plan.some((operation) => operation.collision)) {
    throw new Error("archive-restore-collision");
  }
  for (const operation of plan) {
    await assertInside(
      operation.source,
      operation.sourceBoundary,
      "unsafe-archive-source"
    );
    await assertDestinationPath(
      operation.destinationBoundary,
      operation.destination
    );
    await mkdir(path.dirname(operation.destination), { recursive: true });
    await assertInside(
      path.dirname(operation.destination),
      operation.destinationBoundary,
      "unsafe-archive-destination"
    );
    try {
      await copyFile(
        operation.source,
        operation.destination,
        constants.COPYFILE_EXCL
      );
    } catch (error) {
      if (error?.code === "EEXIST") {
        throw new Error("archive-restore-collision");
      }
      throw error;
    }
  }
}

/* v8 ignore start -- exercised through child-process CLI integration tests */
function runGit(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function registeredWorktrees(root) {
  const worktrees = [];
  let current;
  for (const line of runGit(root, ["worktree", "list", "--porcelain"]).split(
    "\n"
  )) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice("worktree ".length), head: "" };
      worktrees.push(current);
    } else if (current && line.startsWith("HEAD ")) {
      current.head = line.slice("HEAD ".length);
    }
  }
  return worktrees;
}

async function verifyArchiveMount(root, mountRoot, archiveRef) {
  const info = await lstat(mountRoot).catch(() => null);
  if (!info?.isDirectory() || info.isSymbolicLink()) {
    throw new Error("archive-mount-invalid");
  }
  const resolvedMount = await realpath(mountRoot);
  const registered = registeredWorktrees(root).find(
    (worktree) => path.resolve(worktree.path) === resolvedMount
  );
  const expectedHead = runGit(root, [
    "rev-parse",
    "--verify",
    `${archiveRef}^{commit}`
  ]).trim();
  if (!registered || registered.head !== expectedHead) {
    throw new Error("archive-mount-invalid");
  }
  const dirty = runGit(root, [
    "-C",
    mountRoot,
    "status",
    "--porcelain",
    "--untracked-files=all"
  ]).trim();
  if (dirty) throw new Error("archive-mount-dirty");
}

async function loadCatalog(root) {
  const value = JSON.parse(
    await readFile(path.resolve(root, DEFAULT_CATALOG), "utf8")
  );
  return validateArchiveCatalog(value);
}

async function cli() {
  const root = process.cwd();
  const [command = "list", bundleId, ...args] = process.argv.slice(2);
  const catalog = await loadCatalog(root);
  const mountRoot = path.resolve(root, DEFAULT_MOUNT);

  if (command === "list") {
    const ids = Object.keys(catalog.bundles).sort();
    console.log(
      ids.length ? ids.join("\n") : "No archive bundles are registered."
    );
    return;
  }

  if (command === "inspect") {
    const bundle = catalog.bundles[bundleId];
    if (!bundle) throw new Error(`unknown-archive-bundle:${bundleId}`);
    console.log(JSON.stringify({ id: bundleId, ...bundle }, null, 2));
    return;
  }

  if (command === "mount") {
    if (await exists(mountRoot)) {
      await verifyArchiveMount(root, mountRoot, catalog.archiveRef);
      console.log(`Archive is already mounted at ${DEFAULT_MOUNT}.`);
      return;
    }
    await mkdir(path.dirname(mountRoot), { recursive: true });
    runGit(root, [
      "worktree",
      "add",
      "--detach",
      DEFAULT_MOUNT,
      catalog.archiveRef
    ]);
    await verifyArchiveMount(root, mountRoot, catalog.archiveRef);
    console.log(`Mounted ${catalog.archiveRef} at ${DEFAULT_MOUNT}.`);
    return;
  }

  if (command === "restore") {
    const bundle = catalog.bundles[bundleId];
    if (!bundle) throw new Error(`unknown-archive-bundle:${bundleId}`);
    if (!(await exists(mountRoot))) throw new Error("archive-not-mounted");
    await verifyArchiveMount(root, mountRoot, catalog.archiveRef);
    const plan = await planArchiveRestore({ root, mountRoot, bundle });
    for (const operation of plan) {
      console.log(
        `${operation.collision ? "COLLISION" : "RESTORE"} ${operation.path}`
      );
    }
    if (!args.includes("--apply")) {
      console.log(
        "Dry run only. Pass --apply to restore collision-free files."
      );
      return;
    }
    await applyArchiveRestore(plan);
    console.log(`Restored ${plan.length} file(s) from ${bundleId}.`);
    return;
  }

  throw new Error(`unknown-archive-command:${command}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await cli();
}
/* v8 ignore stop */
