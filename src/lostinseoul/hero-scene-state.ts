export type LostHeroPostTheme = "dark" | "light";

export function shouldPauseLostHeroVideo({
  cartOpen,
  documentHidden
}: {
  cartOpen: boolean;
  documentHidden: boolean;
}) {
  return documentHidden || cartOpen;
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
  cartOpen,
  videoOpen
}: {
  cartOpen: boolean;
  videoOpen: boolean;
}): LostHeroPostTheme {
  return cartOpen || videoOpen ? "dark" : "light";
}
