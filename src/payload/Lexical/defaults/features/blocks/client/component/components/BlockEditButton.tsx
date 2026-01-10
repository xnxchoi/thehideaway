"use client";
import React from "react";

import {useBlockComponentContext} from "../BlockContent";

export const BlockEditButton = () => {
	const {EditButton} = useBlockComponentContext();

	return EditButton ? <EditButton/> : null;
};
