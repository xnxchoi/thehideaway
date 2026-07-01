import { readFileSync, writeFileSync } from "node:fs";

export type ReleaseBump = "major" | "minor" | "patch";

type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
  tag: string;
  packageVersion: string;
};

export type ReleasePlan = {
  tag: string;
  packageVersion: string;
  latestTag: string;
  latestPackageVersion: string;
  packageCurrent: string;
  packageDriftFromLatest: boolean;
  packageNeedsSync: boolean;
  source: "explicit" | `auto-${ReleaseBump}`;
};

const NUMERIC_IDENTIFIER = "0|[1-9]\\d*";
const PRERELEASE_IDENTIFIER = `(?:${NUMERIC_IDENTIFIER}|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)`;
const VERSION_PATTERN = new RegExp(
  `^v?(${NUMERIC_IDENTIFIER})\\.(${NUMERIC_IDENTIFIER})\\.(${NUMERIC_IDENTIFIER})(?:-(${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*))?$`,
);

function cleanTag(input: string): string {
  return input.trim().replace(/\^\{\}$/, "").replace(/^refs\/tags\//, "");
}

export function parseReleaseVersion(input: string): ParsedVersion | null {
  const cleaned = cleanTag(input);
  const match = VERSION_PATTERN.exec(cleaned);

  if (!match) {
    return null;
  }

  const [, major, minor, patch, prerelease = ""] = match;
  const packageVersion = `${Number(major)}.${Number(minor)}.${Number(patch)}${prerelease ? `-${prerelease}` : ""}`;

  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease,
    tag: `v${packageVersion}`,
    packageVersion,
  };
}

function compareVersions(left: ParsedVersion, right: ParsedVersion): number {
  const numeric = left.major - right.major || left.minor - right.minor || left.patch - right.patch;
  if (numeric !== 0) {
    return numeric;
  }

  if (left.prerelease === right.prerelease) {
    return 0;
  }

  if (!left.prerelease) {
    return 1;
  }

  if (!right.prerelease) {
    return -1;
  }

  return left.prerelease.localeCompare(right.prerelease);
}

export function findLatestReleaseVersion(tags: string[]): ParsedVersion | null {
  const stable = tags
    .map(parseReleaseVersion)
    .filter((version): version is ParsedVersion => version !== null && !version.prerelease);

  return stable.sort(compareVersions).at(-1) ?? null;
}

function incrementVersion(version: ParsedVersion, bump: ReleaseBump): ParsedVersion {
  const next = {
    major: version.major,
    minor: version.minor,
    patch: version.patch,
    prerelease: "",
  };

  if (bump === "major") {
    next.major += 1;
    next.minor = 0;
    next.patch = 0;
  } else if (bump === "minor") {
    next.minor += 1;
    next.patch = 0;
  } else {
    next.patch += 1;
  }

  const packageVersion = `${next.major}.${next.minor}.${next.patch}`;

  return {
    ...next,
    tag: `v${packageVersion}`,
    packageVersion,
  };
}

function readPackageVersion(packagePath: string): string {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: unknown };

  if (typeof packageJson.version !== "string") {
    throw new Error(`${packagePath} must contain a string "version" field`);
  }

  return packageJson.version;
}

function readTagsFromStdin(): string[] {
  return readFileSync(0, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function resolveReleasePlan(options: {
  bump?: ReleaseBump;
  packageVersion: string;
  requestedVersion?: string;
  tags: string[];
}): ReleasePlan {
  const packageCurrent = options.packageVersion;
  const latest = findLatestReleaseVersion(options.tags);
  const requested = options.requestedVersion?.trim();

  let target: ParsedVersion | null = null;
  let source: ReleasePlan["source"] = `auto-${options.bump ?? "patch"}`;

  if (requested) {
    target = parseReleaseVersion(requested);
    source = "explicit";
    if (!target) {
      throw new Error(`version is not semver: ${requested} (expected MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-PRE)`);
    }
  } else {
    if (!latest) {
      throw new Error("no stable semver release tags found; pass an explicit version for the first release");
    }

    target = incrementVersion(latest, options.bump ?? "patch");
  }

  const latestPackageVersion = latest?.packageVersion ?? "";

  return {
    tag: target.tag,
    packageVersion: target.packageVersion,
    latestTag: latest?.tag ?? "",
    latestPackageVersion,
    packageCurrent,
    packageDriftFromLatest: Boolean(latestPackageVersion && packageCurrent !== latestPackageVersion),
    packageNeedsSync: packageCurrent !== target.packageVersion,
    source,
  };
}

export function formatPackageJsonWithVersion(packageJson: Record<string, unknown>, version: string): string {
  return `${JSON.stringify({ ...packageJson, version }, null, 2)}\n`;
}

function syncPackageVersion(packagePath: string, version: string): void {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as Record<string, unknown>;
  writeFileSync(packagePath, formatPackageJsonWithVersion(packageJson, version));
}

function shellQuote(value: string | boolean): string {
  const stringValue = String(value);
  return `'${stringValue.replace(/'/g, "'\\''")}'`;
}

function printShellPlan(plan: ReleasePlan): void {
  const entries = {
    RELEASE_VERSION: plan.tag,
    RELEASE_PACKAGE_VERSION: plan.packageVersion,
    RELEASE_LATEST_TAG: plan.latestTag,
    RELEASE_LATEST_PACKAGE_VERSION: plan.latestPackageVersion,
    RELEASE_PACKAGE_CURRENT: plan.packageCurrent,
    RELEASE_PACKAGE_DRIFT_FROM_LATEST: plan.packageDriftFromLatest,
    RELEASE_PACKAGE_NEEDS_SYNC: plan.packageNeedsSync,
    RELEASE_VERSION_SOURCE: plan.source,
  };

  for (const [key, value] of Object.entries(entries)) {
    console.log(`${key}=${shellQuote(value)}`);
  }
}

function parseBump(value: string): ReleaseBump {
  if (value === "major" || value === "minor" || value === "patch") {
    return value;
  }

  throw new Error(`invalid bump: ${value} (expected major, minor, or patch)`);
}

function readOption(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`missing value for ${name}`);
  }

  return value;
}

function main(argv: string[]): void {
  const [command, ...args] = argv;

  if (command !== "plan" && command !== "sync") {
    throw new Error("usage: release-version.ts <plan|sync> [options]");
  }

  let packagePath = "package.json";
  let version = "";
  let bump: ReleaseBump = "patch";
  let format: "json" | "shell" = "shell";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case "--package":
        packagePath = readOption(args, index, arg);
        index += 1;
        break;
      case "--version":
        version = readOption(args, index, arg);
        index += 1;
        break;
      case "--bump":
        bump = parseBump(readOption(args, index, arg));
        index += 1;
        break;
      case "--format":
        format = readOption(args, index, arg) === "json" ? "json" : "shell";
        index += 1;
        break;
      default:
        throw new Error(`unknown option: ${arg}`);
    }
  }

  if (command === "sync") {
    if (!version) {
      throw new Error("sync requires --version");
    }

    const parsed = parseReleaseVersion(version);
    if (!parsed) {
      throw new Error(`version is not semver: ${version}`);
    }

    syncPackageVersion(packagePath, parsed.packageVersion);
    return;
  }

  const plan = resolveReleasePlan({
    bump,
    packageVersion: readPackageVersion(packagePath),
    requestedVersion: version || undefined,
    tags: readTagsFromStdin(),
  });

  if (format === "json") {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  printShellPlan(plan);
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
