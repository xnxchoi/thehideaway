import { beforeEach, describe, expect, it, vi } from "vitest";

const buildPayload = () => ({
  config: {
    custom: {
      hasBetterAuthPlugin: true
    }
  },
  collections: {
    users: {
      config: {
        slug: "users",
        fields: [],
        flattenedFields: []
      }
    }
  }
});

const buildTransform = (singleIdQuery: (() => string | null) | undefined) => ({
  transformInput: ({ data }: { data: Record<string, unknown> }) => data,
  transformOutput: ({ doc }: { doc: unknown }) => doc,
  convertWhereClause: () => ({ id: { equals: "user-1" } }),
  convertSelect: () => undefined,
  convertSort: () => undefined,
  getCollectionSlug: () => "users",
  singleIdQuery: singleIdQuery ?? (() => "user-1")
});

describe("payloadAdapter error propagation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("@payloadcms/drizzle");
    vi.doUnmock("@payloadcms/db-postgres/drizzle");
  });

  it("rethrows create failures instead of returning null", async () => {
    const error = new Error("create failed");
    const payload = {
      ...buildPayload(),
      create: vi.fn(async () => {
        throw error;
      })
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => "user-1")
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(
      adapter.create({
        model: "user",
        data: { email: "author@hideaway.test" }
      })
    ).rejects.toBe(error);
  });

  it("rethrows update failures instead of returning null", async () => {
    const error = new Error("update failed");
    const payload = {
      ...buildPayload(),
      update: vi.fn(async () => {
        throw error;
      })
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => "user-1")
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(
      adapter.update({
        model: "user",
        where: [],
        update: { name: null }
      })
    ).rejects.toBe(error);
  });

  it.each([
    ["findOne", "find"],
    ["findMany", "find"],
    ["count", "count"]
  ] as const)(
    "rethrows %s database failures",
    async (method, payloadMethod) => {
      const error = new Error(`${method} failed`);
      const payload = {
        ...buildPayload(),
        [payloadMethod]: vi.fn(async () => {
          throw error;
        })
      };

      vi.doMock("./transform", () => ({
        createTransform: () => buildTransform(() => null)
      }));

      const { payloadAdapter } = await import("./index");
      const adapter = payloadAdapter({
        payloadClient: payload as never,
        adapterConfig: { idType: "text" }
      })({} as never);

      await expect(
        method === "count"
          ? adapter.count({ model: "user", where: [] })
          : adapter[method]({ model: "user", where: [] } as never)
      ).rejects.toBe(error);
    }
  );

  it("rethrows updateMany failures instead of returning zero", async () => {
    const error = new Error("updateMany failed");
    const payload = {
      ...buildPayload(),
      update: vi.fn(async () => {
        throw error;
      })
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(
      adapter.updateMany({
        model: "user",
        where: [],
        update: { name: null }
      })
    ).rejects.toBe(error);
  });

  it("rethrows deleteMany failures instead of returning zero", async () => {
    const error = new Error("deleteMany failed");
    const payload = {
      ...buildPayload(),
      delete: vi.fn(async () => {
        throw error;
      })
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(
      adapter.deleteMany({
        model: "user",
        where: []
      })
    ).rejects.toBe(error);
  });

  it("rethrows delete failures instead of pretending the row was deleted", async () => {
    const error = new Error("delete failed");
    const payload = {
      ...buildPayload(),
      delete: vi.fn(async () => {
        throw error;
      })
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => "user-1")
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(adapter.delete({ model: "user", where: [] })).rejects.toBe(
      error
    );
  });

  it("provides native atomic counter and one-time-consumption primitives", async () => {
    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: buildPayload() as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    expect(adapter.incrementOne).toBeTypeOf("function");
    expect(adapter.consumeOne).toBeTypeOf("function");
  });

  it("increments a guarded counter in one database update", async () => {
    const queryWhere = { sql: "guard" };
    const returning = vi.fn(async () => [
      { id: "user-1", failedVerificationCount: 2, lockedUntil: null }
    ]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const table = {
      id: { name: "id" },
      failedVerificationCount: { name: "failed_verification_count" },
      lockedUntil: { name: "locked_until" }
    };
    const payload = {
      ...buildPayload(),
      db: {
        drizzle: { update },
        tableNameMap: new Map([["users", "users"]]),
        tables: { users: table }
      }
    };

    vi.doMock("@payloadcms/drizzle", () => ({
      buildQuery: () => ({ joins: [], where: queryWhere })
    }));
    vi.doMock("@payloadcms/db-postgres/drizzle", () => ({
      eq: vi.fn(),
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
        strings: [...strings],
        values
      })
    }));
    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);
    const lockedUntil = new Date("2026-08-02T12:00:00.000Z");

    await expect(
      adapter.incrementOne!({
        model: "user",
        where: [{ field: "id", value: "user-1" }],
        increment: { failedVerificationCount: 1 },
        set: { lockedUntil }
      })
    ).resolves.toMatchObject({
      id: "user-1",
      failedVerificationCount: 2
    });

    expect(update).toHaveBeenCalledOnce();
    expect(set).toHaveBeenCalledWith({
      failedVerificationCount: expect.objectContaining({
        strings: ["COALESCE(", ", 0) + ", ""],
        values: [table.failedVerificationCount, 1]
      }),
      lockedUntil
    });
    expect(where).toHaveBeenCalledWith(queryWhere);
  });

  it("consumes exactly one matching row inside a locking transaction", async () => {
    const queryWhere = { sql: "single-use-guard" };
    const table = { id: { name: "id" } };
    const forUpdate = vi.fn(async () => [{ id: "token-1" }]);
    const selectLimit = vi.fn(() => ({ for: forUpdate }));
    const selectWhere = vi.fn(() => ({ limit: selectLimit }));
    const from = vi.fn(() => ({ where: selectWhere }));
    const select = vi.fn(() => ({ from }));
    const returning = vi.fn(async () => [
      { id: "token-1", value: "secret-token" }
    ]);
    const deleteWhere = vi.fn(() => ({ returning }));
    const deleteRow = vi.fn(() => ({ where: deleteWhere }));
    const transaction = vi.fn(async (callback) =>
      callback({ select, delete: deleteRow })
    );
    const payload = {
      ...buildPayload(),
      db: {
        drizzle: { transaction },
        tableNameMap: new Map([["users", "users"]]),
        tables: { users: table }
      }
    };

    vi.doMock("@payloadcms/drizzle", () => ({
      buildQuery: () => ({ joins: [], where: queryWhere })
    }));
    vi.doMock("@payloadcms/db-postgres/drizzle", () => ({
      eq: (column: unknown, value: unknown) => ({ column, value }),
      sql: vi.fn()
    }));
    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(
      adapter.consumeOne!({
        model: "user",
        where: [{ field: "id", value: "token-1" }]
      })
    ).resolves.toMatchObject({ id: "token-1" });

    expect(transaction).toHaveBeenCalledOnce();
    expect(forUpdate).toHaveBeenCalledWith("update", { skipLocked: true });
    expect(deleteRow).toHaveBeenCalledOnce();
    expect(returning).toHaveBeenCalledOnce();
  });

  it("threads one Payload transaction through all callback operations", async () => {
    const beginTransaction = vi.fn(async () => "tx-1");
    const commitTransaction = vi.fn(async () => undefined);
    const rollbackTransaction = vi.fn(async () => undefined);
    const create = vi.fn(async (options) => ({
      id: "user-1",
      ...options.data
    }));
    const payload = {
      ...buildPayload(),
      create,
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
        sessions: { "tx-1": { db: {} } }
      }
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await adapter.transaction(async (transaction) => {
      await transaction.create({
        model: "user",
        data: { name: "Transactional" }
      });
    });

    expect(beginTransaction).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        req: expect.objectContaining({
          payload,
          transactionID: "tx-1"
        })
      })
    );
    expect(commitTransaction).toHaveBeenCalledWith("tx-1");
    expect(rollbackTransaction).not.toHaveBeenCalled();
  });

  it("rolls back the shared Payload transaction when a callback operation fails", async () => {
    const failure = new Error("transaction operation failed");
    const beginTransaction = vi.fn(async () => "tx-1");
    const commitTransaction = vi.fn(async () => undefined);
    const rollbackTransaction = vi.fn(async () => undefined);
    const payload = {
      ...buildPayload(),
      create: vi.fn(async () => {
        throw failure;
      }),
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
        sessions: { "tx-1": { db: {} } }
      }
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => null)
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await expect(
      adapter.transaction((transaction) =>
        transaction.create({ model: "user", data: { name: "Failure" } })
      )
    ).rejects.toBe(failure);
    expect(commitTransaction).not.toHaveBeenCalled();
    expect(rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("bypasses collection access when deleting OAuth state inside a transaction", async () => {
    const beginTransaction = vi.fn(async () => "tx-1");
    const commitTransaction = vi.fn(async () => undefined);
    const rollbackTransaction = vi.fn(async () => undefined);
    const remove = vi.fn(async () => ({
      docs: [{ id: "state-1" }],
      errors: []
    }));
    const payload = {
      ...buildPayload(),
      delete: remove,
      db: {
        beginTransaction,
        commitTransaction,
        rollbackTransaction,
        sessions: { "tx-1": { db: {} } }
      }
    };

    vi.doMock("./transform", () => ({
      createTransform: () => buildTransform(() => "state-1")
    }));

    const { payloadAdapter } = await import("./index");
    const adapter = payloadAdapter({
      payloadClient: payload as never,
      adapterConfig: { idType: "text" }
    })({} as never);

    await adapter.transaction(async (transaction) => {
      await transaction.delete({
        model: "user",
        where: [{ field: "id", value: "state-1" }]
      });
    });

    expect(remove).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: true,
        req: expect.objectContaining({
          payload,
          transactionID: "tx-1",
          context: expect.objectContaining({
            "payload-db-adapter": expect.objectContaining({
              operation: "deleteByID"
            })
          })
        })
      })
    );
  });
});
