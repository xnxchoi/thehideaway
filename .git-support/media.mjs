#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG_VERSION = 1;
const DEFAULT_CATALOG_PATH = ".git-support/media.json";
const DEFAULT_LOCAL_CATALOG_PATH = ".git-support/media.local.json";
const MAX_MEDIA_BYTES = 128 * 1024 * 1024;
const DENIED_PUBLISH_PREFIXES = Object.freeze(["public/users/"]);

/**
 * @typedef {object} MediaAsset
 * @property {string} id
 * @property {string} path
 * @property {string} sha256
 * @property {number} bytes
 * @property {string} mimeType
 * @property {boolean} gitTracked
 */

/**
 * @typedef {object} MediaCatalog
 * @property {number} schemaVersion
 * @property {readonly MediaAsset[]} assets
 */

/**
 * @typedef {object} ScanMediaOptions
 * @property {string} root
 * @property {MediaCatalog} catalog
 * @property {Set<string>} trackedPaths
 * @property {Map<string, Buffer | Uint8Array>} [trackedFiles]
 * @property {(mediaPath: string) => Promise<Buffer | Uint8Array | undefined>} [readTrackedFile]
 */

const MIME_TYPES = Object.freeze({
  ".avif": "image/avif",
  ".css": "text/css",
  ".gif": "image/gif",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".m4a": "audio/mp4",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".wav": "audio/wav",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
});

function normalizeMediaPath(value) {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    !normalized.startsWith("public/") ||
    path.posix.isAbsolute(normalized) ||
    normalized.split("/").includes("..") ||
    normalized.includes("\0")
  ) {
    throw new Error(`unsafe-media-path:${value}`);
  }
  return normalized;
}

function assertPublishableMediaPath(value) {
  const normalized = normalizeMediaPath(value);
  if (DENIED_PUBLISH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error(`private-media-path:${normalized}`);
  }
  return normalized;
}

function stableIdForPath(mediaPath) {
  return `asset_${createHash("sha256").update(mediaPath).digest("hex").slice(0, 20)}`;
}

function statusKind(status) {
  const code = status[0];
  if (code === "A" || code === "C") return "add";
  if (code === "M" || code === "T") return "modify";
  if (code === "D") return "delete";
  if (code === "R") return "rename";
  throw new Error(`unsupported-media-status:${status}`);
}

export function parseStagedMediaChanges(output) {
  const tokens = String(output).split("\0");
  const changes = [];
  let index = 0;
  while (index < tokens.length) {
    const status = tokens[index++];
    if (!status) continue;
    const kind = statusKind(status);
    const firstPath = tokens[index++];
    if (!firstPath) throw new Error(`invalid-staged-media-output:${status}`);
    if (kind === "rename") {
      const nextPath = tokens[index++];
      if (!nextPath) throw new Error(`invalid-staged-media-output:${status}`);
      changes.push(
        Object.freeze({
          kind,
          previousPath: normalizeMediaPath(firstPath),
          path: normalizeMediaPath(nextPath)
        })
      );
    } else {
      changes.push(
        Object.freeze({ kind, path: normalizeMediaPath(firstPath) })
      );
    }
  }
  return Object.freeze(changes);
}

async function mediaRecord({ root, mediaPath, id, gitTracked, content }) {
  const normalized = normalizeMediaPath(mediaPath);
  const absolute = path.resolve(root, normalized);
  const publicRoot = path.resolve(root, "public");
  if (!absolute.startsWith(`${publicRoot}${path.sep}`)) {
    throw new Error(`unsafe-media-path:${mediaPath}`);
  }
  const bytes = content ?? (await readFile(absolute));
  if (content === undefined) {
    const info = await stat(absolute);
    if (!info.isFile()) throw new Error(`media-not-file:${mediaPath}`);
  }
  const extension = path.extname(normalized).toLowerCase();
  return Object.freeze({
    id: id ?? stableIdForPath(normalized),
    path: normalized,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength,
    mimeType: MIME_TYPES[extension] ?? "application/octet-stream",
    gitTracked: Boolean(gitTracked)
  });
}

function normalizedCatalog(catalog) {
  if (!catalog || catalog.schemaVersion !== CATALOG_VERSION) {
    throw new Error("unsupported-media-catalog");
  }
  const assets = [...(catalog.assets ?? [])]
    .map((asset) =>
      Object.freeze({ ...asset, path: normalizeMediaPath(asset.path) })
    )
    .sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze({
    schemaVersion: CATALOG_VERSION,
    assets: Object.freeze(assets)
  });
}

export async function syncStagedMediaCatalog({
  root,
  catalog,
  changes,
  trackedPaths,
  stagedFiles = new Map()
}) {
  const current = normalizedCatalog(catalog);
  const tracked = new Set([...trackedPaths].map(normalizeMediaPath));
  for (const asset of current.assets) {
    assertPublishableMediaPath(asset.path);
  }
  const previousByPath = new Map(
    current.assets.map((asset) => [asset.path, asset])
  );
  const byPath = new Map(
    current.assets
      .filter((asset) => tracked.has(asset.path))
      .map((asset) => [asset.path, asset])
  );

  for (const change of changes) {
    const mediaPath = normalizeMediaPath(change.path);
    const previous =
      change.kind === "rename"
        ? previousByPath.get(normalizeMediaPath(change.previousPath))
        : previousByPath.get(mediaPath);
    if (change.kind === "rename") {
      byPath.delete(normalizeMediaPath(change.previousPath));
    }
    if (change.kind === "delete") {
      byPath.delete(mediaPath);
      continue;
    }
    byPath.set(
      mediaPath,
      await mediaRecord({
        root,
        mediaPath,
        id: previous?.id,
        gitTracked: tracked.has(mediaPath),
        content: stagedFiles.get(mediaPath)
      })
    );
  }

  return normalizedCatalog({
    schemaVersion: CATALOG_VERSION,
    assets: [...byPath.values()]
  });
}

async function walkFiles(root, directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await walkFiles(root, absolute)));
    else if (entry.isFile()) {
      paths.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }
  return paths;
}

/** @param {ScanMediaOptions} options */
export async function scanMediaDirectory({
  root,
  catalog,
  trackedPaths,
  trackedFiles = new Map(),
  readTrackedFile = undefined
}) {
  const current = normalizedCatalog(catalog);
  const existing = new Map(current.assets.map((asset) => [asset.path, asset]));
  const tracked = new Set([...trackedPaths].map(normalizeMediaPath));
  const publicRoot = path.resolve(root, "public");
  const localPaths = await walkFiles(root, publicRoot);
  const paths = [...new Set([...localPaths, ...tracked])].sort((left, right) =>
    left.localeCompare(right)
  );
  const assets = [];
  for (const mediaPath of paths) {
    const content = tracked.has(mediaPath)
      ? (trackedFiles.get(mediaPath) ?? (await readTrackedFile?.(mediaPath)))
      : undefined;
    assets.push(
      await mediaRecord({
        root,
        mediaPath,
        id: existing.get(mediaPath)?.id,
        gitTracked: tracked.has(mediaPath),
        content
      })
    );
  }
  return normalizedCatalog({ schemaVersion: CATALOG_VERSION, assets });
}

function runGit(root, args, encoding = "utf8") {
  return execFileSync("git", args, {
    cwd: root,
    encoding,
    maxBuffer: MAX_MEDIA_BYTES + 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

/* v8 ignore start -- exercised through child-process CLI integration tests */
function trackedPublicPaths(root) {
  const output = runGit(root, ["ls-files", "-z", "--", "public"]);
  return new Set(output.split("\0").filter(Boolean).map(normalizeMediaPath));
}
/* v8 ignore stop */

function stagedIndexEntries(root) {
  const output = runGit(root, ["ls-files", "--stage", "-z", "--", "public"]);
  const entries = new Map();
  for (const token of output.split("\0").filter(Boolean)) {
    const separator = token.indexOf("\t");
    if (separator < 0) throw new Error("invalid-git-index-output");
    const [mode, oid, stage] = token.slice(0, separator).split(" ");
    const mediaPath = assertPublishableMediaPath(token.slice(separator + 1));
    if (stage !== "0") throw new Error(`unmerged-media-path:${mediaPath}`);
    if (mode !== "100644" && mode !== "100755") {
      throw new Error(`unsupported-media-mode:${mode}:${mediaPath}`);
    }
    const bytes = Number(runGit(root, ["cat-file", "-s", oid]).trim());
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > MAX_MEDIA_BYTES) {
      throw new Error(`unsupported-media-size:${mediaPath}:${bytes}`);
    }
    entries.set(mediaPath, Object.freeze({ oid, mode, bytes }));
  }
  return entries;
}

export function readStagedPublicState(root) {
  const output = runGit(root, [
    "diff",
    "--cached",
    "--name-status",
    "-z",
    "--find-renames",
    "--",
    "public"
  ]);
  const changes = parseStagedMediaChanges(output);
  const entries = stagedIndexEntries(root);
  const stagedFiles = new Map();
  for (const change of changes) {
    if (change.kind === "delete") continue;
    const entry = entries.get(change.path);
    if (!entry) throw new Error(`staged-media-blob-missing:${change.path}`);
    stagedFiles.set(
      change.path,
      runGit(root, ["cat-file", "blob", entry.oid], null)
    );
  }
  return Object.freeze({
    changes,
    trackedPaths: new Set(entries.keys()),
    stagedFiles
  });
}

/* v8 ignore start -- exercised through child-process CLI integration tests */
async function loadCatalog(root, catalogPath = DEFAULT_CATALOG_PATH) {
  const absolute = path.resolve(root, catalogPath);
  return readFile(absolute, "utf8")
    .then((value) => normalizedCatalog(JSON.parse(value)))
    .catch((error) => {
      if (error?.code === "ENOENT") {
        return normalizedCatalog({
          schemaVersion: CATALOG_VERSION,
          assets: []
        });
      }
      throw error;
    });
}

function parseCatalogText(value) {
  return normalizedCatalog(JSON.parse(value));
}

function loadCatalogFromIndex(root, catalogPath = DEFAULT_CATALOG_PATH) {
  try {
    return parseCatalogText(runGit(root, ["show", `:${catalogPath}`]));
  } catch {
    return null;
  }
}

function loadCatalogFromHead(root, catalogPath = DEFAULT_CATALOG_PATH) {
  try {
    return parseCatalogText(runGit(root, ["show", `HEAD:${catalogPath}`]));
  } catch {
    return null;
  }
}

async function catalogFromIndexEntries(root, entries, identityCatalog) {
  const identities = new Map(
    (identityCatalog?.assets ?? []).map((asset) => [asset.path, asset.id])
  );
  const assets = [];
  for (const [mediaPath, entry] of entries) {
    assets.push(
      await mediaRecord({
        root,
        mediaPath,
        id: identities.get(mediaPath),
        gitTracked: true,
        content: runGit(root, ["cat-file", "blob", entry.oid], null)
      })
    );
  }
  return normalizedCatalog({ schemaVersion: CATALOG_VERSION, assets });
}

async function writeCatalog(root, catalog, catalogPath = DEFAULT_CATALOG_PATH) {
  const absolute = path.resolve(root, catalogPath);
  const directory = path.dirname(absolute);
  await mkdir(directory, { recursive: true });
  const resolvedRoot = await realpath(root);
  const resolvedDirectory = await realpath(directory);
  if (
    resolvedDirectory !== resolvedRoot &&
    !resolvedDirectory.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error("unsafe-media-catalog-path");
  }
  const temporaryDirectory = await mkdtemp(path.join(directory, ".catalog-"));
  const temporary = path.join(temporaryDirectory, "catalog.json");
  try {
    await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, {
      flag: "wx",
      mode: 0o600
    });
    await rename(temporary, absolute);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function cli() {
  const root = process.cwd();
  const [command = "help", ...args] = process.argv.slice(2);
  const trackedPaths = trackedPublicPaths(root);

  if (command === "scan") {
    const catalog = await loadCatalog(root, DEFAULT_LOCAL_CATALOG_PATH).catch(
      () => loadCatalog(root)
    );
    const entries = stagedIndexEntries(root);
    const next = await scanMediaDirectory({
      root,
      catalog,
      trackedPaths,
      readTrackedFile: async (mediaPath) => {
        const entry = entries.get(mediaPath);
        if (!entry) throw new Error(`tracked-media-blob-missing:${mediaPath}`);
        return runGit(root, ["cat-file", "blob", entry.oid], null);
      }
    });
    await writeCatalog(root, next, DEFAULT_LOCAL_CATALOG_PATH);
    console.log(`Cataloged ${next.assets.length} local public files.`);
    return;
  }

  if (command === "sync-staged") {
    const state = readStagedPublicState(root);
    const { changes } = state;
    const stagedCatalog = loadCatalogFromIndex(root);
    for (const asset of stagedCatalog?.assets ?? []) {
      assertPublishableMediaPath(asset.path);
    }
    const headCatalog = loadCatalogFromHead(root);
    const catalog =
      headCatalog ??
      normalizedCatalog({ schemaVersion: CATALOG_VERSION, assets: [] });
    const reconciled = await syncStagedMediaCatalog({
      root,
      catalog,
      changes,
      trackedPaths: state.trackedPaths,
      stagedFiles: state.stagedFiles
    });
    const next = headCatalog
      ? reconciled
      : await catalogFromIndexEntries(
          root,
          stagedIndexEntries(root),
          reconciled
        );
    await writeCatalog(root, next);
    if (args.includes("--stage")) {
      runGit(root, ["add", "--", DEFAULT_CATALOG_PATH]);
    }
    console.log(
      changes.length === 0
        ? "Validated the publishable media catalog against the Git index."
        : `Synchronized ${changes.length} staged media change(s).`
    );
    return;
  }

  if (command === "audit") {
    const catalog = await loadCatalog(root);
    const expected = await catalogFromIndexEntries(
      root,
      stagedIndexEntries(root),
      catalog
    );
    const expectedByPath = new Map(
      expected.assets.map((asset) => [asset.path, asset])
    );
    const byPath = new Map(catalog.assets.map((asset) => [asset.path, asset]));
    const missing = [...trackedPaths].filter(
      (mediaPath) => !byPath.has(mediaPath)
    );
    for (const asset of catalog.assets) {
      assertPublishableMediaPath(asset.path);
    }
    const extra = catalog.assets.filter(
      (asset) => !trackedPaths.has(asset.path)
    );
    const mismatched = catalog.assets.filter(
      (asset) =>
        asset.gitTracked !== true ||
        asset.sha256 !== expectedByPath.get(asset.path)?.sha256 ||
        asset.bytes !== expectedByPath.get(asset.path)?.bytes ||
        asset.mimeType !== expectedByPath.get(asset.path)?.mimeType
    );
    if (missing.length || extra.length || mismatched.length) {
      console.error(
        `Media audit failed: ${missing.length} tracked file(s) missing; ${extra.length} untracked catalog record(s); ${mismatched.length} non-publishable tracking flag(s).`
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `Media audit passed for ${catalog.assets.length} cataloged file(s), including ${trackedPaths.size} Git-tracked file(s).`
    );
    return;
  }

  console.log("Usage: media-workflow.mjs <scan|sync-staged|audit> [--stage]");
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await cli();
}
/* v8 ignore stop */
