import type { Field } from "payload";

// These are private settlement records. REST callers cannot mint or replace them.
const serverFieldAccess = { create: () => false, update: () => false };

export const checkoutSnapshotFields: Field[] = [
  {
    name: "checkout_snapshot",
    type: "json",
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "checkout_fingerprint",
    type: "text",
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "guest_access_digest",
    type: "text",
    hidden: true,
    access: { ...serverFieldAccess, read: () => false }
  },
  {
    name: "reconciliation_required",
    type: "checkbox",
    defaultValue: false,
    index: true,
    access: serverFieldAccess,
    admin: { readOnly: true }
  }
];

export const checkoutOrderFields: Field[] = [
  ...checkoutSnapshotFields,
  {
    name: "checkout_cart",
    type: "relationship",
    relationTo: "carts",
    unique: true,
    index: true,
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "settlement_transaction",
    type: "relationship",
    relationTo: "transactions",
    index: true,
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "settlement_effects",
    type: "json",
    access: serverFieldAccess,
    admin: { readOnly: true }
  }
];

export const checkoutTransactionFields: Field[] = [
  ...checkoutSnapshotFields,
  {
    name: "checkout_attempt_key",
    type: "text",
    unique: true,
    index: true,
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "provider_expectation",
    type: "json",
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "provider_outcome",
    type: "json",
    access: serverFieldAccess,
    admin: { readOnly: true }
  },
  {
    name: "provider_verified_at",
    type: "date",
    index: true,
    access: serverFieldAccess,
    admin: { readOnly: true }
  }
];
