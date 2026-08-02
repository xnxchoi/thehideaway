import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  commitTransaction,
  initTransaction,
  killTransaction
} from "payload";
import { getBeforeDeleteHook } from "./before-delete";

vi.mock("payload", () => ({
  commitTransaction: vi.fn(async () => undefined),
  flattenAllFields: vi.fn(({ fields }) => fields),
  initTransaction: vi.fn(async () => true),
  killTransaction: vi.fn(async () => undefined)
}));

type Dependency = {
  modelKey: string;
  slug: string;
  fieldKey: string;
  fieldName: string;
  operator?: "equals" | "like";
};

const dependencies: Dependency[] = [
  {
    modelKey: "account",
    slug: "custom-accounts",
    fieldKey: "userId",
    fieldName: "accountOwner"
  },
  {
    modelKey: "session",
    slug: "custom-sessions",
    fieldKey: "userId",
    fieldName: "sessionOwner"
  },
  {
    modelKey: "verification",
    slug: "custom-verifications",
    fieldKey: "value",
    fieldName: "verificationValue",
    operator: "like"
  },
  {
    modelKey: "passkey",
    slug: "custom-passkeys",
    fieldKey: "userId",
    fieldName: "passkeyOwner"
  },
  {
    modelKey: "twoFactor",
    slug: "custom-two-factors",
    fieldKey: "userId",
    fieldName: "twoFactorOwner"
  },
  {
    modelKey: "member",
    slug: "custom-members",
    fieldKey: "userId",
    fieldName: "memberUser"
  },
  {
    modelKey: "teamMember",
    slug: "custom-team-members",
    fieldKey: "userId",
    fieldName: "teamMemberUser"
  },
  {
    modelKey: "invitation",
    slug: "custom-invitations",
    fieldKey: "inviterId",
    fieldName: "invitedBy"
  },
  {
    modelKey: "subscription",
    slug: "custom-subscriptions",
    fieldKey: "referenceId",
    fieldName: "subscriberReference"
  },
  {
    modelKey: "apikey",
    slug: "custom-api-keys",
    fieldKey: "referenceId",
    fieldName: "apiKeyOwner"
  },
  {
    modelKey: "oauthApplication",
    slug: "custom-oauth-applications",
    fieldKey: "userId",
    fieldName: "applicationOwner"
  },
  {
    modelKey: "oauthAccessToken",
    slug: "custom-oauth-access-tokens",
    fieldKey: "userId",
    fieldName: "tokenOwner"
  },
  {
    modelKey: "oauthConsent",
    slug: "custom-oauth-consents",
    fieldKey: "userId",
    fieldName: "consentingUser"
  },
  {
    modelKey: "deviceCode",
    slug: "custom-device-codes",
    fieldKey: "userId",
    fieldName: "deviceUser"
  }
];

const makeCollection = ({
  modelKey,
  slug,
  fieldKey,
  fieldName
}: Dependency) => ({
  config: {
    slug,
    custom: { betterAuthModelKey: modelKey },
    fields: [
      {
        name: fieldName,
        type: "text",
        custom: { betterAuthFieldKey: fieldKey }
      }
    ]
  }
});

const makeRequest = ({
  includedDependencies = dependencies,
  deleteImplementation
}: {
  includedDependencies?: Dependency[];
  deleteImplementation?: (...args: unknown[]) => Promise<unknown>;
} = {}) => {
  const deleteDocuments = vi.fn(
    deleteImplementation ?? (async () => ({ docs: [] }))
  );
  const collections = Object.fromEntries(
    includedDependencies.map((dependency) => [
      dependency.slug,
      makeCollection(dependency)
    ])
  );

  collections.organizations = {
    config: {
      slug: "organizations",
      custom: { betterAuthModelKey: "organization" },
      fields: []
    }
  };
  collections.teams = {
    config: {
      slug: "teams",
      custom: { betterAuthModelKey: "team" },
      fields: []
    }
  };

  return {
    deleteDocuments,
    request: {
      payload: {
        collections,
        delete: deleteDocuments
      }
    }
  };
};

describe("Better Auth user dependency cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(initTransaction).mockResolvedValue(true);
  });

  it("deletes every present user-dependent collection using resolved slugs and field names", async () => {
    const { request, deleteDocuments } = makeRequest();
    const hook = getBeforeDeleteHook();

    await hook({ req: request, id: "user-id" } as never);

    expect(deleteDocuments).toHaveBeenCalledTimes(dependencies.length);

    for (const dependency of dependencies) {
      const operator = dependency.operator ?? "equals";
      const value =
        dependency.modelKey === "verification" ? '"user-id"' : "user-id";

      expect(deleteDocuments).toHaveBeenCalledWith({
        collection: dependency.slug,
        overrideAccess: true,
        where: {
          [dependency.fieldName]: {
            [operator]: value
          }
        },
        req: request
      });
    }

    expect(deleteDocuments).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "organizations" })
    );
    expect(deleteDocuments).not.toHaveBeenCalledWith(
      expect.objectContaining({ collection: "teams" })
    );
    expect(initTransaction).toHaveBeenCalledTimes(1);
    expect(commitTransaction).toHaveBeenCalledTimes(1);
    expect(killTransaction).not.toHaveBeenCalled();
  });

  it("skips optional Better Auth collections that are not present", async () => {
    const includedDependencies = dependencies.filter(({ modelKey }) =>
      ["account", "session", "verification"].includes(modelKey)
    );
    const { request, deleteDocuments } = makeRequest({ includedDependencies });

    await getBeforeDeleteHook()({ req: request, id: "user-id" } as never);

    expect(deleteDocuments).toHaveBeenCalledTimes(3);
    expect(commitTransaction).toHaveBeenCalledTimes(1);
  });

  it("propagates cleanup failures after aborting the transaction", async () => {
    const cleanupFailure = new Error("passkey-cleanup-failed");
    const includedDependencies = dependencies.filter(({ modelKey }) =>
      ["account", "passkey", "twoFactor"].includes(modelKey)
    );
    let callCount = 0;
    const { request } = makeRequest({
      includedDependencies,
      deleteImplementation: async () => {
        callCount += 1;
        if (callCount === 2) throw cleanupFailure;
        return { docs: [] };
      }
    });

    await expect(
      getBeforeDeleteHook()({ req: request, id: "user-id" } as never)
    ).rejects.toBe(cleanupFailure);

    expect(killTransaction).toHaveBeenCalledTimes(1);
    expect(commitTransaction).not.toHaveBeenCalled();
  });

  it("does not commit a transaction owned by the parent delete operation", async () => {
    vi.mocked(initTransaction).mockResolvedValue(false);
    const { request } = makeRequest({
      includedDependencies: dependencies.slice(0, 1)
    });

    await getBeforeDeleteHook()({ req: request, id: "user-id" } as never);

    expect(commitTransaction).not.toHaveBeenCalled();
    expect(killTransaction).not.toHaveBeenCalled();
  });
});
