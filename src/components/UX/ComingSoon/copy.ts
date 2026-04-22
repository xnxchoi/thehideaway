export const CHIP_KEYS = [
  "default",
  "draft",
  "soon",
  "queued",
  "wetInk",
  "backstage",
  "nearly",
  "patience"
] as const;
export type ChipLabel = (typeof CHIP_KEYS)[number];

export const DISPATCH_KEYS = [
  "default",
  "backstage",
  "composing",
  "argued",
  "honest"
] as const;
export type DispatchKey = (typeof DISPATCH_KEYS)[number];

export const TOOLTIP_KEYS = ["composition", "wetInk", "editor"] as const;
export type TooltipKey = (typeof TOOLTIP_KEYS)[number];

export const TOAST_KEYS = ["notYet", "nearly", "tryLater", "locked"] as const;
export type ToastKey = (typeof TOAST_KEYS)[number];
