"use client";
import React from "react";

import {useInlineBlockComponentContext} from "../index";

export const InlineBlockLabel = () => {
	const {Label} = useInlineBlockComponentContext();

	return Label ? <Label/> : null;
};
