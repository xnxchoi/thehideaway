"use client";
import { PillButton } from "@/components/UX/Button";
import { EASING } from "@/constants/animations";
import { useVaultSidebar } from "@/payload/providers/Admins";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef } from "react";
import "./index.scss";
const OpenPanel = m.create(PanelRightOpen);
const ClosePanel = m.create(PanelRightClose);
export const SidebarControls = () => {
  const toggle = useVaultSidebar((store) => store.toggle);
  const open = useVaultSidebar((store) => store.open);
  const setPeeked = useVaultSidebar((r) => r.setPeeked);
  const sbRef = useRef<HTMLDivElement>(null!);
  const controlWrapRef = useRef<HTMLDivElement>(null!);
  const held = useVaultSidebar((store) => store.held);
  const setHeld = useVaultSidebar((store) => store.setHeld);
  const stateRef = useRef(open);
  useEffect(() => {
    stateRef.current = open;
  }, [open]);

  const onClickCB = useCallback(() => {
    if (stateRef.current) {
      setHeld(true);
    }
    toggle();
  }, [setHeld, toggle]);

  return (
    <m.div
      className="alt-doc-controls"
      ref={controlWrapRef}
      initial={{
        scaleX: 0,
        opacity: -0
      }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{
        scaleX: 0,
        opacity: 0
      }}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={onClickCB}
        className={
	        "flex h-16 min-w-24 appearance-none items-center justify-center overflow-hidden rounded-[25px] border-off-foreground/10 bg-transparent px-6 text-sm leading-[2] hover:bg-neutral-white/10 [&_svg]:size-8"
        }
      >
        <AnimatePresence initial={false}>
          {open ? (
            <ClosePanel
              style={{
                strokeWidth: 1
              }}
              whileHover={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASING.power3.out }}
            />
          ) : (
            <OpenPanel
              style={{
                strokeWidth: 1
              }}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASING.power3.out }}
            />
          )}
        </AnimatePresence>
      </span>
    </m.div>
  );
};
