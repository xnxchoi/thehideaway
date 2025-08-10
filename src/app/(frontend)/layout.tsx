import "../../styles/globals.css";
import "./estate.scss";
import "@/styles/hideaway.scss";
import "@/styles/reading.scss";
import "lenis/dist/lenis.css";
import {NextIntlClientProvider} from "next-intl";
import {GeistMono} from "geist/font/mono";
import {GeistSans} from "geist/font/sans";
import type {Metadata} from "next";
import {draftMode} from "next/headers";
import {cn} from "@/lib/utils";
import {LivePreviewListener} from "@/payload/components/LivePreviewListener";
import {Header} from "@components/Header/Component";
import {Providers} from "@/providers";
import {getServerSideURL} from "@/utilities/getURL";
import {mergeOpenGraph} from "@/utilities/mergeOpenGraph";
import {ReactNode} from "react";
import {TabMessenger} from "@/utilities/visibilityChange";
import {RP_Menu} from "@/components/UX/Menu";
import {EscapeInAppBrowser} from "@/components/UX/escapeInAppBrowser";
import {Toaster} from "@/components/ui/sonner";
import {ReactTempus} from "tempus/react";
import {InitTheme} from "@/providers/Theme/InitTheme";
import {Main} from "@/components/core/Main";

import {getLocale} from "next-intl/server";
import {
	Blase,
	Dots,
	NarcissianNectare,
	Saint,
	Siegfried,
	Suit,
} from "../../../fonts";
import {getContextProps} from "@/lib/auth/context/get-context-props";
import {BetterAuthProvider} from "@/lib/auth/context";

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const {isEnabled} = await draftMode();
	const serverurl = getServerSideURL();
	const locale = await getLocale();

	return (
		<html className={cn(
			Siegfried.variable,
			GeistSans.variable,
			GeistMono.variable,
			Blase.variable,
			NarcissianNectare.variable,
			Suit.variable,
			Dots.variable,
			Saint.variable,
		)} lang={locale} suppressHydrationWarning>
			<head>
				<InitTheme />
				<link href="/favicon.ico" rel="icon" sizes="32x32" />
				<link href="/favicon.svg" rel="icon" type="image/svg+xml" />
				<title>The Hideaway</title>
			</head>
			<body data-themed={"color, background-color"}>
				<NextIntlClientProvider>
					<BetterAuthProvider {...getContextProps()}>
						<Providers>
							<EscapeInAppBrowser />
							<TabMessenger>
								<Toaster />
								<LivePreviewListener />
								<Header />
								<RP_Menu />
								<Main>{children}</Main>
							</TabMessenger>
						</Providers>
					</BetterAuthProvider>
					<ReactTempus patch />
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

export const metadata: Metadata = {
	metadataBase: new URL(getServerSideURL()),
	openGraph: mergeOpenGraph(),
	twitter: {
		card: "summary_large_image",
		creator: "@",
	},
};
