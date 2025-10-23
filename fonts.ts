import localFont from "next/font/local";
import { Doto, Mrs_Saint_Delafield, Raleway_Dots } from "next/font/google";

const RalewayDots = Raleway_Dots({
  subsets: ["latin"],
  variable: "--font-raleway-dots",
  weight: "400"
});
const Dots = Doto({
  subsets: ["latin"],
  variable: "--font-dots"
});
const Saint = Mrs_Saint_Delafield({
  subsets: ["latin"],
  variable: "--font-saint",
  weight: "400"
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
export { Blase, Siegfried, Dots, RalewayDots, Suit, Saint, NarcissianNectare };
