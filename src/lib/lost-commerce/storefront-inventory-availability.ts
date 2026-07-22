import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { requireInventoryReservationPolicyForCheckout } from "./inventory-reservation-policy";

const SKU_REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;

type AvailabilityRow = {
  sku_id?: unknown;
  available_to_promise?: unknown;
};

function normalizedSkuIds(values: readonly string[]): string[] {
  return [...new Set(values)]
    .filter((value) => SKU_REFERENCE_PATTERN.test(value))
    .sort();
}

function availabilityMap(
  rows: unknown,
  requestedSkuIds: readonly string[]
): ReadonlyMap<string, number> | undefined {
  if (!Array.isArray(rows)) return undefined;
  const requested = new Set(requestedSkuIds);
  const result = new Map<string, number>();
  for (const value of rows as AvailabilityRow[]) {
    const skuId = value?.sku_id;
    const availableToPromise = value?.available_to_promise;
    if (
      typeof skuId !== "string" ||
      !requested.has(skuId) ||
      result.has(skuId) ||
      typeof availableToPromise !== "number" ||
      !Number.isSafeInteger(availableToPromise) ||
      availableToPromise < 0
    ) {
      return undefined;
    }
    result.set(skuId, availableToPromise);
  }
  return result;
}

export async function getStorefrontInventoryAvailability(input: {
  payload: Payload;
  paymentProvider: "portone";
  skuIds: readonly string[];
}): Promise<ReadonlyMap<string, number>> {
  const skuIds = normalizedSkuIds(input.skuIds);
  if (skuIds.length === 0) return new Map();

  let policy;
  try {
    policy = requireInventoryReservationPolicyForCheckout({
      paymentProvider: input.paymentProvider
    });
  } catch {
    return new Map();
  }

  try {
    const result = (await input.payload.db.drizzle.execute(sql`
      WITH requested_skus AS (
        SELECT UNNEST(
          ARRAY[${sql.join(
            skuIds.map((skuId) => sql`${skuId}`),
            sql`, `
          )}]::uuid[]
        ) AS sku_id
      ), configured_location AS (
        SELECT id
        FROM stock_locations
        WHERE code = ${policy.locationCode}
          AND active = TRUE
        LIMIT 1
      ), active_reservations AS (
        SELECT reservation.sku_id, SUM(reservation.quantity) AS quantity
        FROM inventory_reservations AS reservation
        INNER JOIN configured_location AS location
          ON location.id = reservation.location_id
        INNER JOIN requested_skus AS requested
          ON requested.sku_id = reservation.sku_id
        WHERE reservation.status = 'active'
        GROUP BY reservation.sku_id
      )
      SELECT
        requested.sku_id::text AS sku_id,
        GREATEST(
          COALESCE(level.quantity, 0) -
          COALESCE(reservation.quantity, 0) -
          ${policy.safetyStock},
          0
        )::double precision AS available_to_promise
      FROM requested_skus AS requested
      CROSS JOIN configured_location AS location
      LEFT JOIN inventory_levels AS level
        ON level.sku_id = requested.sku_id
        AND level.location_id = location.id
        AND level.disposition = 'available'
      LEFT JOIN active_reservations AS reservation
        ON reservation.sku_id = requested.sku_id
      ORDER BY requested.sku_id
    `)) as { rows?: unknown };
    const availability = availabilityMap(result?.rows, skuIds);
    if (!availability) {
      input.payload.logger?.error?.({
        msg: "Storefront inventory availability returned invalid data",
        skuCount: skuIds.length
      });
      return new Map();
    }
    return availability;
  } catch {
    input.payload.logger?.error?.({
      msg: "Storefront inventory availability query failed",
      skuCount: skuIds.length
    });
    return new Map();
  }
}
