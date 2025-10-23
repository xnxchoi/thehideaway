"use client";
import { PillButton } from "@/components/UX/Button";
import { EASING } from "@/constants/animations";
import { useVaultSidebar } from "@/payload/providers/Admins";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { UIFieldClientComponent } from "payload";
import { useCallback, useEffect, useRef } from "react";
import { SidebarControls } from "./client";
const OpenPanel = m.create(PanelRightOpen);
const ClosePanel = m.create(PanelRightClose);
const SidebarControlsD: UIFieldClientComponent = (args) => {
  return <SidebarControls />;
};
export default SidebarControlsD;
