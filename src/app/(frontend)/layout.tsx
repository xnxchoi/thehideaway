import {Toaster} from "@/components/ui/sonner";
import {EscapeInAppBrowser} from "@/components/UX/escapeInAppBrowser";
import {RP_Menu} from "@/components/UX/Menu";

// Client Components (imported dynamically to create islands)
import {ScrollIndicator} from "@/components/UX/ScrollIndicator";

import {BetterAuthProvider} from "@/lib/auth/context";
import {getContextProps} from "@/lib/auth/context/get-context-props";
import {cn} from "@/lib/utils";
import {Header} from "@/payload/components/Header/Component";
import {LivePreviewListener} from "@/payload/components/LivePreviewListener";
import {InitTheme} from "@/providers/Theme/InitTheme";
import "@/styles/hideaway.scss";
import "@/styles/reading.scss";
import {getServerSideURL} from "@/utilities/getURL";
import {mergeOpenGraph} from "@/utilities/mergeOpenGraph";
import {GeistMono} from "geist/font/mono";
import {GeistSans} from "geist/font/sans";
import "lenis/dist/lenis.css";
import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getLocale} from "next-intl/server";
import {ReactNode} from "react";
import {ReactTempus} from "tempus/react";
import "../../styles/globals.css";
import "./estate.scss";
import {Blase, Dots, NarcissianNectare, Saint, Siegfried, Suit} from "../../../fonts";
import {ClientLayout} from "./ClientLayout";
import {ClientProviders} from "./ClientProviders";

export default async function RootLayout({
	                                         children
                                         }: {
	children: ReactNode;
}) {
	const locale = await getLocale();

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={cn(
				Siegfried.variable,
				GeistSans.variable,
				GeistMono.variable,
				Blase.variable,
				NarcissianNectare.variable,
				Suit.variable,
				Dots.variable,
				Saint.variable
			)}
		>
		<head>
			<InitTheme/>
			<link href="/favicon.ico" rel="icon" sizes="32x32"/>
			<link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
			<title>The Hideaway</title>
		</head>
		<body data-themed={"color, background-color"}>
		<NextIntlClientProvider>
			<BetterAuthProvider {...getContextProps()}>
				<ClientProviders>
					{/* Server-rendered components */}
					<EscapeInAppBrowser/>
					<Toaster/>
					<LivePreviewListener/>
					<Header/>
					<RP_Menu/>
					<ScrollIndicator/>

					<ClientLayout>{children}</ClientLayout>
				</ClientProviders>
				<ReactTempus patch/>
			</BetterAuthProvider>
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
		creator: "@"
	}
};
