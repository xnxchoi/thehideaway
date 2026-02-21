import "@/styles/globals.css";
import "@/app/(frontend)/estate.scss";
import {Layout} from "@/app/(frontend)/(site)/layout.client";
import {SideDrawer} from "@/components/UX/SideDrawer";
import {RadioProvider} from "@/providers/RadioProvider";
import {getServerSideURL} from "@/utilities/getURL";
import {mergeOpenGraph} from "@/utilities/mergeOpenGraph";
import type {Metadata} from "next";
import {draftMode} from "next/headers";
import {ReactNode, Suspense} from "react";

export default async function RootLayout({
	                                         children
                                         }: {
	children: ReactNode;
}) {
	const {isEnabled} = await draftMode();
	getServerSideURL();
	return (
		<>
			<Layout>{children}</Layout>

		</>
	);
}

export const metadata: Metadata = {
	metadataBase: new URL(getServerSideURL()),
	openGraph: mergeOpenGraph(),
	twitter: {
		card: "summary_large_image",
		creator: "@thehideaway"
	}
};
