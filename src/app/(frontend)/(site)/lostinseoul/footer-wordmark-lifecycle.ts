export async function initializeLostFooterShader({
  fontsReady,
  initialize,
  isDisposed,
  onFailure,
  onReady
}: {
  fontsReady: Promise<unknown>;
  initialize: () => boolean;
  isDisposed: () => boolean;
  onFailure: () => void;
  onReady: () => void;
}): Promise<void> {
  try {
    await fontsReady;
    if (isDisposed()) return;

    const initialized = initialize();
    if (!initialized) {
      if (!isDisposed()) onFailure();
      return;
    }

    if (!isDisposed()) onReady();
  } catch {
    if (!isDisposed()) onFailure();
  }
}
