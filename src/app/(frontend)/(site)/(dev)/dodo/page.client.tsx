"use client";

import {useRPStore} from "@/providers/RP_Pro";
import {useEffect} from "react";

export const PageClient = () => {
	const setHeaderAnimation = useRPStore((r) => r.setHeaderVisibility);
	useEffect(() => {
		setHeaderAnimation(false);
	}, []);
	return <></>;
};
