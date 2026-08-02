import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PayloadAuthOptions } from "../../../../types";
import { getGenerateInviteUrlEndpoint } from "./generate-invite-url";
import { getSendInviteUrlEndpoint } from "./send-invite-url";
import { hashAdminInviteToken } from "../../../admin-invite-security";

vi.mock("payload", () => ({
  addDataAndFileToRequest: vi.fn(async () => undefined),
  headersWithCors: vi.fn(({ headers }: { headers: Headers }) => headers),
  killTransaction: vi.fn(async () => undefined)
}));

const roles = [
  { label: "Admin", value: "admin" },
  { label: "User", value: "user" }
];

const makePluginOptions = (sendInviteEmail = vi.fn()) =>
  ({
    users: { adminRoles: ["admin"] },
    adminInvitations: {
      generateInviteUrl: ({ token }: { token: string }) =>
        `https://example.com/invite?token=${token}`,
      sendInviteEmail
    }
  }) as unknown as PayloadAuthOptions;

const makeRequest = ({ role, data }: { role?: string; data: unknown }) => {
  const create = vi.fn(async () => ({ id: "invite-id" }));
  const count = vi.fn(async () => ({ totalDocs: 1 }));

  return {
    request: {
      data,
      headers: new Headers(),
      payload: {
        create,
        count,
        config: { serverURL: "https://example.com" },
        logger: { error: vi.fn() }
      },
      t: vi.fn(() => "Success"),
      user: role ? { id: "user-id", collection: "users", role } : null
    },
    create,
    count
  };
};

describe("admin invitation endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated invite-link generation before creating a token", async () => {
    const { request, create } = makeRequest({
      data: { role: { label: "Admin", value: "admin" } }
    });
    const endpoint = getGenerateInviteUrlEndpoint({
      roles,
      pluginOptions: makePluginOptions()
    });

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects non-admin invite-link generation", async () => {
    const { request, create } = makeRequest({
      role: "user",
      data: { role: { label: "Admin", value: "admin" } }
    });
    const endpoint = getGenerateInviteUrlEndpoint({
      roles,
      pluginOptions: makePluginOptions()
    });

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  it("lets a configured admin create an invitation with access checks enabled", async () => {
    const { request, create } = makeRequest({
      role: "admin",
      data: {
        email: "Invitee@Example.com",
        role: { label: "User", value: "user" }
      }
    });
    const endpoint = getGenerateInviteUrlEndpoint({
      roles,
      pluginOptions: makePluginOptions()
    });

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: false,
        user: request.user
      })
    );
    const responseBody = await response.json();
    const rawToken = new URL(responseBody.inviteLink).searchParams.get("token");
    expect(rawToken).toBeTruthy();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "invitee@example.com",
          expiresAt: expect.any(String),
          token: hashAdminInviteToken(rawToken!)
        })
      })
    );
  });

  it("creates invitations in the configured collection slug", async () => {
    const { request, create } = makeRequest({
      role: "admin",
      data: {
        email: "invitee@example.com",
        role: { label: "User", value: "user" }
      }
    });
    const pluginOptions = makePluginOptions() as PayloadAuthOptions & {
      adminInvitations: { slug: string };
    };
    pluginOptions.adminInvitations.slug = "staff-invitations";
    const endpoint = getGenerateInviteUrlEndpoint({ roles, pluginOptions });

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(200);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "staff-invitations" })
    );
  });

  it("rejects unauthenticated invite email dispatch", async () => {
    const sendInviteEmail = vi.fn(async () => ({ success: true }));
    const { request } = makeRequest({
      data: { email: "invitee@example.com", link: "https://example.com/invite" }
    });
    const endpoint = getSendInviteUrlEndpoint(
      makePluginOptions(sendInviteEmail)
    );

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(401);
    expect(sendInviteEmail).not.toHaveBeenCalled();
  });

  it("rejects non-admin invite email dispatch", async () => {
    const sendInviteEmail = vi.fn(async () => ({ success: true }));
    const { request } = makeRequest({
      role: "user",
      data: { email: "invitee@example.com", link: "https://example.com/invite" }
    });
    const endpoint = getSendInviteUrlEndpoint(
      makePluginOptions(sendInviteEmail)
    );

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(403);
    expect(sendInviteEmail).not.toHaveBeenCalled();
  });

  it("only sends a same-origin, unexpired invitation bound to the recipient", async () => {
    const sendInviteEmail = vi.fn(async () => ({ success: true as const }));
    const { request, count } = makeRequest({
      role: "admin",
      data: {
        email: "Invitee@Example.com",
        link: "https://example.com/invite?token=raw-token"
      }
    });
    const endpoint = getSendInviteUrlEndpoint(
      makePluginOptions(sendInviteEmail)
    );

    const response = await endpoint.handler(request as never);

    expect(response.status).toBe(200);
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [
            { token: { equals: hashAdminInviteToken("raw-token") } },
            { email: { equals: "invitee@example.com" } },
            { expiresAt: { greater_than: expect.any(String) } }
          ]
        }
      })
    );
    expect(sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "Invitee@Example.com" })
    );
  });
});
