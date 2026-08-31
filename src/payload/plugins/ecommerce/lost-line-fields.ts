import type { Field } from "payload";

export const CART_LINE_SCHEMA_VERSION = 3;

export function lostLineFields(): Field[] {
  return [
    {
      name: "mode",
      type: "select",
      required: true,
      defaultValue: "standard_purchase",
      options: ["standard_purchase", "request_to_order", "private_order"],
      index: true
    },
    {
      name: "campaign",
      type: "text",
      index: true
    },
    {
      name: "schema_version",
      type: "number",
      defaultValue: CART_LINE_SCHEMA_VERSION,
      admin: { readOnly: true }
    },
    { name: "product_name", type: "text" },
    { name: "product_slug", type: "text" },
    { name: "sku", type: "text" },
    { name: "sku_label", type: "text" },
    { name: "options", type: "json" },
    {
      name: "currency",
      type: "select",
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"]
    },
    { name: "unit_amount", type: "number", min: 0 },
    { name: "line_amount", type: "number", min: 0 },
    { name: "weight_grams", type: "number", min: 0 },
    { name: "length_mm", type: "number", min: 0 },
    { name: "width_mm", type: "number", min: 0 },
    { name: "height_mm", type: "number", min: 0 },
    { name: "tax_category", type: "text" }
  ];
}

export function appendLostLineFields(fields: Field[] | undefined): Field[] {
  return (fields ?? []).map((field) => {
    if ("name" in field && field.name === "items" && field.type === "array") {
      return {
        ...field,
        fields: [...field.fields, ...lostLineFields()]
      };
    }
    if ("fields" in field && Array.isArray(field.fields)) {
      return { ...field, fields: appendLostLineFields(field.fields as Field[]) };
    }
    if ("tabs" in field && Array.isArray(field.tabs)) {
      return {
        ...field,
        tabs: field.tabs.map((tab) =>
          tab && typeof tab === "object" && "fields" in tab
            ? { ...tab, fields: appendLostLineFields(tab.fields as Field[]) }
            : tab
        )
      };
    }
    return field;
  });
}
