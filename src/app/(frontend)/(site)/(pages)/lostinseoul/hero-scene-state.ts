export type LostHeroPostTheme = "dark" | "light";

export function shouldPauseLostHeroVideo({
  bagOpen,
  documentHidden
}: {
  bagOpen: boolean;
  documentHidden: boolean;
}) {
  return documentHidden || bagOpen;
}

export function shouldRenderLostHeroFrame({
  documentHidden,
  inViewport
}: {
  documentHidden: boolean;
  inViewport: boolean;
}) {
  return !documentHidden && inViewport;
}

export function getLostHeroPostTheme({
  bagOpen,
  videoOpen
}: {
  bagOpen: boolean;
  videoOpen: boolean;
}): LostHeroPostTheme {
  return bagOpen || videoOpen ? "dark" : "light";
}
