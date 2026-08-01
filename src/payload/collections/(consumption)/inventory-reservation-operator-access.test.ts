import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  authorizeInventoryReservationOperatorEventRequest,
  isInventoryReservationOperatorEventRequestAuthorized
} from "./InventoryReservationOperatorEvents/authorizeInventoryReservationOperatorEvent";
import { InventoryReservationOperatorEvents } from "./InventoryReservationOperatorEvents";
import { authorizeInventoryReservationRequest } from "./InventoryReservations/authorizeInventoryReservation";

type AccessArgs = {
  req: {
    user?: {
      id: string;
      role: string;
    } | null;
  };
};

function accessArgs(role: string | null): AccessArgs {
  return {
    req: {
      user: role ? { id: "user-id", role } : null
    }
  };
}

function namedField(name: string): Record<string, unknown> {
  const field = InventoryReservationOperatorEvents.fields.find((candidate) => {
    return (
      typeof candidate === "object" &&
      candidate !== null &&
      "name" in candidate &&
      candidate.name === name
    );
  });
  if (!field) throw new Error(`Missing field ${name}`);
  return field as Record<string, unknown>;
}

function selectOptions(field: Record<string, unknown>): string[] {
  const options = field.options;
  if (!Array.isArray(options)) throw new Error("Expected select options");
  return options.map((option) => {
    if (typeof option === "string") return option;
    if (option && typeof option === "object" && "value" in option) {
      return String(option.value);
    }
    throw new Error("Invalid select option");
  });
}

describe("inventory reservation operator audit collection", () => {
  it("is admin-readable and rejects direct writes", async () => {
    expect(InventoryReservationOperatorEvents.slug).toBe(
      "inventory-reservation-operator-events"
    );
    expect(InventoryReservationOperatorEvents.lockDocuments).toBe(false);
    expect(InventoryReservationOperatorEvents.admin?.useAsTitle).toBe(
      "event_key"
    );
    expect(
      await InventoryReservationOperatorEvents.access?.read?.(
        accessArgs("admin") as never
      )
    ).toBe(true);
    expect(
      await InventoryReservationOperatorEvents.access?.read?.(
        accessArgs("editor") as never
      )
    ).toBe(false);

    for (const operation of ["create", "update", "delete"] as const) {
      expect(
        await InventoryReservationOperatorEvents.access?.[operation]?.(
          accessArgs("admin") as never
        )
      ).toBe(false);
    }
  });

  it("defines immutable operator evidence fields", () => {
    expect(
      InventoryReservationOperatorEvents.fields.flatMap((field) =>
        "name" in field ? [field.name] : []
      )
    ).toEqual([
      "event_key",
      "command_key",
      "source",
      "correlation_key",
      "causation_key",
      "action",
      "outcome_code",
      "actor",
      "order",
      "payment",
      "reservation",
      "reason_code",
      "evidence_reference",
      "expected_state_hash",
      "observed_state_hash",
      "affected_count",
      "effective_at"
    ]);

    expect(namedField("event_key")).toMatchObject({
      type: "text",
      required: true,
      unique: true,
      index: true
    });
    expect(namedField("command_key")).toMatchObject({
      type: "text",
      required: true,
      index: true
    });
    expect(namedField("command_key")).not.toHaveProperty("unique", true);
    expect(namedField("source")).toMatchObject({
      type: "select",
      required: true
    });
    expect(selectOptions(namedField("source"))).toEqual(["manual_operator"]);
    for (const name of ["correlation_key", "causation_key"] as const) {
      expect(namedField(name)).toMatchObject({
        type: "text",
        required: true,
        index: true
      });
    }

    expect(namedField("action")).toMatchObject({
      type: "select",
      required: true
    });
    expect(selectOptions(namedField("action"))).toEqual([
      "release",
      "expire",
      "reconcile",
      "run_expiry"
    ]);
    expect(namedField("outcome_code")).toMatchObject({
      type: "text",
      required: true,
      index: true
    });

    expect(namedField("actor")).toMatchObject({
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true
    });
    for (const [name, relationTo] of [
      ["order", "product-orders"],
      ["payment", "product-payments"],
      ["reservation", "inventory-reservations"]
    ] as const) {
      expect(namedField(name)).toMatchObject({
        type: "relationship",
        relationTo,
        index: true
      });
      expect(namedField(name)).not.toHaveProperty("required", true);
    }

    expect(namedField("reason_code")).toMatchObject({
      type: "text",
      required: true,
      index: true,
      maxLength: 100
    });
    expect(namedField("evidence_reference")).toMatchObject({
      type: "text",
      required: true,
      maxLength: 200
    });
    for (const name of ["expected_state_hash", "observed_state_hash"]) {
      expect(namedField(name)).toMatchObject({
        type: "text",
        required: true
      });
    }
    expect(namedField("affected_count")).toMatchObject({
      type: "number",
      required: true,
      min: 0
    });
    expect(namedField("effective_at")).toMatchObject({
      type: "date",
      required: true,
      index: true
    });

    for (const field of InventoryReservationOperatorEvents.fields) {
      expect(field.admin).toMatchObject({ readOnly: true });
    }
  });

  it("allows creates only for the collection-scoped guarded service", async () => {
    const request = {};
    const otherRequest = {};
    const reservationServiceRequest = {};

    expect(isInventoryReservationOperatorEventRequestAuthorized(request)).toBe(
      false
    );
    expect(() =>
      authorizeInventoryReservationOperatorEventRequest(null as never)
    ).toThrow("inventory-reservation-operator-event-request-required");

    authorizeInventoryReservationOperatorEventRequest(request);
    expect(isInventoryReservationOperatorEventRequestAuthorized(request)).toBe(
      true
    );
    expect(
      isInventoryReservationOperatorEventRequestAuthorized(otherRequest)
    ).toBe(false);
    authorizeInventoryReservationRequest(reservationServiceRequest);
    expect(
      isInventoryReservationOperatorEventRequestAuthorized(
        reservationServiceRequest
      )
    ).toBe(false);

    const hook = InventoryReservationOperatorEvents.hooks?.beforeOperation?.[0];
    expect(hook).toBeTypeOf("function");
    await expect(
      hook?.({ operation: "create", req: otherRequest } as never)
    ).rejects.toThrow("inventory-reservation-operator-event-create-forbidden");
    await expect(
      hook?.({ operation: "create", req: reservationServiceRequest } as never)
    ).rejects.toThrow("inventory-reservation-operator-event-create-forbidden");
    await expect(
      hook?.({ operation: "create", req: request } as never)
    ).resolves.toBeUndefined();

    for (const operation of [
      "update",
      "updateByID",
      "delete",
      "deleteByID"
    ] as const) {
      await expect(
        hook?.({ operation, req: request } as never)
      ).rejects.toThrow("inventory-reservation-operator-event-immutable");
    }
  });

  it("registers the collection in the membership plugin", () => {
    const pluginSource = readFileSync(
      new URL("../../plugins/membership/plugin.ts", import.meta.url),
      "utf8"
    );
    expect(pluginSource).toContain(
      'import { InventoryReservationOperatorEvents } from "@/payload/collections/(consumption)/InventoryReservationOperatorEvents";'
    );
    expect(pluginSource).toContain(
      "InventoryReservationOperatorEvents,\n      InventoryReservationEntries\n"
    );
  });
});
