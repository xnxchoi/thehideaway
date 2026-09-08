import localFont from "next/font/local";
export const instrumentSerif = localFont({
  src: [
    {
      path: "public/assets/fonts/InstrumentSerif/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "public/assets/fonts/InstrumentSerif/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic"
    }
  ],
  variable: "--font-instrument"
});

const Caveat = localFont({
  src: [
    {
      path: "public/assets/fonts/Caveat/Caveat-VariableFont_wght.ttf",
      weight: "400",
      style: "normal"
    }
  ],
  variable: "--font-caveat"
});
const RalewayDots = localFont({
  src: [
    {
      path: "public/assets/fonts/Raleway_Dots/RalewayDots-Regular.ttf",
      weight: "400"
    }
  ],
  variable: "--font-raleway-dots"
});
const Dots = localFont({
  src: [{ path: "public/assets/fonts/Doto/Doto-Regular.ttf", weight: "400" }],
  variable: "--font-dots"
});
const Saint = localFont({
  src: [
    {
      path: "public/assets/fonts/Mrs_Saint_Delafield/MrsSaintDelafield-Regular.ttf",
      weight: "400"
    }
  ],
  variable: "--font-saint"
});
const Siegfried = localFont({
  src: [
    {
      path: "public/assets/fonts/Siegfried/Siegfried-Light.otf",
      weight: "300",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Siegfried/Siegfried-LightItalic.otf",
      weight: "300",
      style: "italic"
    },

    {
      path: "public/assets/fonts/Siegfried/Siegfried-Regular.otf",
      weight: "400",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Siegfried/Siegfried-RegularItalic.otf",
      weight: "400",
      style: "italic"
    },
    {
      path: "public/assets/fonts/Siegfried/Siegfried-Bold.otf",
      weight: "700",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Siegfried/Siegfried-BoldItalic.otf",
      weight: "700",
      style: "italic"
    },
    {
      path: "public/assets/fonts/Siegfried/Siegfried-Heavy.otf",
      weight: "900",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Siegfried/Siegfried-HeavyItalic.otf",
      weight: "900",
      style: "italic"
    }
  ],
  variable: "--font-siegfried",
  fallback: ["blase"]
});
const Suit = localFont({
  src: [
    {
      path: "public/assets/fonts/SUIT-Variable.woff2"
    }
  ],
  variable: "--font-suit"
});
const Blase = localFont({
  src: [
    {
      path: "public/assets/fonts/Blase/BlaseRegular.otf",
      weight: "400",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Blase/BlaseMedium.otf",
      weight: "500",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Blase/BlaseBold.otf",
      weight: "700",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Blase/BlaseLight.otf",
      weight: "300",
      style: "normal"
    }
  ],
  variable: "--font-blase"
});
const NarcissianNectare = localFont({
  src: [
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-Italic.woff2",
      weight: "400",
      style: "italic"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-Medium.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-MediumItalic.woff2",
      weight: "500",
      style: "italic"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-Bold.woff2",
      weight: "700",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-BoldItalic.woff2",
      weight: "700",
      style: "italic"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-SemiBold.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "public/assets/fonts/Narcissian-Nectare/NarcissianNectare-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic"
    }
  ],
  variable: "--font-narcissianNectare",
  fallback: ["blase"]
});
export {
  Blase,
  Siegfried,
  Dots,
  Caveat,
  RalewayDots,
  Suit,
  Saint,
  NarcissianNectare
};
