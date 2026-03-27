"use client";

import React, {ReactNode, useEffect} from "react";

import {useHeaderTheme} from "@/providers/HeaderTheme";
import * as m from "motion/react-m";

const PageClient = (props: { children: ReactNode }) => {
	/* Force the header to be dark mode while we have an image behind it */
	const {setHeaderTheme} = useHeaderTheme();
	useEffect(() => {
		setHeaderTheme("dark");
	}, [setHeaderTheme]);
	return <m.div className="py-24"> {props.children}</m.div>;
};

export default PageClient;
