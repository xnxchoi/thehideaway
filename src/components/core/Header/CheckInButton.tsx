"use client";
import { MotionPill, MotionPillButton } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { EASING } from "@/constants/animations";
import { cn } from "@/lib/utils";
import { useRPStore } from "@/providers/RP_Pro";
import { HTMLMotionProps } from "motion/react";
import * as m from "motion/react-m";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

export const CheckInButton = ({
  className,
  ...props
}: Omit<HTMLMotionProps<"div">, "children">) => {
  const [isCheckInPage, setIsCheckInPage] = useState(false);
  const pathName = usePathname();
  useEffect(() => {
    setIsCheckInPage(
      pathName.includes("check-in") || pathName.includes("sign-in")
    );
  }, [pathName]);
  const navIsOpen = useRPStore(useShallow((r) => r.navIsOpen));

  return (
    !isCheckInPage && (
      <MotionPill
        data-state={navIsOpen}
        key={"checker"}
        className={cn(
          "rp_btn bt_sm relative hover:border-current! hover:bg-transparent! data-[state=true]:border-current!",
          className
        )}
        {...props}
      >
        <Link id={"checker"} className="absolute inset-0" href={"/sign-in"} />
        <span className={"text-[12px] select-none"}>Check In</span>
      </MotionPill>
    )
  );
};
