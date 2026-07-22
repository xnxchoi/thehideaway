import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "./commerce-commands";

export type InventoryReservationTerminalOperation =
  "consume" | "release" | "expire";

export function inventoryReservationTerminalCommandKey(input: {
  baseKey: string;
  reservationId: string;
  operation: InventoryReservationTerminalOperation;
}): string {
  return hashCommerceCommandInput({
    baseKey: validateCommerceCommandKey(input.baseKey),
    reservationId: input.reservationId,
    operation: input.operation
  });
}

export function inventoryReservationMovementKey(commandKey: string): string {
  return hashCommerceCommandInput({
    commandKey: validateCommerceCommandKey(commandKey),
    effect: "inventory-reservation-physical-consume"
  });
}
