export type LostCursorTheme = "dark" | "light";

export function getLostPageCursorTheme(theme: string | null): LostCursorTheme {
  return theme === "light" ? "dark" : "light";
}

export function resolveLostCursorTheme({
  bagOpen,
  pageTheme,
  pointTheme,
  videoOpen
}: {
  bagOpen: boolean;
  pageTheme: LostCursorTheme;
  pointTheme?: LostCursorTheme | null;
  videoOpen: boolean;
}): LostCursorTheme {
  if (videoOpen || bagOpen) return "light";
  return pointTheme ?? pageTheme;
}

export function getLostCursorSurfaceTheme(
  value: string | undefined,
  isGlobalCursorThemeTarget: boolean
): LostCursorTheme | null {
  if (isGlobalCursorThemeTarget) return null;
  return isLostCursorTheme(value) ? value : null;
}

export function isLostCursorTheme(
  value: string | undefined
): value is LostCursorTheme {
  return value === "dark" || value === "light";
}
