import {FrontImage} from "@/components/UX/Media/FrontImage";
import React, {Fragment} from "react";

import type {MediaProps} from "./types";
import {VideoMedia} from "./VideoMedia";

export const Media: React.FC<MediaProps> = (props) => {
	const {className, htmlElement = "div", resource} = props;

	const isVideo =
		!!resource && typeof resource === "object" && "mimeType" in resource && resource?.mimeType?.includes("video");
	const Tag = (htmlElement as any) || Fragment;

	return (
		<Tag
			{...(htmlElement !== null
				? {
					className
				}
				: {})}
		>
			{isVideo ? (
				<VideoMedia {...props} />
			) : (
				< FrontImage  {...props}/>
			)}
		</Tag>
	);
};
