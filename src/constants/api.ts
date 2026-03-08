export const ASSET_PATHS = Object.freeze({
  FONTS: "/assets/fonts/",
  ICONS: "/assets/icons/",
  IMAGES: "/assets/image/",
  VIDEOS: "/assets/video/"
});
const COPPERPLATE_BASE = "/Copperplate/Copperplate";
export const FONTFACES = Object.freeze({
  INCONSOLATA: ASSET_PATHS.FONTS + "/Inconsolata/InconsolataRegular.json",
  COPPERPLATE: {
    BOLD: ASSET_PATHS.FONTS + COPPERPLATE_BASE + " CC_Bold.json",
    HEAVY: ASSET_PATHS.FONTS + COPPERPLATE_BASE + " CC_Regular.json"
  },
  PEIGNOT: {
    LIGHT: ASSET_PATHS.FONTS + "/Peignot/Peignot LT Std Light_Regular.json",
    MEDIUM: ASSET_PATHS.FONTS + "/Peignot/Peignot LT Std Demi_Regular.json",
    BOLD: ASSET_PATHS.FONTS + "/Peignot/Peignot LT Std Demi_Bold.json"
  },
  BRICOLAGE_GROTESQUE: {
    CONDENSED:
      ASSET_PATHS.FONTS +
      "/BricolageGrotesque/Bricolage Grotesque 24pt Condensed SemiBold_Regular.json"
  }
});
