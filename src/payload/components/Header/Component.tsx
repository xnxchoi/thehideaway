import React from "react";

import type { Header } from "@/payload-types";
import { getCachedGlobal } from "@/utilities/getGlobals";
import { HeaderClient } from "./Component.client";

export async function Header() {
  const header: Header = (await getCachedGlobal("header", 1)()) as Header;

  return <HeaderClient header={header} />;
}
