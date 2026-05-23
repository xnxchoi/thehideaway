import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readLocal = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const landingSource = readLocal("./index.tsx");
const immersiveSource = readLocal("./Immersive/index.tsx");
const sunLoaderSource = readLocal("./Immersive/SunLoader.tsx");
const timelineSource = readLocal("./Immersive/Timeline.tsx");
const cssSource = readLocal("./dn.css");
const enMessages = JSON.parse(
  readFileSync(new URL("../../../../messages/en.json", import.meta.url), "utf8")
);

describe("Day n Night main flow contract", () => {
  it("keeps the original immersive structure mounted", () => {
    expect(landingSource).toContain("DayCycleProvider");
    expect(landingSource).toContain("ImmersiveView");
    expect(landingSource).toContain("ViewportMask");
    expect(landingSource).toContain("ViewToggle");
    expect(landingSource).toContain("ExitAffordance");
    expect(landingSource).not.toContain("<DayNNightMainPage");
  });

  it("maps the five visual acts to the new content flow", () => {
    const labels = enMessages.Event.DayNNight.scrubber;

    expect(labels.opening).toBe("Intro");
    expect(labels.cookout).toBe("Details");
    expect(labels.dress).toBe("Our friends");
    expect(labels.night).toBe("Music by YM.FM");
    expect(labels.closing).toBe("RSVP");
  });

  it("keeps FriendsTorrent for friends and moves YM.FM to the music act", () => {
    expect(immersiveSource).toContain("FriendsTorrent");
    expect(immersiveSource).toContain("YMFMCredit");
    expect(immersiveSource).toContain("ACT_INDEX_DRESS");
    expect(immersiveSource).toContain("ACT_INDEX_NIGHT");
    expect(immersiveSource).toContain("const nightWindow = useActWindowActive");
    expect(immersiveSource).toContain("const ymfmVisible = nightWindow.active");
  });

  it("uses the new detailed offerings inside the restored timeline", () => {
    expect(timelineSource).toContain('useTranslations("Event.DayNNight.main")');
    expect(timelineSource).toContain('mainT("details.price")');
    expect(timelineSource).toContain('mainT("offerings.grill.body")');
    expect(timelineSource).toContain('mainT("offerings.ferments.body")');
    expect(timelineSource).toContain('mainT("offerings.cocktails.body")');
    expect(timelineSource).not.toContain("A generous rooftop spread");
  });

  it("keeps the loader backdrop from blocking ready-state actions", () => {
    expect(sunLoaderSource).toContain(
      "pointer-events-none absolute inset-0 bg-faded-black/99"
    );
  });

  it("lets mobile acts use the full phone width instead of desktop grid columns", () => {
    expect(cssSource).toContain("@media (max-width: 1023px)");
    expect(cssSource).toContain("[data-dn-act] > div > *");
    expect(cssSource).toContain("grid-column: 1 / -1 !important");
    expect(cssSource).toContain("grid-row: auto !important");
  });
});
