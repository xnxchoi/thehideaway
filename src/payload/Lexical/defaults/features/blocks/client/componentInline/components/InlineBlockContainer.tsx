"use client";
import React from "react";

import {useInlineBlockComponentContext} from "../index";

export const InlineBlockContainer = ({
	                                     children
                                     }: {
	children: React.ReactNode;
}) => {
	const {InlineBlockContainer} = useInlineBlockComponentContext();

	return InlineBlockContainer ? (
		<InlineBlockContainer>{children}</InlineBlockContainer>
	) : null;
};
