import {BlocksIcon} from "lucide-react";
import React from "react";

export function getBlockImageComponent(
	imageURL?: string,
	imageAltText?: string
) {
	if (!imageURL) {
		return BlocksIcon;
	}

	// eslint-disable-next-line react/display-name
	return () => (
		<img
			alt={imageAltText ?? "Block Image"}
			className="lexical-block-custom-image"
			src={imageURL}
			style={{maxHeight: 20, maxWidth: 20}}
		/>
	);
}
