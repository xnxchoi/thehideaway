"use client";

import {useRPStore} from "@/providers/RP_Pro";
import {useRouter} from "next/navigation";
import * as m from "motion/react-m";

export const Redirect = ({href}: { href: string }) => {
	const setPageIsTransitioning = useRPStore((l) => l.setPageIsTransitioning);
	const router = useRouter();
	setPageIsTransitioning(true);
	setTimeout(() => {
		router.push(href);
	}, 300);
	return (
		<m.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{opacity: 0}}
		       animate={{opacity: 1, zIndex: 1000}} exit={{opacity: 0, zIndex: 0}}
		       transition={{duration: 0.5, ease: "easeInOut"}} />
	);
};
