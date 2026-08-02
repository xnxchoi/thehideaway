import { readFileSync } from "node:fs";
import { twoFactor } from "better-auth/plugins/two-factor";
import { describe, expect, it } from "vitest";

import { getDefaultBetterAuthSchema } from "./payload-auth/better-auth/plugin/helpers/get-better-auth-schema";
import { buildTwoFactorsCollection } from "./payload-auth/better-auth/plugin/lib/build-collections/two-factors";
import type { PayloadAuthOptions } from "./payload-auth/better-auth/plugin/types";

const packageJSON = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8")
) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

const authClientSource = readFileSync(new URL("./client.ts", import.meta.url), {
  encoding: "utf8"
});
const payloadTypesSource = readFileSync(
  new URL("../../payload-types.ts", import.meta.url),
  { encoding: "utf8" }
);
const userInterfaceStart = payloadTypesSource.indexOf(
  "export interface User {"
);
const userInterfaceEnd = payloadTypesSource.indexOf(
  "\nexport interface Profile",
  userInterfaceStart
);
const payloadUserTypeSource = payloadTypesSource.slice(
  userInterfaceStart,
  userInterfaceEnd
);

const BETTER_AUTH_VERSION = "1.6.25";
const BETTER_AUTH_RUNTIME_PACKAGES = [
  "better-auth",
  "@better-auth/core",
  "@better-auth/passkey"
] as const;
const BETTER_AUTH_TOOLING_PACKAGES = [
  "@better-auth/api-key",
  "@better-auth/sso",
  "@better-auth/stripe"
] as const;

const CUSTOM_USER_FIELDS = [
  "role",
  "username",
  "slug",
  "location",
  "bio",
  "portrait",
  "onboarded",
  "twoFactorEnabled",
  "emailVerified",
  "firstName",
  "lastName",
  "name",
  "displayUsername"
] as const;

describe("Better Auth security upgrade contract", () => {
  it("pins every first-party Better Auth runtime package to one supported release", () => {
    for (const packageName of BETTER_AUTH_RUNTIME_PACKAGES) {
      expect(packageJSON.dependencies[packageName], packageName).toBe(
        BETTER_AUTH_VERSION
      );
    }

    for (const packageName of BETTER_AUTH_TOOLING_PACKAGES) {
      expect(
        packageJSON.dependencies[packageName],
        packageName
      ).toBeUndefined();
      expect(packageJSON.devDependencies[packageName], packageName).toBe(
        BETTER_AUTH_VERSION
      );
    }
    expect(packageJSON.devDependencies["@better-auth/scim"]).toBeUndefined();
  });

  it("aligns Better Auth support packages with the 1.6.25 peer contract", () => {
    expect(packageJSON.dependencies["@better-auth/utils"]).toBe("0.4.2");
    expect(packageJSON.dependencies["@better-fetch/fetch"]).toBe("1.3.1");
    expect(packageJSON.dependencies["better-call"]).toBe("1.3.7");
  });

  it("infers customized client fields from the server options and keeps them in Payload types", () => {
    expect(authClientSource).toContain(
      "inferAdditionalFields<BetterAuthOptions>()"
    );

    for (const fieldName of CUSTOM_USER_FIELDS) {
      expect(payloadUserTypeSource, `Payload User field: ${fieldName}`).toMatch(
        new RegExp(`\\b${fieldName}[?:]`)
      );
    }
  });

  it("projects Better Auth two-factor lockout fields through the Payload bridge", () => {
    const resolvedSchemas = getDefaultBetterAuthSchema({
      users: { defaultRole: "user" },
      betterAuthOptions: {
        plugins: [twoFactor()]
      }
    } as PayloadAuthOptions);

    expect(resolvedSchemas.twoFactor.fields).toHaveProperty(
      "failedVerificationCount"
    );
    expect(resolvedSchemas.twoFactor.fields).toHaveProperty("lockedUntil");
  });

  it("preserves Better Auth two-factor defaults in the Payload schema", () => {
    const pluginOptions = {
      users: { defaultRole: "user" },
      betterAuthOptions: { plugins: [twoFactor()] }
    } as PayloadAuthOptions;
    const resolvedSchemas = getDefaultBetterAuthSchema(pluginOptions);
    const collection = buildTwoFactorsCollection({
      incomingCollections: [],
      pluginOptions,
      resolvedSchemas
    });
    const field = (name: string) =>
      collection.fields.find(
        (candidate) => "name" in candidate && candidate.name === name
      );

    expect(field("verified")).toMatchObject({
      defaultValue: true,
      admin: { readOnly: true }
    });
    expect(field("failedVerificationCount")).toMatchObject({
      defaultValue: 0,
      admin: { readOnly: true }
    });
    expect(field("lockedUntil")).toMatchObject({
      admin: { readOnly: true }
    });
  });
});
