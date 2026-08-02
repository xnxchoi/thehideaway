import { describe, expect, it, vi } from "vitest";

import { getUserDetails } from "./getUserDetails";

const targetUser = {
  id: "0198a111-1111-7111-8111-111111111111",
  firstName: "Target",
  lastName: "User",
  displayUsername: null,
  portrait: null,
  slug: "target-user",
  username: "target-user",
  name: "Target User",
  onboarded: true,
  role: "author",
  bio: "Bio",
  following: {
    totalDocs: 1,
    docs: [{ target: "0198a222-2222-7222-8222-222222222222" }]
  },
  followers: {
    totalDocs: 1,
    docs: [{ user: "0198a333-3333-7333-8333-333333333333" }]
  },
  notifications: {
    docs: []
  }
};

function createRequest({
  actor,
  id = targetUser.id,
  result = targetUser,
  error
}: {
  actor: null | { id: string; role: string };
  id?: string;
  result?: unknown;
  error?: Error;
}) {
  const findByID = error
    ? vi.fn().mockRejectedValue(error)
    : vi.fn().mockResolvedValue(result);
  const logger = { error: vi.fn() };
  const req = {
    payload: { findByID, logger },
    routeParams: { id },
    user: actor
  };

  return { findByID, logger, req };
}

describe("getUserDetails", () => {
  it("denies unauthenticated requests without querying users", async () => {
    const { findByID, req } = createRequest({ actor: null });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(findByID).not.toHaveBeenCalled();
  });

  it("denies a non-admin reading another user", async () => {
    const { findByID, req } = createRequest({
      actor: {
        id: "0198a444-4444-7444-8444-444444444444",
        role: "editor"
      }
    });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(findByID).not.toHaveBeenCalled();
  });

  it("denies a banned admin without querying users", async () => {
    const { findByID, req } = createRequest({
      actor: {
        id: "0198a555-5555-7555-8555-555555555555",
        role: "admin",
        banned: true
      } as never
    });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(403);
    expect(findByID).not.toHaveBeenCalled();
  });

  it("rejects an invalid user id without querying users", async () => {
    const { findByID, req } = createRequest({
      actor: { id: targetUser.id, role: "author" },
      id: ""
    });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid param provided"
    });
    expect(findByID).not.toHaveBeenCalled();
  });

  it("allows a user to read their own details through Payload access", async () => {
    const { findByID, req } = createRequest({
      actor: { id: targetUser.id, role: "author" }
    });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        id: targetUser.id,
        following: {
          count: 1,
          docs: ["0198a222-2222-7222-8222-222222222222"]
        },
        followers: {
          count: 1,
          docs: ["0198a333-3333-7333-8333-333333333333"]
        }
      }
    });
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: targetUser.id,
        overrideAccess: false,
        req
      })
    );
  });

  it("allows an admin without bypassing Payload access", async () => {
    const { findByID, req } = createRequest({
      actor: {
        id: "0198a555-5555-7555-8555-555555555555",
        role: "admin"
      },
      result: {
        ...targetUser,
        portrait: "portrait-id",
        displayUsername: "Target",
        onboarded: null,
        bio: null,
        following: {
          totalDocs: 3,
          docs: [
            "following-raw",
            { target: "following-related" },
            { target: { id: "following-populated" } }
          ]
        },
        followers: {
          totalDocs: 3,
          docs: [
            "follower-raw",
            { user: "follower-related" },
            { user: { id: "follower-populated" } }
          ]
        },
        notifications: undefined
      }
    });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(200);
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "users",
        id: targetUser.id,
        overrideAccess: false,
        req
      })
    );
    expect(findByID).not.toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: true })
    );
  });

  it("returns not found without exposing lookup failures", async () => {
    const lookupError = new Error("database details");
    const { logger, req } = createRequest({
      actor: { id: targetUser.id, role: "author" },
      error: lookupError
    });

    const response = await getUserDetails(req as never);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: `User ${targetUser.id} not found`
    });
    expect(logger.error).toHaveBeenCalledWith(
      { err: lookupError, userId: targetUser.id },
      "getUserDetails failed"
    );
  });
});
