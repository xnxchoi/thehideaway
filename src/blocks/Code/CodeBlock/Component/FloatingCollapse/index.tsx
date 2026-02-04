import React from "react";

import "./index.scss";

const baseClass = "code-block-floating-collapse-button";
import {useCollapsible, useTranslation} from "@payloadcms/ui";

export const FloatingCollapse: React.FC = () => {
	const {isCollapsed, toggle} = useCollapsible();
	const {t} = useTranslation();

	if (!isCollapsed) {
		return null;
	}

	return (
		<button className={baseClass} onClick={toggle} type="button">
			<span>{t("general:collapse")}</span>
			<svg
				fill="none"
				height="15"
				viewBox="0 0 15 15"
				width="15"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M7.16667 13.8333V9.83333M7.16667 9.83333L9.16667 11.8333M7.16667 9.83333L5.16667 11.8333M7.16667 4.5V0.5M7.16667 4.5L9.16667 2.5M7.16667 4.5L5.16667 2.5M1.83333 7.16667H0.5M5.83333 7.16667H4.5M9.83333 7.16667H8.5M13.8333 7.16667H12.5"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
};
