import { describe, expect, it } from "vitest";

import {
  formatPackageJsonWithVersion,
  parseReleaseVersion,
  resolveReleasePlan,
} from "../../scripts/release-version";

describe("release version planning", () => {
  it("defaults to the next patch after the highest stable semver tag", () => {
    const plan = resolveReleasePlan({
      bump: "patch",
      packageVersion: "33.0.0",
      tags: ["v0.15.26", "v33.0.11", "refs/tags/v33.0.13^{}", "v33.0.12"],
    });

    expect(plan.latestTag).toBe("v33.0.13");
    expect(plan.tag).toBe("v33.0.14");
    expect(plan.packageVersion).toBe("33.0.14");
    expect(plan.packageDriftFromLatest).toBe(true);
    expect(plan.source).toBe("auto-patch");
  });

  it("supports explicit prerelease versions without auto-incrementing", () => {
    const plan = resolveReleasePlan({
      packageVersion: "33.0.13",
      requestedVersion: "34.0.0-rc.1",
      tags: ["v33.0.13"],
    });

    expect(plan.tag).toBe("v34.0.0-rc.1");
    expect(plan.packageVersion).toBe("34.0.0-rc.1");
    expect(plan.source).toBe("explicit");
  });

  it("supports explicit stable versions without auto-incrementing", () => {
    const plan = resolveReleasePlan({
      packageVersion: "33.0.13",
      requestedVersion: "34.0.0",
      tags: ["v33.0.13"],
    });

    expect(plan.tag).toBe("v34.0.0");
    expect(plan.packageVersion).toBe("34.0.0");
    expect(plan.source).toBe("explicit");
  });

  it("supports major and minor auto-bumps", () => {
    expect(
      resolveReleasePlan({
        bump: "minor",
        packageVersion: "33.0.13",
        tags: ["v33.0.13"],
      }).tag,
    ).toBe("v33.1.0");

    expect(
      resolveReleasePlan({
        bump: "major",
        packageVersion: "33.0.13",
        tags: ["v33.0.13"],
      }).tag,
    ).toBe("v34.0.0");
  });

  it("ignores prerelease tags as the default base when stable tags exist", () => {
    const plan = resolveReleasePlan({
      bump: "patch",
      packageVersion: "33.0.13",
      tags: ["v33.0.13", "v34.0.0-rc.1"],
    });

    expect(plan.latestTag).toBe("v33.0.13");
    expect(plan.tag).toBe("v33.0.14");
  });

  it("requires an explicit version when no stable release tag exists", () => {
    expect(() =>
      resolveReleasePlan({
        bump: "patch",
        packageVersion: "33.0.0",
        tags: ["v34.0.0-rc.1"],
      }),
    ).toThrow("no stable semver release tags found");
  });

  it("rejects malformed semver inputs instead of normalizing them", () => {
    expect(parseReleaseVersion("01.2.3")).toBeNull();
    expect(parseReleaseVersion("1.2.3-alpha..1")).toBeNull();
    expect(parseReleaseVersion("1.2.3-alpha.01")).toBeNull();
    expect(parseReleaseVersion("1.2.3+build.1")).toBeNull();
  });

  it("updates only the package version field in formatted package JSON", () => {
    const formatted = formatPackageJsonWithVersion(
      {
        name: "hideawayseoul",
        version: "33.0.0",
        scripts: { test: "vitest run" },
      },
      "33.0.14",
    );

    expect(JSON.parse(formatted)).toEqual({
      name: "hideawayseoul",
      version: "33.0.14",
      scripts: { test: "vitest run" },
    });
    expect(formatted.endsWith("\n")).toBe(true);
  });
});
