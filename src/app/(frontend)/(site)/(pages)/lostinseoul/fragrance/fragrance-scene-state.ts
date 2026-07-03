export function shouldPauseLostFragranceScene({
  bagOpen,
  documentHidden
}: {
  bagOpen: boolean;
  documentHidden: boolean;
}) {
  return documentHidden || bagOpen;
}

export function shouldRenderLostFragranceFrame({
  documentHidden,
  inViewport
}: {
  documentHidden: boolean;
  inViewport: boolean;
}) {
  return !documentHidden && inViewport;
}
