"use client";

import React, {ReactNode, useEffect} from "react";

import {useHeaderTheme} from "@/providers/HeaderTheme";
import {RPage} from "@/components/UX/Transition";
import * as m from "motion/react-m";

const PageClient = (props: { children: ReactNode }) => {
	/* Force the header to be dark mode while we have an image behind it */
	const {setHeaderTheme} = useHeaderTheme();

	useEffect(() => {
		setHeaderTheme("dark");
	}, [setHeaderTheme]);

	return (
		<RPage type="search" slug={["search"]}>
			<m.div className="py-24"> {props.children}</m.div>
		</RPage>
	);
};

export default PageClient;
