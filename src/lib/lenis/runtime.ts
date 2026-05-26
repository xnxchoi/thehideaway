import type Lenis from "lenis";

let rootLenis: Lenis | null = null;
let lostLenis: Lenis | null = null;
let lostScrollY = 0;

export function setRootLenis(instance: Lenis | null) {
  rootLenis = instance;
}

export function getRootLenis() {
  return rootLenis;
}

export function setLostLenis(instance: Lenis | null) {
  lostLenis = instance;
  lostScrollY = readLenisScrollY(instance);
}

export function clearLostLenis(instance: Lenis | null) {
  if (lostLenis === instance) {
    lostLenis = null;
  }
}

export function getLostLenis() {
  return lostLenis ?? rootLenis;
}

export function readLenisScrollY(instance: Lenis | null = getLostLenis()) {
  if (typeof window === "undefined") return lostScrollY;
  return instance?.actualScroll ?? instance?.scroll ?? window.scrollY;
}

export function syncLostScrollY(instance: Lenis | null = getLostLenis()) {
  lostScrollY = readLenisScrollY(instance);
  return lostScrollY;
}

export function getLostScrollY() {
  return lostScrollY || readLenisScrollY();
}
