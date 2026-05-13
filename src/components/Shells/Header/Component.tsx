import { getCachedGlobal } from "src/utilities/getGlobals";

import type { Header } from "src/payload-types";
import dynamic from "next/dynamic";
import React from "react";

const HeaderClient = dynamic(() =>
  import("./Component.client").then((m) => m.HeaderClient)
);

export async function Header() {
  const header: Header = (await getCachedGlobal("header", 1)) as Header;

  return <HeaderClient header={header} />;
}
