export type LostFragranceSceneMode = "r3f" | "legacy";

export function getLostFragranceSceneMode(
  search: string
): LostFragranceSceneMode {
  return new URLSearchParams(search).get("scene") === "legacy"
    ? "legacy"
    : "r3f";
}
