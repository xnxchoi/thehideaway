"use client";

import { Menu } from "@base-ui/react";

/**
 * Shared Base UI handle for the RP context menu. Living in its own module so
 * contributors can open the menu programmatically (e.g. a toolbar button
 * showing the same set of items at a known anchor).
 */
export const RPContextMenuHandle = Menu.createHandle();
