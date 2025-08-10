import React from "react";

import type {Header} from "@/payload-types";
import {getCachedGlobal} from "@/utilities/getGlobals";
import {HeaderClient} from "./Component.client";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import type {RP_SessionData} from "@/lib/auth/session/sessionType";

export async function Header() {
	const header: Header = (await getCachedGlobal("header", 1)()) as Header;
	const data = (await auth.api.getSession({
		headers: await headers(),
	})) as Pick<RP_SessionData, "user" | "session"> | null;

	console.log("grabbed session from api:", data);

	return <HeaderClient header={header} session={data} />;
}
